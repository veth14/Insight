import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    FlatList, Modal, ScrollView, TouchableWithoutFeedback,
    StatusBar, Dimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SearchStackParamList } from '../../types';
import AppHeader from '../../components/AppHeader';
import { scale, vs, ms } from '../../utils/responsive';
import api from '../../services/api.service';

const { width } = Dimensions.get('window');

const CATEGORIES = [
    'All Categories',
    'Artificial Intelligence',
    'Data Science',
    'Education',
    'Health Services',
    'IoT',
    'Machine Learning',
    'Mobile Dev',
    'Multimedia',
    'Security',
    'Web System'
];
const RESEARCH_THEMES = ['All', 'Capstone', 'Case Study', 'Dissertation', 'Project', 'Thesis'];
const TRENDING_TOPICS = [
    'Artificial Intelligence in Education',
    'Mobile Health Applications',
    'Cybersecurity & Data Privacy',
    'IoT & Smart Systems',
];

interface StudyCard {
    _id: string;
    title: string;
    authors: string[];
    category: string;
    studyType?: string;
    yearPublished: number;
    abstract: string;
    viewCount: number;
    isBookmarked?: boolean;
}

function joinAuthors(authors: string[]): string {
    if (!authors?.length) return '';
    if (authors.length === 1) return authors[0];
    return `${authors[0]} et al.`;
}

const SearchScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<SearchStackParamList>>();
    const [query, setQuery]               = useState('');
    const [activeCategory, setActiveCategory] = useState('All Categories');
    const [advancedVisible, setAdvancedVisible] = useState(false);

    // Advanced filter state
    const [keywords, setKeywords]   = useState('');
    const [fromYear, setFromYear]   = useState('2020');
    const [toYear, setToYear]       = useState(String(new Date().getFullYear()));
    const [department, setDepartment] = useState('');
    const [activeTheme, setActiveTheme] = useState('All');

    // Data state
    const [results, setResults]   = useState<StudyCard[]>([]);
    const [loading, setLoading]   = useState(false);
    const [searched, setSearched] = useState(false);   // whether user has triggered a search
    const [page, setPage]         = useState(1);
    const [total, setTotal]       = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

    // Bookmark toggle for visible cards
    const toggleBookmark = async (studyId: string) => {
        try {
            const res = await api.post(`/studies/${studyId}/bookmark`);
            setBookmarked(prev => {
                const next = new Set(prev);
                if (res.data.bookmarked) next.add(studyId);
                else next.delete(studyId);
                return next;
            });
        } catch (e) {
            console.error('toggleBookmark error', e);
        }
    };

    const doSearch = useCallback(async (overrideQuery?: string, pageNum = 1) => {
        const q = overrideQuery ?? query;
        if (pageNum === 1) { setLoading(true); setSearched(true); }
        else setLoading(true);
        try {
            const params: Record<string, string> = { limit: '30', page: String(pageNum) };
            if (q.trim())                                    params.q        = q.trim();
            if (activeCategory !== 'All Categories')         params.category = activeCategory;
            if (activeTheme    !== 'All')                    params.studyType = activeTheme;
            if (fromYear)                                    params.fromYear = fromYear;
            if (toYear)                                      params.toYear   = toYear;

            const res = await api.get('/studies/search', { params });
            const studies = res.data.studies ?? [];
            setResults(prev => pageNum === 1 ? studies : [...prev, ...studies]);
            setTotal(res.data.total ?? (pageNum === 1 ? studies.length : total));
            setPage(pageNum);
        } catch (e) {
            console.error('search error', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [query, activeCategory, activeTheme, fromYear, toYear]);

    // Auto-search when category chip changes (only after first search)
    useEffect(() => {
        if (searched) doSearch();
    }, [activeCategory]);   // eslint-disable-line react-hooks/exhaustive-deps

    // Keep track of which studies are bookmarked for UI state
    useFocusEffect(useCallback(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await api.get('/studies/bookmarks');
                const ids = (res.data.studies || []).map((s: any) => s._id);
                if (mounted) setBookmarked(new Set(ids));
            } catch (_e) { /* ignore */ }
        })();
        return () => { mounted = false; };
    }, []));

    const handleAdvancedSearch = () => {
        setQuery(keywords);
        setAdvancedVisible(false);
        doSearch(keywords);
    };

    const clearAdvanced = () => {
        setKeywords(''); setFromYear('2020');
        setToYear(String(new Date().getFullYear()));
        setDepartment(''); setActiveTheme('All');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <AppHeader />

            {/* Search Bar */}
            <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                    <Ionicons name="search-outline" size={18} color="#9AADCA" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by author, keyword..."
                        placeholderTextColor="#9AADCA"
                        value={query}
                        onChangeText={setQuery}
                        returnKeyType="search"
                        onSubmitEditing={() => doSearch()}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
                            <Ionicons name="close-circle" size={18} color="#9AADCA" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity style={styles.filterIconBtn} onPress={() => setAdvancedVisible(true)} activeOpacity={0.7}>
                    <Ionicons name="options-outline" size={20} color="#0E1F43" />
                </TouchableOpacity>
            </View>

            {/* Category Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
                {CATEGORIES.map(cat => (
                    <TouchableOpacity
                        key={cat}
                        style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
                        onPress={() => setActiveCategory(cat)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.catChipText, activeCategory === cat && styles.catChipTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Results */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#0E1F43" />
                    <Text style={styles.loadingText}>Searching…</Text>
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={item => item._id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    onEndReached={() => {
                        if (!loading && results.length < total) doSearch(undefined, page + 1);
                    }}
                    onEndReachedThreshold={0.6}
                    refreshing={refreshing}
                    onRefresh={() => { setRefreshing(true); setPage(1); doSearch(undefined, 1); }}
                    ListFooterComponent={loading && page > 1 ? (
                        <View style={{ paddingVertical: 12 }}>
                            <ActivityIndicator size="small" color="#0E1F43" />
                        </View>
                    ) : null}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.resultCard}
                            activeOpacity={0.85}
                            onPress={() => navigation.navigate('StudyDetail', { studyId: item._id })}
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
                                    onPress={() => toggleBookmark(item._id)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Ionicons
                                        name={bookmarked.has(item._id) ? 'bookmark' : 'bookmark-outline'}
                                        size={18}
                                        color={bookmarked.has(item._id) ? '#0E1F43' : '#9AADCA'}
                                    />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                            <Text style={styles.cardAuthors} numberOfLines={1}>{joinAuthors(item.authors)}</Text>
                            <Text style={styles.cardAbstract} numberOfLines={2}>{item.abstract}</Text>
                            <View style={styles.cardMeta}>
                                <View style={styles.metaItem}>
                                    <Ionicons name="calendar-outline" size={13} color="#9AADCA" />
                                    <Text style={styles.metaText}>{item.yearPublished}</Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <Ionicons name="eye-outline" size={13} color="#9AADCA" />
                                    <Text style={styles.metaText}>{item.viewCount ?? 0}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        searched ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="search-outline" size={42} color="#C5D0E0" />
                                <Text style={styles.emptyTitle}>No results found</Text>
                                <Text style={styles.emptySubtitle}>Try different keywords or filters.</Text>
                            </View>
                        ) : (
                            <View style={styles.trendingSection}>
                                <View style={styles.trendingHeader}>
                                    <Ionicons name="trending-up-outline" size={18} color="#0E1F43" />
                                    <Text style={styles.trendingTitle}>Trending Topics ({new Date().getFullYear()})</Text>
                                </View>
                                {TRENDING_TOPICS.map((topic, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={styles.trendingItem}
                                        onPress={() => { setQuery(topic); doSearch(topic); }}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.trendingItemText}>{topic}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )
                    }
                />
            )}

            {/* Advanced Search Modal */}
            <Modal transparent animationType="fade" visible={advancedVisible} onRequestClose={() => setAdvancedVisible(false)}>
                <TouchableWithoutFeedback onPress={() => setAdvancedVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalCard}>
                                <Text style={styles.modalSectionLabel}>Keywords</Text>
                                <View style={styles.modalSearchBox}>
                                    <Ionicons name="search-outline" size={16} color="#9AADCA" style={{ marginRight: 8 }} />
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="Search in title, abstract, keywords..."
                                        placeholderTextColor="#9AADCA"
                                        value={keywords}
                                        onChangeText={setKeywords}
                                    />
                                </View>

                                <View style={styles.yearRow}>
                                    <View style={styles.yearField}>
                                        <Text style={styles.modalSectionLabel}>From</Text>
                                        <TextInput
                                            style={styles.yearInput}
                                            value={fromYear}
                                            onChangeText={setFromYear}
                                            keyboardType="numeric"
                                            maxLength={4}
                                        />
                                    </View>
                                    <View style={styles.yearField}>
                                        <Text style={styles.modalSectionLabel}>To Year</Text>
                                        <TextInput
                                            style={styles.yearInput}
                                            value={toYear}
                                            onChangeText={setToYear}
                                            keyboardType="numeric"
                                            maxLength={4}
                                        />
                                    </View>
                                </View>

                                <Text style={styles.modalSectionLabel}>Department</Text>
                                <TextInput
                                    style={styles.modalInputFull}
                                    placeholder="e.g. BSIT"
                                    placeholderTextColor="#9AADCA"
                                    value={department}
                                    onChangeText={setDepartment}
                                />

                                <Text style={styles.modalSectionLabel}>Study Type</Text>
                                <View style={styles.themeRow}>
                                    {RESEARCH_THEMES.map(theme => (
                                        <TouchableOpacity
                                            key={theme}
                                            style={[styles.themeChip, activeTheme === theme && styles.themeChipActive]}
                                            onPress={() => setActiveTheme(theme)}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={[styles.themeChipText, activeTheme === theme && styles.themeChipTextActive]}>{theme}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity style={styles.searchBtn} onPress={handleAdvancedSearch} activeOpacity={0.8}>
                                        <Ionicons name="search" size={16} color="#fff" />
                                        <Text style={styles.searchBtnText}>Search</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.clearBtn} onPress={clearAdvanced} activeOpacity={0.8}>
                                        <Ionicons name="close" size={16} color="#555" />
                                        <Text style={styles.clearBtnText}>Clear</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: vs(10) },
    loadingText: { fontSize: ms(13), color: '#9AADCA', fontWeight: '500' },

    emptyState: { alignItems: 'center', paddingTop: vs(60), gap: vs(8) },
    emptyTitle:    { fontSize: ms(15), fontWeight: '700', color: '#0E1F43' },
    emptySubtitle: { fontSize: ms(13), color: '#8A97B0' },

    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: scale(16),
        paddingTop: vs(14),
        paddingBottom: vs(4),
        backgroundColor: '#F5F6FA',
        gap: scale(10),
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: ms(10),
        borderWidth: 1,
        borderColor: '#E0E5F0',
        paddingHorizontal: scale(12),
        height: vs(42),
    },
    searchInput: { flex: 1, fontSize: ms(14), color: '#0E1F43' },
    filterIconBtn: {
        width: scale(42), height: vs(42),
        borderRadius: ms(10),
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E0E5F0',
        justifyContent: 'center', alignItems: 'center',
    },

    chipScroll: { flexGrow: 0, flexShrink: 0, backgroundColor: '#F5F6FA' },
    chipRow: { paddingHorizontal: scale(14), paddingTop: vs(10), paddingBottom: vs(12), gap: scale(8), alignItems: 'center' },
    catChip: {
        paddingHorizontal: scale(14), paddingVertical: vs(7),
        borderRadius: ms(20),
        backgroundColor: '#fff',
        borderWidth: 1.5, borderColor: '#D0D8E8',
    },
    catChipActive: { backgroundColor: '#0E1F43', borderColor: '#0E1F43' },
    catChipText: { fontSize: ms(13), fontWeight: '500', color: '#5A6A8A' },
    catChipTextActive: { color: '#fff', fontWeight: '600' },

    divider: { height: 0 },

    listContent: { paddingHorizontal: scale(16), paddingTop: vs(12), paddingBottom: vs(16), gap: vs(12) },

    resultCard: {
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
    badgeRow: { flexDirection: 'row', gap: scale(6), flexWrap: 'wrap', flex: 1, marginRight: scale(8) },
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
    cardMeta: { flexDirection: 'row', gap: scale(14) },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: scale(4) },
    metaText: { fontSize: ms(11), color: '#9AADCA' },

    trendingSection: {
        backgroundColor: '#fff',
        borderRadius: ms(14),
        padding: scale(16),
        marginTop: vs(4),
        borderWidth: 1,
        borderColor: '#F0F2F8',
        elevation: 2,
    },
    trendingHeader: { flexDirection: 'row', alignItems: 'center', gap: scale(8), marginBottom: vs(12) },
    trendingTitle: { fontSize: ms(14), fontWeight: '700', color: '#0E1F43' },
    trendingItem: { paddingVertical: vs(8), borderBottomWidth: 1, borderBottomColor: '#F5F6FA' },
    trendingItemText: { fontSize: ms(13), color: '#3B4F70' },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: vs(80),
    },
    modalCard: {
        width: width - scale(32),
        backgroundColor: '#fff',
        borderRadius: ms(16),
        padding: scale(20),
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 16,
    },
    modalSectionLabel: { fontSize: ms(12), fontWeight: '700', color: '#0E1F43', marginBottom: vs(6), marginTop: vs(12) },
    modalSearchBox: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F5F6FA', borderRadius: ms(10), borderWidth: 1, borderColor: '#E0E5F0',
        paddingHorizontal: scale(12), height: vs(40),
    },
    modalInput: { flex: 1, fontSize: ms(13), color: '#0E1F43' },
    yearRow: { flexDirection: 'row', gap: scale(12) },
    yearField: { flex: 1 },
    yearInput: {
        height: vs(40), borderRadius: ms(10), borderWidth: 1, borderColor: '#E0E5F0',
        backgroundColor: '#F5F6FA', paddingHorizontal: scale(12), fontSize: ms(14), color: '#0E1F43',
        textAlign: 'center',
    },
    modalInputFull: {
        height: vs(40), borderRadius: ms(10), borderWidth: 1, borderColor: '#E0E5F0',
        backgroundColor: '#F5F6FA', paddingHorizontal: scale(12), fontSize: ms(13), color: '#0E1F43',
    },
    themeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(8), marginTop: vs(4) },
    themeChip: {
        paddingHorizontal: scale(12), paddingVertical: vs(6),
        borderRadius: ms(20), backgroundColor: '#F0F2F8',
        borderWidth: 1, borderColor: '#E0E5F0',
    },
    themeChipActive: { backgroundColor: '#0E1F43', borderColor: '#0E1F43' },
    themeChipText: { fontSize: ms(12), fontWeight: '600', color: '#5A6A8A' },
    themeChipTextActive: { color: '#fff' },
    modalActions: { flexDirection: 'row', gap: scale(10), marginTop: vs(20) },
    searchBtn: {
        flex: 1, height: vs(44), backgroundColor: '#0E1F43',
        borderRadius: ms(12), flexDirection: 'row',
        justifyContent: 'center', alignItems: 'center', gap: scale(6),
    },
    searchBtnText: { color: '#fff', fontWeight: '700', fontSize: ms(14) },
    clearBtn: {
        flex: 1, height: vs(44), backgroundColor: '#F0F2F8',
        borderRadius: ms(12), flexDirection: 'row',
        justifyContent: 'center', alignItems: 'center', gap: scale(6),
        borderWidth: 1, borderColor: '#E0E5F0',
    },
    clearBtnText: { color: '#555', fontWeight: '600', fontSize: ms(14) },
});

export default SearchScreen;
