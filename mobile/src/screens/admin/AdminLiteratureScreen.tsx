import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, StatusBar, ActivityIndicator, RefreshControl,
    Modal, ScrollView, TouchableWithoutFeedback, Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api.service';
import AdminHeader from '../../components/AdminHeader';
import { scale, vs, ms } from '../../utils/responsive';

/* ── Types ──────────────────────────────────────────────────────────── */
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface Study {
    _id: string;
    title: string;
    authors: string[];
    abstract?: string;
    methodology?: string;
    keyFindings?: string;
    toolsUsed?: string[];
    keywords?: string[];
    category?: string;
    studyType?: string;
    yearPublished?: number;
    downloadCount?: number;
    viewCount?: number;
    approvalStatus: ApprovalStatus;
    rejectionReason?: string;
    fileUrl?: string;
    systemImageUrl?: string;
    uploadedBy?: string;
    uploader?: {
        displayName?: string;
        studentNumber?: string;
        yearLevel?: number;
        program?: string;
        email?: string;
    } | null;
    createdAt: string;
}

/* ── Helpers ────────────────────────────────────────────────────────── */
function statusBadge(s: ApprovalStatus) {
    if (s === 'approved') return { label: 'Approved', color: '#16A34A', bg: '#DCFCE7' };
    if (s === 'rejected') return { label: 'Rejected', color: '#DC2626', bg: '#FEE2E2' };
    return { label: 'Pending', color: '#B45309', bg: '#FEF3C7' };
}

function typeBadge(t?: string) {
    const type = t ?? 'Thesis';
    if (type === 'Project')     return { label: type, color: '#fff', bg: '#0E1F43' };
    if (type === 'Dissertation')return { label: type, color: '#fff', bg: '#7C3AED' };
    return { label: type, color: '#fff', bg: '#1E3A5F' }; // Thesis default
}

/* ── Screen ─────────────────────────────────────────────────────────── */
const AdminLiteratureScreen: React.FC = () => {
    const [studies, setStudies]       = useState<Study[]>([]);
    const [loading, setLoading]       = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch]         = useState('');
    const [filter, setFilter]         = useState<StatusFilter>('all');
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Detail modal
    const [selected, setSelected]     = useState<Study | null>(null);
    const [modalVisible, setModal]    = useState(false);

    // PDF viewer
    const [pdfUrl, setPdfUrl]             = useState<string | null>(null);
    const [pdfVisible, setPdfVisible]     = useState(false);

    // Confirm dialogs
    const [approveDialog, setApproveDialog] = useState(false);
    const [rejectDialog, setRejectDialog]   = useState(false);
    const [rejectReason, setRejectReason]   = useState('');
    const [acting, setActing]               = useState(false);

    /* Fetch ──────────────────────────────────────────────────────────── */
    const fetchStudies = useCallback(async (q: string, s: StatusFilter, isRefresh: boolean) => {
        if (!isRefresh) setLoading(true);
        try {
            const params: Record<string, string> = { limit: '60' };
            if (q.trim())   params.search = q.trim();
            if (s !== 'all') params.status = s;
            const res = await api.get('/admin/literature', { params });
            setStudies(res.data.studies ?? []);
        } catch (err) {
            console.error('fetchStudies error', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchStudies(search, filter, false); }, [fetchStudies, filter]));

    const onSearch = (text: string) => {
        setSearch(text);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => fetchStudies(text, filter, false), 400);
    };
    const onRefresh = () => { setRefreshing(true); fetchStudies(search, filter, true); };

    /* Actions ────────────────────────────────────────────────────────── */
    const doApprove = async () => {
        if (!selected) return;
        setActing(true);
        try {
            await api.patch(`/admin/literature/${selected._id}/approve`);
            const updated: Study = { ...selected, approvalStatus: 'approved', rejectionReason: undefined };
            setSelected(updated);
            setStudies(prev => prev.map(s => s._id === updated._id ? updated : s));
        } catch (err) {
            console.error('approve error', err);
        } finally {
            setActing(false);
            setApproveDialog(false);
        }
    };

    const doReject = async () => {
        if (!selected) return;
        setActing(true);
        try {
            await api.patch(`/admin/literature/${selected._id}/reject`, { reason: rejectReason });
            const updated: Study = { ...selected, approvalStatus: 'rejected', rejectionReason: rejectReason };
            setSelected(updated);
            setStudies(prev => prev.map(s => s._id === updated._id ? updated : s));
        } catch (err) {
            console.error('reject error', err);
        } finally {
            setActing(false);
            setRejectDialog(false);
            setRejectReason('');
        }
    };

    const openModal = (study: Study) => { setSelected(study); setModal(true); };
    const closeModal = () => { setModal(false); setTimeout(() => setSelected(null), 300); };

    /* Tab filter ─────────────────────────────────────────────────────── */
    const TABS: { key: StatusFilter; label: string }[] = [
        { key: 'all',      label: 'All' },
        { key: 'pending',  label: 'Pending' },
        { key: 'approved', label: 'Approved' },
    ];

    /* Card ───────────────────────────────────────────────────────────── */
    const renderCard = ({ item }: { item: Study }) => {
        const sB = statusBadge(item.approvalStatus);
        const tB = typeBadge(item.studyType);
        return (
            <TouchableOpacity style={styles.card} onPress={() => openModal(item)} activeOpacity={0.8}>
                <View style={styles.cardBadgeRow}>
                    <View style={[styles.badge, { backgroundColor: tB.bg }]}>
                        <Text style={[styles.badgeText, { color: tB.color }]}>{tB.label}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: sB.bg }]}>
                        <Text style={[styles.badgeText, { color: sB.color }]}>{sB.label}</Text>
                    </View>
                </View>

                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

                {item.authors && item.authors.length > 0 && (
                    <View style={styles.authorsRow}>
                        <Ionicons name="person-outline" size={ms(11)} color="#9AADCA" />
                        <Text style={styles.authorsText} numberOfLines={1}>
                            {item.authors.join(', ')}
                        </Text>
                    </View>
                )}

                {!!item.abstract && (
                    <Text style={styles.abstractSnippet} numberOfLines={2}>{item.abstract}</Text>
                )}

                <View style={styles.cardStats}>
                    {item.viewCount !== undefined && (
                        <View style={styles.stat}>
                            <Ionicons name="eye-outline" size={ms(11)} color="#9AADCA" />
                            <Text style={styles.statText}>{item.viewCount}</Text>
                        </View>
                    )}
                    {item.downloadCount !== undefined && (
                        <View style={styles.stat}>
                            <Ionicons name="download-outline" size={ms(11)} color="#9AADCA" />
                            <Text style={styles.statText}>{item.downloadCount}</Text>
                        </View>
                    )}
                    {!!item.yearPublished && (
                        <View style={styles.stat}>
                            <Ionicons name="calendar-outline" size={ms(11)} color="#9AADCA" />
                            <Text style={styles.statText}>{item.yearPublished}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    /* ── Render ─────────────────────────────────────────────────────── */
    const sB = selected ? statusBadge(selected.approvalStatus) : statusBadge('pending');
    const tB = selected ? typeBadge(selected.studyType) : typeBadge();
    const isApproved = selected?.approvalStatus === 'approved';
    const isRejected = selected?.approvalStatus === 'rejected';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#ECEEF8" />
            <AdminHeader />

            <View style={styles.content}>
                <Text style={styles.title}>Literature Approval</Text>

                {/* Search */}
                <View style={styles.searchBox}>
                    <Ionicons name="search-outline" size={ms(16)} color="#9AADCA" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by title or author..."
                        placeholderTextColor="#9AADCA"
                        value={search}
                        onChangeText={onSearch}
                        returnKeyType="search"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => { setSearch(''); fetchStudies('', filter, false); }}>
                            <Ionicons name="close-circle" size={ms(16)} color="#9AADCA" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Tabs */}
                <View style={styles.tabRow}>
                    {TABS.map(t => (
                        <TouchableOpacity
                            key={t.key}
                            style={[styles.tab, filter === t.key && styles.tabActive]}
                            onPress={() => { setFilter(t.key); fetchStudies(search, t.key, false); }}
                            activeOpacity={0.75}
                        >
                            <Text style={[styles.tabText, filter === t.key && styles.tabTextActive]}>
                                {t.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* List */}
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#0E1F43" />
                    </View>
                ) : (
                    <FlatList
                        data={studies}
                        keyExtractor={item => item._id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0E1F43']} tintColor="#0E1F43" />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyBox}>
                                <Ionicons name="document-text-outline" size={ms(42)} color="#C8D0E0" />
                                <Text style={styles.emptyTitle}>No submissions found</Text>
                                <Text style={styles.emptySub}>
                                    Research submissions from 4th year students will appear here.
                                </Text>
                            </View>
                        }
                        renderItem={renderCard}
                    />
                )}
            </View>

            {/* ── Detail Modal ────────────────────────────────────────── */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={closeModal}
            >
                <TouchableWithoutFeedback onPress={closeModal}>
                    <View style={styles.modalOverlay} />
                </TouchableWithoutFeedback>
                <View style={styles.modalSheet}>
                    {selected && (
                        <>
                            <ScrollView
                                style={styles.modalScroll}
                                contentContainerStyle={styles.modalScrollContent}
                                showsVerticalScrollIndicator={false}
                            >
                                {/* Handle + close */}
                                <View style={styles.modalHandle} />
                                <TouchableOpacity style={styles.modalClose} onPress={closeModal}>
                                    <Ionicons name="close" size={ms(20)} color="#0E1F43" />
                                </TouchableOpacity>

                                {/* System Image */}
                                <View style={styles.sysImageBox}>
                                    {selected.systemImageUrl ? (
                                        <Image
                                            source={{ uri: selected.systemImageUrl }}
                                            style={styles.sysImage}
                                            resizeMode="cover"
                                            onError={() => {}}
                                        />
                                    ) : (
                                        <View style={styles.sysImagePlaceholder}>
                                            <Ionicons name="image-outline" size={ms(32)} color="#D1D9EE" />
                                            <Text style={styles.sysImagePlaceholderText}>No system image uploaded</Text>
                                        </View>
                                    )}
                                    <View style={styles.sysImageLabel}>
                                        <Ionicons name="image-outline" size={ms(11)} color="#6B7A99" />
                                        <Text style={styles.sysImageLabelText}>System Screenshot / Logo</Text>
                                    </View>
                                </View>

                                {/* Badges */}
                                <View style={[styles.cardBadgeRow, { marginTop: vs(8) }]}>
                                    <View style={[styles.badge, { backgroundColor: tB.bg }]}>
                                        <Text style={[styles.badgeText, { color: tB.color }]}>{tB.label}</Text>
                                    </View>
                                    <View style={[styles.badge, { backgroundColor: sB.bg }]}>
                                        <Text style={[styles.badgeText, { color: sB.color }]}>{sB.label}</Text>
                                    </View>
                                    {!!selected.category && (
                                        <View style={[styles.badge, { backgroundColor: '#EEF1F8' }]}>
                                            <Text style={[styles.badgeText, { color: '#5A6A8A' }]}>{selected.category}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Title */}
                                <Text style={styles.modalTitle}>{selected.title}</Text>

                                {/* Meta grid */}
                                <View style={styles.metaGrid}>
                                    {!!selected.yearPublished && (
                                        <View style={styles.metaItem}>
                                            <Ionicons name="calendar-outline" size={ms(13)} color="#9AADCA" />
                                            <Text style={styles.metaValue}>{selected.yearPublished}</Text>
                                            <Text style={styles.metaKey}>Year</Text>
                                        </View>
                                    )}
                                    <View style={styles.metaItem}>
                                        <Ionicons name="eye-outline" size={ms(13)} color="#9AADCA" />
                                        <Text style={styles.metaValue}>{selected.viewCount ?? 0}</Text>
                                        <Text style={styles.metaKey}>Views</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="download-outline" size={ms(13)} color="#9AADCA" />
                                        <Text style={styles.metaValue}>{selected.downloadCount ?? 0}</Text>
                                        <Text style={styles.metaKey}>Downloads</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="time-outline" size={ms(13)} color="#9AADCA" />
                                        <Text style={styles.metaValue}>
                                            {new Date(selected.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </Text>
                                        <Text style={styles.metaKey}>Submitted</Text>
                                    </View>
                                </View>

                                {/* Uploader info card */}
                                {!!selected.uploader && (
                                    <View style={styles.uploaderCard}>
                                        <View style={styles.uploaderAvatar}>
                                            <Text style={styles.uploaderAvatarText}>
                                                {(selected.uploader.displayName ?? 'U').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.uploaderName}>{selected.uploader.displayName ?? 'Unknown'}</Text>
                                            <Text style={styles.uploaderMeta}>
                                                {[selected.uploader.program, selected.uploader.yearLevel ? `Year ${selected.uploader.yearLevel}` : null, selected.uploader.studentNumber].filter(Boolean).join(' · ')}
                                            </Text>
                                        </View>
                                        <View style={styles.uploaderBadge}>
                                            <Text style={styles.uploaderBadgeText}>Uploader</Text>
                                        </View>
                                    </View>
                                )}

                                {/* Authors */}
                                {selected.authors && selected.authors.length > 0 && (
                                    <View style={styles.section}>
                                        <View style={styles.sectionLabelRow}>
                                            <Ionicons name="people-outline" size={ms(11)} color="#9AADCA" />
                                            <Text style={styles.sectionLabel}>AUTHORS</Text>
                                        </View>
                                        {selected.authors.map((a, i) => (
                                            <View key={i} style={styles.authorRow}>
                                                <View style={styles.authorDot} />
                                                <Text style={styles.sectionBody}>{a}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* Abstract */}
                                {!!selected.abstract && (
                                    <View style={styles.section}>
                                        <Text style={styles.sectionLabel}>ABSTRACT</Text>
                                        <Text style={styles.sectionBody}>{selected.abstract}</Text>
                                    </View>
                                )}

                                {/* Methodology */}
                                {!!selected.methodology && (
                                    <View style={styles.section}>
                                        <View style={styles.sectionLabelRow}>
                                            <Ionicons name="flask-outline" size={ms(11)} color="#9AADCA" />
                                            <Text style={styles.sectionLabel}>METHODOLOGY</Text>
                                        </View>
                                        <Text style={styles.sectionBody}>{selected.methodology}</Text>
                                    </View>
                                )}

                                {/* Key Findings */}
                                {!!selected.keyFindings && (
                                    <View style={styles.section}>
                                        <View style={styles.sectionLabelRow}>
                                            <Ionicons name="bulb-outline" size={ms(11)} color="#9AADCA" />
                                            <Text style={styles.sectionLabel}>KEY FINDINGS</Text>
                                        </View>
                                        <Text style={styles.sectionBody}>{selected.keyFindings}</Text>
                                    </View>
                                )}

                                {/* Tools Used */}
                                {selected.toolsUsed && selected.toolsUsed.length > 0 && (
                                    <View style={styles.section}>
                                        <View style={styles.sectionLabelRow}>
                                            <Ionicons name="construct-outline" size={ms(11)} color="#9AADCA" />
                                            <Text style={styles.sectionLabel}>TOOLS &amp; TECHNOLOGIES</Text>
                                        </View>
                                        <View style={styles.chipRow}>
                                            {selected.toolsUsed.map(t => (
                                                <View key={t} style={styles.toolChip}>
                                                    <Text style={styles.toolChipText}>{t}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Keywords */}
                                {selected.keywords && selected.keywords.length > 0 && (
                                    <View style={styles.section}>
                                        <View style={styles.sectionLabelRow}>
                                            <Ionicons name="pricetag-outline" size={ms(11)} color="#9AADCA" />
                                            <Text style={styles.sectionLabel}>KEYWORDS</Text>
                                        </View>
                                        <View style={styles.chipRow}>
                                            {selected.keywords.map(k => (
                                                <View key={k} style={styles.kwChip}>
                                                    <Text style={styles.kwChipText}>{k}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Rejection reason */}
                                {isRejected && !!selected.rejectionReason && (
                                    <View style={styles.rejectionBox}>
                                        <View style={styles.rejectionHeader}>
                                            <Ionicons name="warning-outline" size={ms(14)} color="#DC2626" />
                                            <Text style={styles.rejectionTitle}>Rejection Reason</Text>
                                        </View>
                                        <Text style={styles.rejectionBody}>{selected.rejectionReason}</Text>
                                    </View>
                                )}

                                {/* View PDF */}
                                {!!selected.fileUrl && (
                                    <TouchableOpacity
                                        style={styles.pdfBtn}
                                        onPress={() => { setPdfUrl(selected.fileUrl!); setPdfVisible(true); }}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="document-text-outline" size={ms(16)} color="#0E1F43" />
                                        <Text style={styles.pdfBtnText}>View Full PDF</Text>
                                        <Ionicons name="chevron-forward-outline" size={ms(13)} color="#9AADCA" />
                                    </TouchableOpacity>
                                )}

                                <View style={{ height: vs(8) }} />
                            </ScrollView>

                            {/* Action bar — context-aware */}
                            {isApproved ? (
                                <View style={styles.statusBar}>
                                    <Ionicons name="checkmark-circle" size={ms(18)} color="#16A34A" />
                                    <Text style={styles.statusBarText}>Approved</Text>
                                </View>
                            ) : isRejected ? (
                                <View style={styles.modalActions}>
                                    <View style={[styles.statusBarInline, { flex: 1 }]}>
                                        <Ionicons name="close-circle" size={ms(16)} color="#DC2626" />
                                        <Text style={styles.statusBarInlineText}>Rejected</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.actionBtnApproveOutline, { flex: 1 }]}
                                        onPress={() => setApproveDialog(true)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="checkmark-circle-outline" size={ms(16)} color="#16A34A" />
                                        <Text style={[styles.actionBtnText, { color: '#16A34A' }]}>Approve</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.actionBtnApproveOutline]}
                                        onPress={() => setApproveDialog(true)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="checkmark-circle-outline" size={ms(16)} color="#16A34A" />
                                        <Text style={[styles.actionBtnText, { color: '#16A34A' }]}>Approve</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.actionBtnRejectOutline]}
                                        onPress={() => setRejectDialog(true)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="close-outline" size={ms(16)} color="#DC2626" />
                                        <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Reject</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </>
                    )}
                </View>
            </Modal>

            {/* ── In-App PDF Viewer ────────────────────────────────────── */}
            <Modal
                visible={pdfVisible}
                animationType="slide"
                onRequestClose={() => setPdfVisible(false)}
                statusBarTranslucent
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: '#0E1F43' }}>
                    <View style={styles.pdfHeader}>
                        <TouchableOpacity onPress={() => setPdfVisible(false)} style={styles.pdfCloseBtn}>
                            <Ionicons name="arrow-back" size={ms(20)} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.pdfHeaderTitle} numberOfLines={1}>
                            {selected?.title ?? 'Document'}
                        </Text>
                    </View>
                    {pdfUrl && (
                        <WebView
                            source={{
                                html: `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=4.0, user-scalable=yes">
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html{height:100%}
body{
  min-height:100%;background:#e8ecf2;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  overflow-x:hidden;
}
#splash{
  position:fixed;inset:0;z-index:200;
  background:#0e1f43;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;
  transition:opacity .4s;
}
#splash.hide{opacity:0;pointer-events:none}
.big-spinner{
  width:48px;height:48px;border-radius:50%;
  border:4px solid rgba(255,255,255,0.2);
  border-top-color:#fff;
  animation:spin .8s linear infinite;
}
#splashLabel{color:rgba(255,255,255,0.7);font-size:14px;font-weight:500;letter-spacing:0.3px}
#splashProgress{width:160px;height:3px;background:rgba(255,255,255,0.15);border-radius:2px;overflow:hidden}
#splashBar{height:100%;background:#fff;border-radius:2px;width:0%;transition:width .3s ease}
#errorBox{
  position:fixed;inset:0;z-index:300;background:#fff;
  display:none;flex-direction:column;align-items:center;justify-content:center;
  gap:12px;padding:32px;text-align:center;
}
#errorBox svg{opacity:.35}
#errorTitle{font-size:17px;font-weight:700;color:#0e1f43}
#errorMsg{font-size:13px;color:#9aadca;line-height:1.6}
#badge{
  position:fixed;bottom:20px;right:16px;z-index:150;
  background:rgba(14,31,67,0.88);
  color:#fff;font-size:12px;font-weight:700;letter-spacing:0.5px;
  padding:6px 13px;border-radius:20px;
  backdrop-filter:blur(8px);
  box-shadow:0 4px 16px rgba(0,0,0,0.28);
  opacity:0;transition:opacity .25s;
  pointer-events:none;
}
#badge.show{opacity:1}
#pages{
  padding:12px 10px 80px;
  display:flex;flex-direction:column;
  align-items:center;gap:10px;
}
.page-card{
  width:100%;
  background:#fff;
  border-radius:4px;
  overflow:hidden;
  box-shadow:0 2px 12px rgba(0,0,0,0.14);
  position:relative;
}
.page-card canvas{display:block;width:100%;height:auto}
.page-placeholder{
  width:100%;background:#f0f2f5;
  display:flex;align-items:center;justify-content:center;
}
.page-placeholder .mini-spin{
  width:22px;height:22px;border-radius:50%;
  border:2px solid #dde3f0;border-top-color:#0e1f43;
  animation:spin .7s linear infinite;
}
.page-num{
  position:absolute;bottom:8px;right:10px;
  font-size:10px;color:rgba(0,0,0,0.22);
  font-weight:600;user-select:none;
}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div id="splash">
  <div class="big-spinner"></div>
  <span id="splashLabel">Loading document…</span>
  <div id="splashProgress"><div id="splashBar"></div></div>
</div>
<div id="errorBox">
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#0e1f43" stroke-width="1.5">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r=".5" fill="#0e1f43"/>
  </svg>
  <div id="errorTitle">Could not load document</div>
  <div id="errorMsg"></div>
</div>
<div id="badge">1 / 1</div>
<div id="pages"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
(function(){
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const PDF_URL   = decodeURIComponent('${encodeURIComponent(pdfUrl)}');
  const DPR       = Math.min(window.devicePixelRatio || 1, 3);
  const GUTTER    = 20;
  const CSS_WIDTH = window.innerWidth - GUTTER;
  const splash    = document.getElementById('splash');
  const splashBar = document.getElementById('splashBar');
  const badge     = document.getElementById('badge');
  const pages     = document.getElementById('pages');
  let totalPages  = 0, badgeTimer = null;
  function showBadge(text){
    badge.textContent = text;
    badge.classList.add('show');
    clearTimeout(badgeTimer);
    badgeTimer = setTimeout(() => badge.classList.remove('show'), 2000);
  }
  const visObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.intersectionRatio > 0.3) showBadge(e.target.dataset.page + ' / ' + totalPages);
    });
  }, { threshold:[0.3,0.6] });
  function renderPageIntoCard(pdf, num, card){
    pdf.getPage(num).then(page => {
      const baseVp = page.getViewport({scale:1});
      const scale  = (CSS_WIDTH / baseVp.width) * DPR;
      const vp     = page.getViewport({scale});
      const ph     = card.querySelector('.page-placeholder');
      if(ph) ph.remove();
      const canvas = document.createElement('canvas');
      canvas.width = vp.width; canvas.height = vp.height;
      canvas.style.width = CSS_WIDTH + 'px';
      canvas.style.height = (vp.height/DPR) + 'px';
      card.appendChild(canvas);
      page.render({canvasContext:canvas.getContext('2d'), viewport:vp});
    });
  }
  function buildPages(pdf){
    totalPages = pdf.numPages;
    pdf.getPage(1).then(pg => {
      const vp  = pg.getViewport({scale:1});
      const cssH = (CSS_WIDTH / vp.width) * vp.height;
      for(let i=1; i<=totalPages; i++){
        const card = document.createElement('div');
        card.className='page-card'; card.style.width=CSS_WIDTH+'px'; card.dataset.page=i;
        const ph = document.createElement('div');
        ph.className='page-placeholder'; ph.style.height=cssH+'px';
        ph.innerHTML='<div class="mini-spin"></div>';
        card.appendChild(ph);
        const pn = document.createElement('div');
        pn.className='page-num'; pn.textContent=i;
        card.appendChild(pn);
        pages.appendChild(card);
        visObserver.observe(card);
      }
      const lazyObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if(e.isIntersecting && !e.target.dataset.rendered){
            e.target.dataset.rendered='1';
            renderPageIntoCard(pdf, +e.target.dataset.page, e.target);
          }
        });
      }, {rootMargin:'250px'});
      document.querySelectorAll('.page-card').forEach(c => lazyObs.observe(c));
      splashBar.style.width='100%';
      setTimeout(() => splash.classList.add('hide'), 350);
      showBadge('1 / ' + totalPages);
    });
  }
  const task = pdfjsLib.getDocument({url:PDF_URL, withCredentials:false});
  task.onProgress = ({loaded,total}) => {
    if(total>0) splashBar.style.width = Math.round((loaded/total)*90)+'%';
  };
  task.promise.then(buildPages).catch(err => {
    splash.classList.add('hide');
    const eb = document.getElementById('errorBox');
    eb.style.display='flex';
    document.getElementById('errorMsg').textContent = err.message;
  });
})();
</script>
</body>
</html>`,
                            }}
                            style={{ flex: 1, backgroundColor: '#e8ecf2' }}
                            originWhitelist={['*']}
                            javaScriptEnabled
                            startInLoadingState
                            renderLoading={() => (
                                <View style={styles.pdfLoading}>
                                    <ActivityIndicator size="large" color="#0E1F43" />
                                    <Text style={styles.pdfLoadingText}>Loading document…</Text>
                                </View>
                            )}
                        />
                    )}
                </SafeAreaView>
            </Modal>

            {/* ── Approve Confirm Dialog ───────────────────────────────── */}
            <Modal visible={approveDialog} transparent animationType="fade" onRequestClose={() => setApproveDialog(false)}>
                <TouchableWithoutFeedback onPress={() => setApproveDialog(false)}>
                    <View style={styles.dialogOverlay} />
                </TouchableWithoutFeedback>
                <View style={styles.dialogWrapper}>
                    <View style={styles.dialog}>
                        <View style={[styles.dialogIcon, { backgroundColor: '#DCFCE7' }]}>
                            <Ionicons name="checkmark-circle-outline" size={ms(32)} color="#16A34A" />
                        </View>
                        <Text style={styles.dialogTitle}>Approve Submission?</Text>
                        <Text style={styles.dialogBody} numberOfLines={4}>
                            Approve "{selected?.title}" and make it visible to all students?
                        </Text>
                        <TouchableOpacity
                            style={[styles.dialogBtn, styles.dialogBtnApprove]}
                            onPress={doApprove}
                            disabled={acting}
                            activeOpacity={0.8}
                        >
                            {acting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[styles.dialogBtnText, { color: '#fff' }]}>Approve</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.dialogBtnGhost} onPress={() => setApproveDialog(false)}>
                            <Text style={styles.dialogBtnGhostText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── Reject Confirm Dialog ────────────────────────────────── */}
            <Modal visible={rejectDialog} transparent animationType="fade" onRequestClose={() => setRejectDialog(false)}>
                <TouchableWithoutFeedback onPress={() => setRejectDialog(false)}>
                    <View style={styles.dialogOverlay} />
                </TouchableWithoutFeedback>
                <View style={styles.dialogWrapper}>
                    <View style={styles.dialog}>
                        <View style={[styles.dialogIcon, { backgroundColor: '#FEE2E2' }]}>
                            <Ionicons name="close-circle-outline" size={ms(32)} color="#DC2626" />
                        </View>
                        <Text style={styles.dialogTitle}>Deny Submission?</Text>
                        <Text style={styles.dialogBody} numberOfLines={4}>
                            Deny "{selected?.title}" The student will be notified.
                        </Text>
                        <TextInput
                            style={styles.reasonInput}
                            placeholder="Reason for rejection (optional)"
                            placeholderTextColor="#9AADCA"
                            value={rejectReason}
                            onChangeText={setRejectReason}
                            multiline
                            numberOfLines={3}
                        />
                        <View style={styles.dialogRowBtns}>
                            <TouchableOpacity style={[styles.dialogRowBtn, styles.dialogBtnGhostOutline]} onPress={() => setRejectDialog(false)}>
                                <Text style={styles.dialogBtnGhostText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.dialogRowBtn, styles.dialogBtnReject]}
                                onPress={doReject}
                                disabled={acting}
                                activeOpacity={0.8}
                            >
                                {acting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[styles.dialogBtnText, { color: '#fff' }]}>Reject</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

/* ── Styles ─────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ECEEF8' },
    content:   { flex: 1, paddingHorizontal: scale(16) },

    title: { fontSize: ms(22), fontWeight: '800', color: '#0E1F43', marginTop: vs(14), marginBottom: vs(12) },

    /* Search */
    searchBox: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: ms(12), paddingHorizontal: scale(12), paddingVertical: vs(9),
        gap: scale(8), shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    searchInput: { flex: 1, fontSize: ms(13), color: '#0E1F43', padding: 0 },

    /* Tabs */
    tabRow: { flexDirection: 'row', gap: scale(8), marginTop: vs(12), marginBottom: vs(10) },
    tab: {
        paddingHorizontal: scale(16), paddingVertical: vs(7), borderRadius: ms(20),
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F5',
    },
    tabActive: { backgroundColor: '#0E1F43', borderColor: '#0E1F43' },
    tabText:       { fontSize: ms(12), fontWeight: '600', color: '#9AADCA' },
    tabTextActive: { color: '#fff' },

    /* List */
    listContent: { paddingBottom: vs(24), gap: vs(10) },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: vs(60) },

    /* Empty */
    emptyBox: { alignItems: 'center', paddingTop: vs(60), gap: vs(8), paddingHorizontal: scale(32) },
    emptyTitle: { fontSize: ms(15), fontWeight: '700', color: '#0E1F43', marginTop: vs(4) },
    emptySub:   { fontSize: ms(12), color: '#9AADCA', textAlign: 'center', lineHeight: ms(18) },

    /* Card */
    card: {
        backgroundColor: '#fff', borderRadius: ms(16),
        padding: scale(16), gap: vs(6),
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    },
    cardBadgeRow: { flexDirection: 'row', gap: scale(6), flexWrap: 'wrap' },
    badge: { borderRadius: ms(6), paddingHorizontal: scale(8), paddingVertical: vs(3) },
    badgeText: { fontSize: ms(10), fontWeight: '700' },

    cardTitle: { fontSize: ms(14), fontWeight: '700', color: '#0E1F43', lineHeight: ms(20) },

    authorsRow: { flexDirection: 'row', alignItems: 'center', gap: scale(4) },
    authorsText: { fontSize: ms(11), color: '#9AADCA', flex: 1 },

    abstractSnippet: { fontSize: ms(12), color: '#6B7A99', lineHeight: ms(18) },

    cardStats: { flexDirection: 'row', gap: scale(12), marginTop: vs(2) },
    stat: { flexDirection: 'row', alignItems: 'center', gap: scale(3) },
    statText: { fontSize: ms(11), color: '#9AADCA' },

    /* Modal sheet */
    modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    modalSheet: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff', borderTopLeftRadius: ms(24), borderTopRightRadius: ms(24),
        maxHeight: '88%',
    },
    modalScroll: { flexGrow: 0 },
    modalScrollContent: { paddingHorizontal: scale(20), paddingTop: vs(20), paddingBottom: vs(12) },

    modalClose: {
        alignSelf: 'flex-end', padding: scale(4),
        backgroundColor: '#F0F4FF', borderRadius: ms(20), marginBottom: vs(10),
    },
    modalTitle: {
        fontSize: ms(17), fontWeight: '800', color: '#0E1F43',
        lineHeight: ms(24), marginTop: vs(8), marginBottom: vs(4),
    },

    section: { marginTop: vs(12), gap: vs(6) },
    sectionLabel: { fontSize: ms(10), fontWeight: '700', color: '#9AADCA', letterSpacing: 0.8 },
    sectionBody:  { fontSize: ms(12), color: '#4B5563', lineHeight: ms(20) },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(6) },
    toolChip: {
        backgroundColor: '#F0F4FF', borderRadius: ms(6),
        paddingHorizontal: scale(8), paddingVertical: vs(3),
    },
    toolChipText: { fontSize: ms(11), color: '#0E1F43', fontWeight: '600' },
    kwChip: {
        backgroundColor: '#EEF4FF', borderRadius: ms(20),
        paddingHorizontal: scale(10), paddingVertical: vs(4),
    },
    kwChipText: { fontSize: ms(11), color: '#3B5A9E', fontWeight: '600' },

    /* Modal drag handle */
    modalHandle: {
        width: scale(36), height: vs(4), borderRadius: ms(2),
        backgroundColor: '#D1D9EE', alignSelf: 'center', marginBottom: vs(8),
    },

    /* System image */
    sysImageBox: {
        borderRadius: ms(14), overflow: 'hidden',
        marginBottom: vs(4), backgroundColor: '#F0F4FF',
        borderWidth: 1, borderColor: '#E2E8F5',
    },
    sysImage: { width: '100%', height: vs(170) },
    sysImageLabel: {
        flexDirection: 'row', alignItems: 'center', gap: scale(4),
        paddingHorizontal: scale(10), paddingVertical: vs(5),
        backgroundColor: '#F7F9FF',
    },
    sysImageLabelText: { fontSize: ms(10), color: '#6B7A99', fontWeight: '600' },

    /* Meta grid */
    metaGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: scale(8),
        backgroundColor: '#F7F9FF', borderRadius: ms(12),
        padding: scale(12), marginTop: vs(10),
    },
    metaItem: {
        flex: 1, minWidth: scale(70), alignItems: 'center',
        gap: vs(2), paddingVertical: vs(4),
    },
    metaValue: { fontSize: ms(12), fontWeight: '700', color: '#0E1F43', textAlign: 'center' },
    metaKey:   { fontSize: ms(10), color: '#9AADCA', fontWeight: '500', textAlign: 'center' },

    /* Uploader card */
    uploaderCard: {
        flexDirection: 'row', alignItems: 'center', gap: scale(10),
        backgroundColor: '#F0F4FF', borderRadius: ms(12),
        padding: scale(12), marginTop: vs(10),
        borderWidth: 1, borderColor: '#E2E8F5',
    },
    uploaderAvatar: {
        width: scale(38), height: scale(38), borderRadius: ms(19),
        backgroundColor: '#0E1F43', alignItems: 'center', justifyContent: 'center',
    },
    uploaderAvatarText: { fontSize: ms(13), fontWeight: '800', color: '#fff' },
    uploaderName:       { fontSize: ms(13), fontWeight: '700', color: '#0E1F43' },
    uploaderMeta:       { fontSize: ms(11), color: '#6B7A99', marginTop: vs(1) },
    uploaderBadge: {
        backgroundColor: '#0E1F43', borderRadius: ms(6),
        paddingHorizontal: scale(7), paddingVertical: vs(3),
    },
    uploaderBadgeText: { fontSize: ms(9), fontWeight: '700', color: '#fff', letterSpacing: 0.5 },

    /* Section label row (with icon) */
    sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: scale(4) },

    /* Authors list */
    authorRow: { flexDirection: 'row', alignItems: 'center', gap: scale(6) },
    authorDot: { width: scale(5), height: scale(5), borderRadius: ms(3), backgroundColor: '#9AADCA' },

    /* Rejection reason box */
    rejectionBox: {
        backgroundColor: '#FFF5F5', borderRadius: ms(12),
        padding: scale(12), marginTop: vs(12),
        borderWidth: 1.5, borderColor: '#FECACA',
    },
    rejectionHeader: { flexDirection: 'row', alignItems: 'center', gap: scale(5), marginBottom: vs(4) },
    rejectionTitle: { fontSize: ms(11), fontWeight: '700', color: '#DC2626', letterSpacing: 0.5 },
    rejectionBody:  { fontSize: ms(12), color: '#7F1D1D', lineHeight: ms(18) },

    /* System image placeholder */
    sysImagePlaceholder: {
        width: '100%', height: vs(170),
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#F0F4FF', gap: vs(6),
    },
    sysImagePlaceholderText: { fontSize: ms(11), color: '#9AADCA', fontWeight: '500' },

    /* View PDF button */
    pdfBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(8),
        backgroundColor: '#EEF1F8', borderRadius: ms(12),
        paddingVertical: vs(12), marginTop: vs(14),
        borderWidth: 1, borderColor: '#D1D9EE',
    },
    pdfBtnText: { fontSize: ms(13), fontWeight: '700', color: '#0E1F43', flex: 1, textAlign: 'center' },

    /* PDF viewer header */
    pdfHeader: {
        flexDirection: 'row', alignItems: 'center', gap: scale(12),
        backgroundColor: '#0E1F43', paddingHorizontal: scale(16), paddingVertical: vs(12),
    },
    pdfCloseBtn: { padding: scale(4) },
    pdfHeaderTitle: { flex: 1, fontSize: ms(14), fontWeight: '700', color: '#fff' },
    pdfLoading: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#F7F9FF', alignItems: 'center',
        justifyContent: 'center', gap: vs(10),
    },
    pdfLoadingText: { fontSize: ms(13), color: '#9AADCA' },

    /* Modal action buttons */
    modalActions: {
        flexDirection: 'row', gap: scale(10),
        paddingHorizontal: scale(20), paddingVertical: vs(14),
        borderTopWidth: 1, borderTopColor: '#EEF1F8',
    },
    actionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: scale(6), paddingVertical: vs(12), borderRadius: ms(12), borderWidth: 1.5,
    },
    actionBtnApproveOutline: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
    actionBtnApproved:       { borderColor: '#16A34A', backgroundColor: '#16A34A' },
    actionBtnRejectOutline:  { borderColor: '#DC2626', backgroundColor: '#FFF5F5' },
    actionBtnRejected:       { borderColor: '#DC2626', backgroundColor: '#DC2626' },
    actionBtnText: { fontSize: ms(13), fontWeight: '700' },

    /* Approved status bar (replaces action buttons) */
    statusBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(8),
        paddingHorizontal: scale(20), paddingVertical: vs(16),
        borderTopWidth: 1, borderTopColor: '#DCFCE7',
        backgroundColor: '#F0FDF4',
    },
    statusBarText: { fontSize: ms(14), fontWeight: '700', color: '#16A34A' },

    /* Rejected inline label */
    statusBarInline: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(6),
        borderWidth: 1.5, borderColor: '#FECACA', backgroundColor: '#FFF5F5',
        borderRadius: ms(12), paddingVertical: vs(12),
    },
    statusBarInlineText: { fontSize: ms(13), fontWeight: '700', color: '#DC2626' },

    /* Dialogs */
    dialogOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    dialogWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: scale(28) },
    dialog: {
        width: '100%', backgroundColor: '#fff',
        borderRadius: ms(20), padding: scale(24), alignItems: 'center', gap: vs(10),
    },
    dialogIcon: { width: scale(60), height: scale(60), borderRadius: ms(30), justifyContent: 'center', alignItems: 'center' },
    dialogTitle: { fontSize: ms(17), fontWeight: '800', color: '#0E1F43' },
    dialogBody:  { fontSize: ms(12), color: '#9AADCA', textAlign: 'center', lineHeight: ms(18) },
    reasonInput: {
        width: '100%', borderWidth: 1, borderColor: '#E2E8F5', borderRadius: ms(10),
        paddingHorizontal: scale(12), paddingVertical: vs(10),
        fontSize: ms(13), color: '#0E1F43', minHeight: vs(72), textAlignVertical: 'top',
    },
    dialogBtn: {
        width: '100%', paddingVertical: vs(13), borderRadius: ms(12),
        alignItems: 'center', justifyContent: 'center',
    },
    dialogBtnApprove: { backgroundColor: '#16A34A' },
    dialogBtnText: { fontSize: ms(14), fontWeight: '700' },
    dialogBtnGhost: { width: '100%', paddingVertical: vs(10), alignItems: 'center' },
    dialogBtnGhostText: { fontSize: ms(14), color: '#6B7A99', fontWeight: '600' },

    dialogRowBtns: { flexDirection: 'row', gap: scale(10), width: '100%' },
    dialogRowBtn:  { flex: 1, paddingVertical: vs(12), borderRadius: ms(12), alignItems: 'center', justifyContent: 'center' },
    dialogBtnGhostOutline: { borderWidth: 1.5, borderColor: '#E2E8F5' },
    dialogBtnReject: { backgroundColor: '#DC2626' },
});

export default AdminLiteratureScreen;

