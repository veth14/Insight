import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    FlatList, Modal, ScrollView, TouchableWithoutFeedback,
    StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SearchStackParamList } from '../../types';
import AppHeader from '../../components/AppHeader';

const { width } = Dimensions.get('window');

// --- Mock Data ---
const CATEGORIES = ['All Categories', 'Data Science', 'Multimedia', 'IoT and Emb.', 'Web System', 'Mobile Dev'];

const MOCK_RESULTS = [
    {
        _id: 's1',
        title: 'InsIQht: A Mobile-Based Centralized Repository for BSIT Capstone Projects....',
        authors: 'Abando A., Albidla E.,',
        category: 'Computer Science',
        badge: null,
        year: '2024',
        citations: 41,
        abstract: 'This study explores the application of machine learning algorithms in predicting student...',
    },
    {
        _id: 's2',
        title: 'Machine Learning Approaches in Predicting Student Academic....',
        authors: 'Garcia M., Santos, R., Cruz, A.,',
        category: 'Computer Science',
        badge: 'Quantitative',
        year: '2024',
        citations: 11,
        abstract: 'This study explores the application of machine learning algorithms in predicting student...',
    },
    {
        _id: 's3',
        title: 'AI-Powered Plagiarism Detection for Filipino Language.....',
        authors: 'Smith R., Modelo R.,',
        category: 'Computer Science',
        badge: 'Quantitative',
        year: '2024',
        citations: 41,
        abstract: 'This study explores the application of machine learning algorithms in predicting student...',
    },
];

const TRENDING_TOPICS = [
    'Artificial Intelligence in Education',
    'Mobile Health Applications',
    'Cybersecurity & Data Privacy',
    'IoT & Smart Systems',
];

const RESEARCH_THEMES = ['All', 'AI/ML', 'Mobile Dev', 'IoT', 'Web System', 'Security', 'Data Analytics'];

// --- Component ---
const SearchScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<SearchStackParamList>>();
    const [query, setQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All Categories');
    const [advancedVisible, setAdvancedVisible] = useState(false);

    const [keywords, setKeywords] = useState('');
    const [fromYear, setFromYear] = useState('2020');
    const [toYear, setToYear] = useState('2025');
    const [department, setDepartment] = useState('');
    const [activeTheme, setActiveTheme] = useState('All');

    const filteredResults = MOCK_RESULTS.filter(item =>
        query.length === 0 ||
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.authors.toLowerCase().includes(query.toLowerCase())
    );

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
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')}>
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

            {/* Results + Trending */}
            <FlatList
                data={filteredResults}
                keyExtractor={item => item._id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.resultCard} activeOpacity={0.85} onPress={() => navigation.navigate('StudyDetail', { studyId: item._id })}>
                        <View style={styles.cardTop}>
                            <View style={styles.badgeRow}>
                                <View style={styles.categoryBadge}>
                                    <Text style={styles.categoryBadgeText}>{item.category}</Text>
                                </View>
                                {item.badge && (
                                    <View style={styles.typeBadge}>
                                        <Text style={styles.typeBadgeText}>{item.badge}</Text>
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Ionicons name="bookmark-outline" size={18} color="#9AADCA" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.cardAuthors} numberOfLines={1}>{item.authors}</Text>
                        <Text style={styles.cardAbstract} numberOfLines={2}>{item.abstract}</Text>
                        <View style={styles.cardMeta}>
                            <View style={styles.metaItem}>
                                <Ionicons name="calendar-outline" size={13} color="#9AADCA" />
                                <Text style={styles.metaText}>{item.year}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Ionicons name="people-outline" size={13} color="#9AADCA" />
                                <Text style={styles.metaText}>{item.citations}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                ListFooterComponent={
                    <View style={styles.trendingSection}>
                        <View style={styles.trendingHeader}>
                            <Ionicons name="trending-up-outline" size={18} color="#0E1F43" />
                            <Text style={styles.trendingTitle}>Trending Topics (2026)</Text>
                        </View>
                        {TRENDING_TOPICS.map((topic, i) => (
                            <TouchableOpacity key={i} style={styles.trendingItem} onPress={() => setQuery(topic)} activeOpacity={0.7}>
                                <Text style={styles.trendingItemText}>{topic}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                }
            />

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
                                    placeholder=""
                                    placeholderTextColor="#9AADCA"
                                    value={department}
                                    onChangeText={setDepartment}
                                />

                                <Text style={styles.modalSectionLabel}>Research Theme</Text>
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
                                    <TouchableOpacity
                                        style={styles.searchBtn}
                                        onPress={() => { setQuery(keywords); setAdvancedVisible(false); }}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="search" size={16} color="#fff" />
                                        <Text style={styles.searchBtnText}>Search</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.clearBtn}
                                        onPress={() => { setKeywords(''); setFromYear('2020'); setToYear('2025'); setDepartment(''); setActiveTheme('All'); }}
                                        activeOpacity={0.8}
                                    >
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

    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 4,
        backgroundColor: '#F5F6FA',
        gap: 10,
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E0E5F0',
        paddingHorizontal: 12,
        height: 42,
    },
    searchInput: { flex: 1, fontSize: 14, color: '#0E1F43' },
    filterIconBtn: {
        width: 42, height: 42,
        borderRadius: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E0E5F0',
        justifyContent: 'center', alignItems: 'center',
    },

    chipScroll: { flexGrow: 0, flexShrink: 0, backgroundColor: '#F5F6FA' },
    chipRow: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, gap: 8, alignItems: 'center' },
    catChip: {
        paddingHorizontal: 14, paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1.5, borderColor: '#D0D8E8',
    },
    catChipActive: { backgroundColor: '#0E1F43', borderColor: '#0E1F43' },
    catChipText: { fontSize: 13, fontWeight: '500', color: '#5A6A8A' },
    catChipTextActive: { color: '#fff', fontWeight: '600' },

    divider: { height: 0 },

    listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 12 },

    resultCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#F0F2F8',
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1, marginRight: 8 },
    categoryBadge: {
        backgroundColor: '#F0F2F8',
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 6,
    },
    categoryBadgeText: { fontSize: 10, fontWeight: '600', color: '#5A6A8A' },
    typeBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 6,
    },
    typeBadgeText: { fontSize: 10, fontWeight: '600', color: '#2E7D32' },
    cardTitle: { fontSize: 14, fontWeight: '700', color: '#0E1F43', lineHeight: 20, marginBottom: 4 },
    cardAuthors: { fontSize: 11, color: '#8A97B0', marginBottom: 6 },
    cardAbstract: { fontSize: 12, color: '#8A97B0', lineHeight: 18, marginBottom: 8 },
    cardMeta: { flexDirection: 'row', gap: 14 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 11, color: '#9AADCA' },

    trendingSection: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        marginTop: 4,
        borderWidth: 1,
        borderColor: '#F0F2F8',
        elevation: 2,
    },
    trendingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    trendingTitle: { fontSize: 14, fontWeight: '700', color: '#0E1F43' },
    trendingItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F6FA' },
    trendingItemText: { fontSize: 13, color: '#3B4F70' },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 80,
    },
    modalCard: {
        width: width - 32,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 16,
    },
    modalSectionLabel: { fontSize: 12, fontWeight: '700', color: '#0E1F43', marginBottom: 6, marginTop: 12 },
    modalSearchBox: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F5F6FA', borderRadius: 10, borderWidth: 1, borderColor: '#E0E5F0',
        paddingHorizontal: 12, height: 40,
    },
    modalInput: { flex: 1, fontSize: 13, color: '#0E1F43' },
    yearRow: { flexDirection: 'row', gap: 12 },
    yearField: { flex: 1 },
    yearInput: {
        height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#E0E5F0',
        backgroundColor: '#F5F6FA', paddingHorizontal: 12, fontSize: 14, color: '#0E1F43',
        textAlign: 'center',
    },
    modalInputFull: {
        height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#E0E5F0',
        backgroundColor: '#F5F6FA', paddingHorizontal: 12, fontSize: 13, color: '#0E1F43',
    },
    themeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    themeChip: {
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 20, backgroundColor: '#F0F2F8',
        borderWidth: 1, borderColor: '#E0E5F0',
    },
    themeChipActive: { backgroundColor: '#0E1F43', borderColor: '#0E1F43' },
    themeChipText: { fontSize: 12, fontWeight: '600', color: '#5A6A8A' },
    themeChipTextActive: { color: '#fff' },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
    searchBtn: {
        flex: 1, height: 44, backgroundColor: '#0E1F43',
        borderRadius: 12, flexDirection: 'row',
        justifyContent: 'center', alignItems: 'center', gap: 6,
    },
    searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    clearBtn: {
        flex: 1, height: 44, backgroundColor: '#F0F2F8',
        borderRadius: 12, flexDirection: 'row',
        justifyContent: 'center', alignItems: 'center', gap: 6,
        borderWidth: 1, borderColor: '#E0E5F0',
    },
    clearBtnText: { color: '#555', fontWeight: '600', fontSize: 14 },
});

export default SearchScreen;
