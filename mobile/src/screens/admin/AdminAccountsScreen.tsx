import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, StatusBar, ActivityIndicator, RefreshControl,
    Modal, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api.service';
import { scale, vs, ms } from '../../utils/responsive';
import AdminHeader from '../../components/AdminHeader';

/* -- Types ---------------------------------------------------------------- */

type RegStatus = 'pending' | 'approved' | 'rejected';
type FilterTab  = 'all' | RegStatus;

interface RegUser {
    uid: string;
    displayName: string;
    email: string;
    studentNumber: string;
    yearLevel?: number;
    program?: string;
    registrationStatus: RegStatus;
    registrationFormUrl?: string;
    createdAt: string;
}

/* -- Helpers -------------------------------------------------------------- */

const AVATAR_COLORS = ['#6C7FD8', '#F59E0B', '#22C55E', '#EF4444', '#8B5CF6', '#14B8A6'];

function getColor(name: string): string {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
    return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
}

function yearLabel(y?: number): string {
    const map: Record<number, string> = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: '5th Year' };
    return y ? (map[y] ?? `${y}th Year`) : '';
}

/* -- StatusBadge ---------------------------------------------------------- */

interface StatusBadgeProps { status: RegStatus }
const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const cfg = {
        pending:  { bg: '#FEF3C7', color: '#D97706', label: 'Pending' },
        approved: { bg: '#DCFCE7', color: '#16A34A', label: 'Approved' },
        rejected: { bg: '#FEE2E2', color: '#DC2626', label: 'Rejected' },
    }[status];
    return (
        <View style={[badgeStyle.wrap, { backgroundColor: cfg.bg }]}>
            <Text style={[badgeStyle.text, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
    );
};
const badgeStyle = StyleSheet.create({
    wrap: { paddingHorizontal: scale(8), paddingVertical: vs(3), borderRadius: ms(20), alignSelf: 'flex-start' },
    text: { fontSize: ms(10), fontWeight: '700' },
});

/* -- Main Screen ---------------------------------------------------------- */

const AdminAccountsScreen: React.FC = () => {
    const [users, setUsers]           = useState<RegUser[]>([]);
    const [loading, setLoading]       = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch]         = useState('');
    const [tab, setTab]               = useState<FilterTab>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [approveTarget, setApproveTarget] = useState<RegUser | null>(null);
    const [rejectTarget, setRejectTarget]   = useState<RegUser | null>(null);
    const [rejectReason, setRejectReason]   = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [viewFormUser, setViewFormUser]   = useState<RegUser | null>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchUsers = useCallback(async (q: string, isRefresh: boolean) => {
        if (!isRefresh) setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (q.trim()) params.search = q.trim();
            const res = await api.get('/admin/registrations', { params });
            setUsers(res.data.users ?? []);
        } catch { /* ignore */ }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    // Re-fetch every time this screen comes into focus (catches external DB changes)
    useFocusEffect(
        useCallback(() => { fetchUsers(search, false); }, [fetchUsers])
    );

    const onSearchChange = (text: string) => {
        setSearch(text);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => fetchUsers(text, false), 400);
    };

    const onRefresh = () => { setRefreshing(true); fetchUsers(search, true); };

    const filtered = tab === 'all' ? users : users.filter(u => u.registrationStatus === tab);

    const handleApprove = async () => {
        if (!approveTarget) return;
        setActionLoading(true);
        try {
            await api.patch(`/admin/registrations/${approveTarget.uid}/approve`);
            setUsers(prev => prev.map(u =>
                u.uid === approveTarget.uid ? { ...u, registrationStatus: 'approved' as RegStatus } : u
            ));
            setApproveTarget(null);
        } catch { /* ignore */ }
        finally { setActionLoading(false); }
    };

    const handleReject = async () => {
        if (!rejectTarget) return;
        setActionLoading(true);
        try {
            await api.patch(`/admin/registrations/${rejectTarget.uid}/reject`, { reason: rejectReason.trim() || undefined });
            setUsers(prev => prev.map(u =>
                u.uid === rejectTarget.uid ? { ...u, registrationStatus: 'rejected' as RegStatus } : u
            ));
            setRejectTarget(null);
            setRejectReason('');
        } catch { /* ignore */ }
        finally { setActionLoading(false); }
    };

    /* -- UserCard --------------------------------------------------------- */
    const UserCard: React.FC<{ item: RegUser }> = ({ item }) => {
        const expanded   = expandedId === item.uid;
        const yearLine   = [yearLabel(item.yearLevel), item.program].filter(Boolean).join(' \u2022 ');

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => setExpandedId(expanded ? null : item.uid)}
                activeOpacity={0.88}
            >
                <View style={[styles.avatar, { backgroundColor: getColor(item.displayName) }]}>
                    <Text style={styles.avatarText}>{getInitials(item.displayName)}</Text>
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{item.displayName}</Text>
                    <Text style={styles.userSub}>{item.studentNumber}</Text>
                    {!!yearLine && <Text style={styles.userMeta}>{yearLine}</Text>}

                    {expanded && (
                        <View style={styles.expandBody}>
                            <View style={styles.detailRow}>
                                <Ionicons name="mail-outline" size={ms(13)} color="#9AADCA" />
                                <Text style={styles.detailText}>{item.email}</Text>
                            </View>
                            {!!item.program && (
                                <View style={styles.detailRow}>
                                    <Ionicons name="school-outline" size={ms(13)} color="#9AADCA" />
                                    <Text style={styles.detailText}>{item.program}</Text>
                                </View>
                            )}

                            {/* Registration form photo — 4th year only */}
                            {item.yearLevel === 4 && (
                                <TouchableOpacity
                                    style={[styles.formPhotoBtn, !item.registrationFormUrl && styles.formPhotoBtnMissing]}
                                    onPress={() => item.registrationFormUrl && setViewFormUser(item)}
                                    activeOpacity={item.registrationFormUrl ? 0.8 : 1}
                                >
                                    <Ionicons
                                        name={item.registrationFormUrl ? 'document-text-outline' : 'alert-circle-outline'}
                                        size={ms(14)}
                                        color={item.registrationFormUrl ? '#5B8DEF' : '#F59E0B'}
                                    />
                                    <Text style={[styles.formPhotoBtnText, !item.registrationFormUrl && { color: '#F59E0B' }]}>
                                        {item.registrationFormUrl ? 'View Registration Form' : 'No Registration Form Uploaded'}
                                    </Text>
                                    {!!item.registrationFormUrl && (
                                        <Ionicons name="chevron-forward" size={ms(13)} color="#C0CDE8" style={{ marginLeft: 'auto' }} />
                                    )}
                                </TouchableOpacity>
                            )}

                            {item.registrationStatus === 'pending' && (
                                <View style={styles.actionRow}>
                                    <TouchableOpacity
                                        style={styles.approveBtn}
                                        onPress={() => setApproveTarget(item)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="checkmark-circle-outline" size={ms(15)} color="#16A34A" />
                                        <Text style={styles.approveBtnText}>Approve</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.rejectBtn}
                                        onPress={() => { setRejectTarget(item); setRejectReason(''); }}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="close-outline" size={ms(15)} color="#DC2626" />
                                        <Text style={styles.rejectBtnText}>Reject</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                <StatusBadge status={item.registrationStatus} />
            </TouchableOpacity>
        );
    };

    const TABS: { key: FilterTab; label: string }[] = [
        { key: 'all',      label: 'All' },
        { key: 'pending',  label: 'Pending' },
        { key: 'approved', label: 'Approved' },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#ECEEF8" />
            <AdminHeader />

            <View style={styles.titleRow}>
                <Text style={styles.pageTitle}>Account Registration</Text>
            </View>

            <View style={styles.searchRow}>
                <Ionicons name="search-outline" size={16} color="#9AADCA" style={{ marginRight: scale(8) }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name or ID..."
                    placeholderTextColor="#9AADCA"
                    value={search}
                    onChangeText={onSearchChange}
                    autoCapitalize="none"
                    clearButtonMode="while-editing"
                />
            </View>

            <View style={styles.tabsRow}>
                {TABS.map(t => (
                    <TouchableOpacity
                        key={t.key}
                        style={[styles.tab, tab === t.key && styles.tabActive]}
                        onPress={() => { setTab(t.key); setExpandedId(null); }}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#0E1F43" />
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.uid}
                    renderItem={({ item }) => <UserCard item={item} />}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0E1F43" />}
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <Ionicons name="people-outline" size={ms(40)} color="#C0CDE8" />
                            <Text style={styles.emptyText}>No registrations found</Text>
                        </View>
                    }
                />
            )}

            {/* Approve Modal */}
            <Modal visible={!!approveTarget} transparent animationType="fade" onRequestClose={() => setApproveTarget(null)}>
                <TouchableWithoutFeedback onPress={() => setApproveTarget(null)}>
                    <View style={styles.overlay} />
                </TouchableWithoutFeedback>
                <View style={styles.modalWrapper} pointerEvents="box-none">
                    <View style={styles.modalCard}>
                        <View style={styles.approveIconCircle}>
                            <Ionicons name="checkmark" size={ms(28)} color="#16A34A" />
                        </View>
                        <Text style={styles.modalTitle}>Approve Registration?</Text>
                        <Text style={styles.modalBody}>
                            {'Are you sure you want to approve '}
                            <Text style={styles.modalName}>{approveTarget?.displayName}</Text>
                            {"'s account?\nThey will be able to log in to their account."}
                        </Text>
                        <TouchableOpacity
                            style={[styles.primaryBtn, { backgroundColor: '#16A34A' }, actionLoading && { opacity: 0.6 }]}
                            onPress={handleApprove}
                            disabled={actionLoading}
                            activeOpacity={0.8}
                        >
                            {actionLoading
                                ? <ActivityIndicator color="#fff" size="small" />
                                : <Text style={styles.primaryBtnText}>Approve</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setApproveTarget(null)} activeOpacity={0.8}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Reject Modal */}
            <Modal visible={!!rejectTarget} transparent animationType="fade" onRequestClose={() => setRejectTarget(null)}>
                <TouchableWithoutFeedback onPress={() => setRejectTarget(null)}>
                    <View style={styles.overlay} />
                </TouchableWithoutFeedback>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalWrapper}
                    pointerEvents="box-none"
                >
                    <View style={styles.modalCard}>
                        <View style={styles.rejectIconCircle}>
                            <Ionicons name="close" size={ms(28)} color="#DC2626" />
                        </View>
                        <Text style={styles.modalTitle}>Reject Registration?</Text>
                        <Text style={styles.modalBody}>
                            {'Are you sure you want to reject '}
                            <Text style={styles.modalName}>{rejectTarget?.displayName}</Text>
                            {"'s registration?"}
                        </Text>
                        <TextInput
                            style={styles.reasonInput}
                            placeholder="Reason for rejection (optional)"
                            placeholderTextColor="#C0CDE8"
                            value={rejectReason}
                            onChangeText={setRejectReason}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                        <View style={styles.rejectBtnsRow}>
                            <TouchableOpacity style={styles.cancelBtnInRow} onPress={() => setRejectTarget(null)} activeOpacity={0.8}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.rejectConfirmBtn, actionLoading && { opacity: 0.6 }]}
                                onPress={handleReject}
                                disabled={actionLoading}
                                activeOpacity={0.8}
                            >
                                {actionLoading
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <Text style={styles.primaryBtnText}>Reject</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Registration Form Image Viewer */}
            <Modal visible={!!viewFormUser} transparent animationType="fade" onRequestClose={() => setViewFormUser(null)}>
                <View style={styles.imgViewerOverlay}>
                    <TouchableOpacity style={styles.imgViewerClose} onPress={() => setViewFormUser(null)} activeOpacity={0.8}>
                        <Ionicons name="close" size={ms(22)} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.imgViewerTitle}>Student Registration Form</Text>
                    <Text style={styles.imgViewerSub}>{viewFormUser?.displayName}</Text>
                    {viewFormUser?.registrationFormUrl ? (
                        <Image
                            source={{ uri: viewFormUser.registrationFormUrl }}
                            style={styles.imgViewerImage}
                            resizeMode="contain"
                        />
                    ) : (
                        <View style={styles.imgViewerNoPhoto}>
                            <Ionicons name="image-outline" size={ms(48)} color="rgba(255,255,255,0.3)" />
                            <Text style={styles.imgViewerNoPhotoText}>No photo available</Text>
                        </View>
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
};

/* -- Styles -------------------------------------------------------------- */

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ECEEF8' },

    titleRow: { paddingHorizontal: scale(20), paddingTop: vs(6), paddingBottom: vs(10) },
    pageTitle: { fontSize: ms(20), fontWeight: '800', color: '#0E1F43' },

    searchRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        marginHorizontal: scale(16), marginBottom: vs(10),
        borderRadius: ms(12), borderWidth: 1, borderColor: '#E8ECF4',
        paddingHorizontal: scale(12), height: vs(40),
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    searchInput: { flex: 1, fontSize: ms(13), color: '#0E1F43' },

    tabsRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: scale(16), gap: scale(8), marginBottom: vs(10),
    },
    tab: { paddingHorizontal: scale(16), paddingVertical: vs(6), borderRadius: ms(20) },
    tabActive: { backgroundColor: '#0E1F43' },
    tabText: { fontSize: ms(13), fontWeight: '600', color: '#9AADCA' },
    tabTextActive: { color: '#fff' },

    list: { paddingHorizontal: scale(16), paddingBottom: vs(110), gap: vs(8) },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: vs(80), gap: vs(8) },
    emptyText: { fontSize: ms(14), color: '#9AADCA', fontWeight: '700' },

    card: {
        backgroundColor: '#fff', borderRadius: ms(14),
        paddingHorizontal: scale(14), paddingVertical: vs(12),
        flexDirection: 'row', alignItems: 'flex-start', gap: scale(12),
        borderWidth: 1, borderColor: '#F0F2F8',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    avatar: { width: scale(44), height: scale(44), borderRadius: ms(22), justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    avatarText: { fontSize: ms(15), fontWeight: '800', color: '#fff' },
    userName: { fontSize: ms(14), fontWeight: '700', color: '#0E1F43' },
    userSub:  { fontSize: ms(12), fontWeight: '600', color: '#9AADCA', marginTop: vs(1) },
    userMeta: { fontSize: ms(11), color: '#C0CDE8', marginTop: vs(1) },

    expandBody: { marginTop: vs(10), gap: vs(6) },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: scale(6) },
    detailText: { fontSize: ms(12), color: '#5B6F96' },

    actionRow: { flexDirection: 'row', gap: scale(10), marginTop: vs(6) },
    approveBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: scale(6), paddingVertical: vs(9), borderRadius: ms(10),
        backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0',
    },
    approveBtnText: { fontSize: ms(13), fontWeight: '700', color: '#16A34A' },
    rejectBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: scale(6), paddingVertical: vs(9), borderRadius: ms(10),
        backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FECDD3',
    },
    rejectBtnText: { fontSize: ms(13), fontWeight: '700', color: '#DC2626' },

    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,31,67,0.45)' },
    modalWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: scale(32) },
    modalCard: {
        backgroundColor: '#fff', borderRadius: ms(20), width: '100%',
        paddingHorizontal: scale(24), paddingVertical: vs(24), alignItems: 'center',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
    },
    approveIconCircle: {
        width: scale(56), height: scale(56), borderRadius: ms(28),
        borderWidth: 2, borderColor: '#BBF7D0', backgroundColor: '#F0FDF4',
        justifyContent: 'center', alignItems: 'center', marginBottom: vs(12),
    },
    rejectIconCircle: {
        width: scale(56), height: scale(56), borderRadius: ms(28),
        borderWidth: 2, borderColor: '#FECACA', backgroundColor: '#FEF2F2',
        justifyContent: 'center', alignItems: 'center', marginBottom: vs(12),
    },
    modalTitle: { fontSize: ms(16), fontWeight: '800', color: '#0E1F43', marginBottom: vs(6), textAlign: 'center' },
    modalBody:  { fontSize: ms(12), color: '#9AADCA', textAlign: 'center', lineHeight: ms(18), marginBottom: vs(16) },
    modalName:  { fontWeight: '700', color: '#0E1F43' },
    primaryBtn: { width: '100%', paddingVertical: vs(12), borderRadius: ms(12), alignItems: 'center', marginBottom: vs(8) },
    primaryBtnText: { fontSize: ms(14), fontWeight: '700', color: '#fff' },
    cancelBtn: { width: '100%', paddingVertical: vs(10), alignItems: 'center' },
    cancelBtnInRow: {
        flex: 1, paddingVertical: vs(11), borderRadius: ms(12),
        borderWidth: 1, borderColor: '#E8ECF4', alignItems: 'center',
    },
    cancelText: { fontSize: ms(14), fontWeight: '600', color: '#9AADCA' },
    reasonInput: {
        width: '100%', minHeight: vs(80), borderWidth: 1, borderColor: '#E8ECF4',
        borderRadius: ms(12), paddingHorizontal: scale(12), paddingVertical: vs(10),
        fontSize: ms(13), color: '#0E1F43', backgroundColor: '#F7F9FF',
        marginBottom: vs(14),
    },
    rejectBtnsRow: { flexDirection: 'row', gap: scale(10), width: '100%' },
    rejectConfirmBtn: { flex: 1, paddingVertical: vs(11), borderRadius: ms(12), backgroundColor: '#DC2626', alignItems: 'center' },

    // Registration form photo button
    formPhotoBtn: {
        flexDirection: 'row', alignItems: 'center', gap: scale(8),
        backgroundColor: '#EEF4FF', borderRadius: ms(8),
        paddingHorizontal: scale(10), paddingVertical: vs(8),
        borderWidth: 1, borderColor: '#DBEAFE',
    },
    formPhotoBtnMissing: {
        backgroundColor: '#FFFBEB', borderColor: '#FDE68A',
    },
    formPhotoBtnText: {
        fontSize: ms(12), fontWeight: '600', color: '#5B8DEF', flex: 1,
    },
    formPhotoBtnMissingText: {
        fontSize: ms(12), fontWeight: '600', color: '#B45309', flex: 1,
    },

    // Image viewer
    imgViewerOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.92)',
        alignItems: 'center', justifyContent: 'center', padding: scale(16),
    },
    imgViewerClose: {
        position: 'absolute', top: vs(50), right: scale(20),
        width: scale(40), height: scale(40), borderRadius: ms(20),
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center', alignItems: 'center',
    },
    imgViewerTitle: {
        fontSize: ms(15), fontWeight: '800', color: '#fff', marginBottom: vs(4),
    },
    imgViewerSub: {
        fontSize: ms(12), color: 'rgba(255,255,255,0.6)', marginBottom: vs(20),
    },
    imgViewerImage: {
        width: '100%', height: '70%', borderRadius: ms(12),
    },
    imgViewerNoPhoto: {
        width: '100%', height: '50%', justifyContent: 'center', alignItems: 'center', gap: vs(12),
    },
    imgViewerNoPhotoText: {
        fontSize: ms(13), color: 'rgba(255,255,255,0.4)', fontWeight: '600',
    },
});

export default AdminAccountsScreen;
