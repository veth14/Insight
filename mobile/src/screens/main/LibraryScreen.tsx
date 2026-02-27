import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    FlatList, StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { HomeStackParamList, MainTabParamList } from '../../types';
import AppHeader from '../../components/AppHeader';
import { scale, vs, ms } from '../../utils/responsive';
import api from '../../services/api.service';

type LibraryTab = 'in_progress' | 'saved' | 'completed';

interface LibraryItem {
    _id: string;
    title: string;
    authors: string[];
    category: string;
    studyType?: string;
    yearPublished: number;
    abstract: string;
    viewCount: number;
    progress: number;   // 0-100
    lastPage?: number;
    totalPages?: number;
    lastReadAt?: string;
    // bookmarks don't have progress fields — default to 0
}

function joinAuthors(authors: string[]): string {
    if (!authors?.length) return '';
    if (authors.length === 1) return authors[0];
    return `${authors[0]} et al.`;
}

const LibraryScreen: React.FC = () => {
    const route      = useRoute<RouteProp<MainTabParamList, 'Library'>>();
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
    const [activeTab, setActiveTab]   = useState<LibraryTab>(route.params?.initialTab ?? 'in_progress');
    const [savedItems, setSavedItems]       = useState<LibraryItem[]>([]);
    const [historyItems, setHistoryItems]   = useState<LibraryItem[]>([]);
    const [loading, setLoading]             = useState(true);
    const [refreshing, setRefreshing]       = useState(false);
    const [bookmarked, setBookmarked]       = useState<Set<string>>(new Set());

    const fetchAll = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const [bkRes, histRes] = await Promise.all([
                api.get('/studies/bookmarks'),
                api.get('/studies/reading-history'),
            ]);

            const bookmarkStudies: LibraryItem[] = (bkRes.data.studies ?? []).map((s: any) => ({
                ...s,
                progress: 0,
            }));
            setSavedItems(bookmarkStudies);
            setBookmarked(new Set(bookmarkStudies.map((s: LibraryItem) => String(s._id))));

            setHistoryItems(histRes.data.history ?? []);
        } catch (e) {
            console.error('LibraryScreen fetchAll error', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));
    const onRefresh = () => { setRefreshing(true); fetchAll(true); };

    const toggleBookmark = async (studyId: string) => {
        try {
            const res = await api.post(`/studies/${studyId}/bookmark`);
            if (res.data.bookmarked) {
                setBookmarked(prev => new Set(prev).add(studyId));
            } else {
                setBookmarked(prev => { const s = new Set(prev); s.delete(studyId); return s; });
                // Also remove from savedItems if we're in the saved tab
                setSavedItems(prev => prev.filter(i => String(i._id) !== studyId));
            }
        } catch (e) {
            console.error('toggleBookmark error', e);
        }
    };

    const inProgress  = historyItems.filter(i => i.progress < 100);
    const completed   = historyItems.filter(i => i.progress >= 100);

    const tabData: Record<LibraryTab, LibraryItem[]> = {
        in_progress: inProgress,
        saved:       savedItems,
        completed,
    };

    const tabCounts = {
        in_progress: inProgress.length,
        saved:       savedItems.length,
        completed:   completed.length,
    };

    const TABS: { key: LibraryTab; label: string; icon: string }[] = [
        { key: 'in_progress', label: 'Reading', icon: 'book-outline' },
        { key: 'saved',       label: 'Saved',   icon: 'bookmark-outline' },
        { key: 'completed',   label: 'Done',    icon: 'checkmark-circle-outline' },
    ];

    if (loading) return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <AppHeader />
            <View style={styles.loadingCenter}>
                <ActivityIndicator size="large" color="#0E1F43" />
                <Text style={styles.loadingText}>Loading library…</Text>
            </View>
        </SafeAreaView>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <AppHeader />

            {/* Tabs */}
            <View style={styles.tabBar}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
                        onPress={() => setActiveTab(tab.key)}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name={tab.icon as any}
                            size={15}
                            color={activeTab === tab.key ? '#fff' : '#5A6A8A'}
                            style={{ marginRight: 5 }}
                        />
                        <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                            {tab.label}
                        </Text>
                        <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                            <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                                {tabCounts[tab.key]}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={tabData[activeTab]}
                keyExtractor={item => `${activeTab}-${item._id}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0E1F43" />}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('StudyDetail', { studyId: String(item._id) })}
                    >
                        <View style={styles.cardTop}>
                            <View style={styles.badgeRow}>
                                <View style={styles.categoryBadge}>
                                    <Text style={styles.categoryBadgeText}>{item.category}</Text>
                                </View>
                                {item.studyType && (
                                    <View style={styles.typeBadge}>
                                        <Text style={styles.typeBadgeText}>{item.studyType}</Text>
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity
                                onPress={() => toggleBookmark(String(item._id))}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons
                                    name={bookmarked.has(String(item._id)) ? 'bookmark' : 'bookmark-outline'}
                                    size={18}
                                    color={bookmarked.has(String(item._id)) ? '#0E1F43' : '#9AADCA'}
                                />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.cardAuthors} numberOfLines={1}>{joinAuthors(item.authors)}</Text>
                        <Text style={styles.cardAbstract} numberOfLines={2}>{item.abstract}</Text>

                        {activeTab === 'in_progress' && item.progress > 0 && (
                            <View style={styles.progressWrapper}>
                                <View style={styles.progressTrack}>
                                    <View style={[styles.progressFill, { width: `${item.progress}%` as any }]} />
                                </View>
                                <Text style={styles.progressLabel}>{Math.round(item.progress)}% read</Text>
                            </View>
                        )}

                        <View style={styles.cardMeta}>
                            <View style={styles.metaItem}>
                                <Ionicons name="calendar-outline" size={13} color="#9AADCA" />
                                <Text style={styles.metaText}>{item.yearPublished}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Ionicons name="eye-outline" size={13} color="#9AADCA" />
                                <Text style={styles.metaText}>{item.viewCount ?? 0}</Text>
                            </View>
                            {activeTab === 'completed' && (
                                <View style={styles.doneChip}>
                                    <Ionicons name="checkmark-circle" size={12} color="#2E7D32" />
                                    <Text style={styles.doneChipText}>Completed</Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="book-outline" size={52} color="#C5D0E0" />
                        <Text style={styles.emptyTitle}>Nothing here yet</Text>
                        <Text style={styles.emptySubtitle}>
                            {activeTab === 'saved'       ? 'Bookmark papers to save them here.' :
                             activeTab === 'in_progress' ? 'Open a paper to track reading progress.' :
                                                           'Finish reading a paper to see it here.'}
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },

    loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: vs(10) },
    loadingText:   { fontSize: ms(13), color: '#9AADCA', fontWeight: '500' },

    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: scale(16),
        paddingVertical: vs(12),
        gap: scale(8),
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E5F0',
        elevation: 2,
    },
    tabBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: vs(8),
        borderRadius: ms(20),
        backgroundColor: '#F0F2F8',
        borderWidth: 1,
        borderColor: '#E0E5F0',
    },
    tabBtnActive: { backgroundColor: '#0E1F43', borderColor: '#0E1F43' },
    tabText: { fontSize: ms(12), fontWeight: '600', color: '#5A6A8A' },
    tabTextActive: { color: '#fff' },
    tabBadge: {
        marginLeft: scale(5),
        backgroundColor: '#E0E5F0',
        borderRadius: ms(10),
        paddingHorizontal: scale(6),
        paddingVertical: vs(1),
    },
    tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
    tabBadgeText: { fontSize: ms(10), fontWeight: '700', color: '#5A6A8A' },
    tabBadgeTextActive: { color: '#fff' },

    listContent: { padding: scale(16), gap: vs(12), paddingBottom: vs(100) },

    card: {
        backgroundColor: '#fff',
        borderRadius: ms(14),
        padding: scale(14),
        borderWidth: 1,
        borderColor: '#F0F2F8',
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: vs(8) },
    badgeRow: { flexDirection: 'row', gap: scale(6), flex: 1, marginRight: scale(8), flexWrap: 'wrap' },
    categoryBadge: {
        backgroundColor: '#F0F2F8',
        paddingHorizontal: scale(8), paddingVertical: vs(3),
        borderRadius: ms(6),
    },
    categoryBadgeText: { fontSize: ms(10), fontWeight: '600', color: '#5A6A8A' },
    typeBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: scale(8), paddingVertical: vs(3),
        borderRadius: ms(6),
    },
    typeBadgeText: { fontSize: ms(10), fontWeight: '600', color: '#2E7D32' },
    cardTitle: { fontSize: ms(14), fontWeight: '700', color: '#0E1F43', lineHeight: vs(20), marginBottom: vs(4) },
    cardAuthors: { fontSize: ms(11), color: '#8A97B0', marginBottom: vs(6) },
    cardAbstract: { fontSize: ms(12), color: '#8A97B0', lineHeight: vs(18), marginBottom: vs(8) },

    progressWrapper: { marginBottom: vs(10) },
    progressTrack: {
        height: vs(5), backgroundColor: '#E8ECF4', borderRadius: ms(3), overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: '#0E1F43', borderRadius: ms(3) },
    progressLabel: { fontSize: ms(10), color: '#9AADCA', marginTop: vs(3), textAlign: 'right' },

    cardMeta: { flexDirection: 'row', gap: scale(14), alignItems: 'center' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: scale(4) },
    metaText: { fontSize: ms(11), color: '#9AADCA' },
    doneChip: {
        flexDirection: 'row', alignItems: 'center', gap: scale(3),
        marginLeft: 'auto',
    },
    doneChipText: { fontSize: ms(10), fontWeight: '600', color: '#2E7D32' },

    empty: { alignItems: 'center', paddingTop: vs(60), gap: vs(8) },
    emptyTitle: { fontSize: ms(15), fontWeight: '700', color: '#0E1F43' },
    emptySubtitle: { fontSize: ms(13), color: '#8A97B0' },
});

export default LibraryScreen;
