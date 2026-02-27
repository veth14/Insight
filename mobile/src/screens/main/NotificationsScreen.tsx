import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    FlatList, StatusBar, LayoutAnimation, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import { scale, vs, ms } from '../../utils/responsive';
import api from '../../services/api.service';

type SubmissionStatus = 'pending' | 'approved' | 'denied';

interface Submission {
    id: string;
    title: string;
    authors: string;
    year: number;
    category: string;
    status: SubmissionStatus;
    submittedAt: string;
    feedback?: string;
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatAuthors(authors: string[]): string {
    if (!authors || authors.length === 0) return 'Unknown';
    if (authors.length === 1) return authors[0];
    return `${authors[0]} et al.`;
}

const TABS: { key: SubmissionStatus; label: string }[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'denied', label: 'Denied' },
];

const STATUS_CONFIG: Record<SubmissionStatus, { color: string; bg: string; icon: string; label: string }> = {
    pending:  { color: '#D68000', bg: '#FFF3CC', icon: 'time-outline',           label: 'pending'  },
    approved: { color: '#2E7D32', bg: '#E8F5E9', icon: 'checkmark-circle-outline', label: 'approved' },
    denied:   { color: '#C62828', bg: '#FFEBEE', icon: 'close-circle-outline',    label: 'denied'   },
};

const EMPTY_CONFIG: Record<SubmissionStatus, { icon: string; message: string }> = {
    pending:  { icon: 'time-outline',           message: 'No pending submissions' },
    approved: { icon: 'checkmark-circle-outline', message: 'No approved submissions yet' },
    denied:   { icon: 'shield-checkmark-outline', message: 'No denied submission found' },
};

const NotificationsScreen: React.FC = () => {
    const [activeTab, setActiveTab]   = useState<SubmissionStatus>('pending');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading]       = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSubmissions = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const res = await api.get('/studies/my');
            const raw: any[] = res.data.studies ?? [];
            const mapped: Submission[] = raw.map(s => ({
                id:          String(s._id),
                title:       s.title,
                authors:     formatAuthors(s.authors),
                year:        s.yearPublished,
                category:    s.category,
                // backend: 'rejected' → screen: 'denied'
                status:      (s.approvalStatus === 'rejected' ? 'denied' : s.approvalStatus) as SubmissionStatus,
                submittedAt: formatDate(s.createdAt),
                feedback:    s.rejectionReason ?? undefined,
            }));
            setSubmissions(mapped);
        } catch (e) {
            console.error('fetchSubmissions error', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchSubmissions(); }, [fetchSubmissions]));

    const onRefresh = () => { setRefreshing(true); fetchSubmissions(true); };

    const filteredData = submissions.filter(item => item.status === activeTab);

    const counts: Record<SubmissionStatus, number> = {
        pending:  submissions.filter(i => i.status === 'pending').length,
        approved: submissions.filter(i => i.status === 'approved').length,
        denied:   submissions.filter(i => i.status === 'denied').length,
    };

    const toggleExpand = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(prev => prev === id ? null : id);
    };

    const renderItem = ({ item }: { item: Submission }) => {
        const sc = STATUS_CONFIG[item.status];
        const isExpanded = expandedId === item.id;
        // For approved items show a default congratulation message if no specific feedback
        const displayFeedback = item.feedback
            ?? (item.status === 'approved' ? 'Great work! Your research has been approved and is now visible in the repository.' : undefined);
        return (
            <TouchableOpacity
                style={[styles.card, isExpanded && styles.cardExpanded]}
                onPress={() => toggleExpand(item.id)}
                activeOpacity={0.85}
            >
                <View style={styles.cardTop}>
                    <View style={styles.badgeRow}>
                        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                            <Ionicons name={sc.icon as any} size={11} color={sc.color} />
                            <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
                        </View>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{item.category}</Text>
                        </View>
                    </View>
                    <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#9AADCA"
                    />
                </View>
                <Text style={styles.cardTitle} numberOfLines={isExpanded ? undefined : 2}>{item.title}</Text>
                <Text style={styles.cardMeta}>{item.authors} • {item.year}</Text>
                {isExpanded && (
                    <View style={styles.expandedSection}>
                        <View style={styles.divider} />
                        <View style={styles.metaRow}>
                            <Ionicons name="calendar-outline" size={13} color="#9AADCA" />
                            <Text style={styles.metaLabel}>Submitted:</Text>
                            <Text style={styles.metaValue}>{item.submittedAt}</Text>
                        </View>
                        {displayFeedback && (
                            <View style={styles.feedbackBox}>
                                <View style={styles.feedbackHeader}>
                                    <Ionicons name="chatbubble-ellipses-outline" size={13} color={sc.color} />
                                    <Text style={[styles.feedbackTitle, { color: sc.color }]}>Reviewer Feedback</Text>
                                </View>
                                <Text style={styles.feedbackText}>{displayFeedback}</Text>
                            </View>
                        )}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const empty = EMPTY_CONFIG[activeTab];

    if (loading) return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <AppHeader />
            <View style={styles.headerSection}>
                <Text style={styles.pageTitle}>Notification</Text>
                <Text style={styles.pageSub}>Review and manage submissions.</Text>
            </View>
            <View style={styles.loadingCenter}>
                <ActivityIndicator size="large" color="#0E1F43" />
                <Text style={styles.loadingText}>Loading submissions…</Text>
            </View>
        </SafeAreaView>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <AppHeader />

            <View style={styles.headerSection}>
                <Text style={styles.pageTitle}>Notification</Text>
                <Text style={styles.pageSub}>Review and manage submissions.</Text>
            </View>

            {/* Tab bar */}
            <View style={styles.tabWrapper}>
                <View style={styles.tabBar}>
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.key;
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.tabItem, isActive && styles.tabItemActive]}
                                onPress={() => { setActiveTab(tab.key); setExpandedId(null); }}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                                    {tab.label}
                                </Text>
                                <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                                    <Text style={[styles.countText, isActive && styles.countTextActive]}>{counts[tab.key]}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {filteredData.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconBox}>
                        <Ionicons name={empty.icon as any} size={38} color="#C0CDE8" />
                    </View>
                    <Text style={styles.emptyText}>{empty.message}</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0E1F43" />}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },

    loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: vs(10) },
    loadingText:   { fontSize: ms(13), color: '#9AADCA', fontWeight: '500' },

    headerSection: { paddingHorizontal: scale(18), paddingTop: vs(10), paddingBottom: vs(4) },
    pageTitle: { fontSize: ms(22), fontWeight: '800', color: '#0E1F43' },
    pageSub: { fontSize: ms(12), color: '#9AADCA', marginTop: vs(2) },

    tabWrapper: { paddingHorizontal: scale(16), paddingVertical: vs(12) },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#ECEEF5',
        borderRadius: ms(30),
        padding: vs(4),
        gap: scale(2),
    },
    tabItem: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: vs(8), borderRadius: ms(26), gap: scale(5),
    },
    tabItemActive: { backgroundColor: '#fff', shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    tabLabel: { fontSize: ms(12), fontWeight: '600', color: '#9AADCA' },
    tabLabelActive: { color: '#0E1F43' },
    countBadge: { backgroundColor: '#D8DCE8', borderRadius: ms(10), paddingHorizontal: scale(6), paddingVertical: vs(1) },
    countBadgeActive: { backgroundColor: '#E1E6F5' },
    countText: { fontSize: ms(10), fontWeight: '700', color: '#9AADCA' },
    countTextActive: { color: '#0E1F43' },

    listContent: { paddingHorizontal: scale(16), paddingBottom: vs(110), gap: vs(10) },

    card: {
        backgroundColor: '#fff',
        borderRadius: ms(14),
        padding: scale(14),
        borderWidth: 1,
        borderColor: '#F0F2F8',
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    cardExpanded: { borderColor: '#D0D8E8' },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: vs(8) },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: scale(6), flex: 1, flexWrap: 'wrap' },

    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: scale(4),
        paddingHorizontal: scale(9), paddingVertical: vs(4),
        borderRadius: ms(20),
    },
    statusText: { fontSize: ms(11), fontWeight: '700' },
    categoryBadge: {
        backgroundColor: '#F0F2F8',
        paddingHorizontal: scale(9), paddingVertical: vs(4),
        borderRadius: ms(20),
    },
    categoryText: { fontSize: ms(11), fontWeight: '600', color: '#5A6A8A' },

    cardTitle: { fontSize: ms(14), fontWeight: '700', color: '#0E1F43', lineHeight: vs(20), marginBottom: vs(6) },
    cardMeta: { fontSize: ms(12), color: '#9AADCA' },

    expandedSection: { marginTop: vs(10) },
    divider: { height: vs(1), backgroundColor: '#F0F2F8', marginBottom: vs(10) },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: scale(5), marginBottom: vs(8) },
    metaLabel: { fontSize: ms(12), fontWeight: '600', color: '#9AADCA' },
    metaValue: { fontSize: ms(12), color: '#3B4F70' },

    feedbackBox: {
        backgroundColor: '#F5F6FA',
        borderRadius: ms(10),
        padding: scale(12),
        borderWidth: 1,
        borderColor: '#E8EBF4',
    },
    feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: scale(5), marginBottom: vs(6) },
    feedbackTitle: { fontSize: ms(12), fontWeight: '700' },
    feedbackText: { fontSize: ms(12), color: '#5A6A8A', lineHeight: vs(18) },

    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: vs(12) },
    emptyIconBox: {
        width: scale(72), height: vs(72), borderRadius: ms(20),
        backgroundColor: '#EEF1F8',
        justifyContent: 'center', alignItems: 'center',
    },
    emptyText: { fontSize: ms(13), color: '#9AADCA', fontWeight: '600' },
});

export default NotificationsScreen;
