import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    FlatList, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList, MainTabParamList } from '../../types';
import AppHeader from '../../components/AppHeader';
import { scale, vs, ms } from '../../utils/responsive';

type LibraryTab = 'in_progress' | 'saved' | 'completed';

const MOCK_LIBRARY = Array(6).fill(0).map((_, i) => ({
    _id: `lib-${i}`,
    title: i % 2 === 0
        ? 'Machine Learning Approaches in Predicting Student Academic....'
        : 'AI-Powered Plagiarism Detection for Filipino Language.....',
    authors: i % 2 === 0 ? 'Garcia M., Santos R., Cruz A.,' : 'Smith R., Modelo R.,',
    category: 'Computer Science',
    year: '2024',
    citations: i % 2 === 0 ? 11 : 41,
    badge: i % 3 !== 0 ? 'Quantitative' : null,
    abstract: 'This study explores the application of machine learning algorithms in predicting student...',
    status: i < 2 ? 'in_progress' : i < 4 ? 'saved' : 'completed',
    progress: i < 2 ? (i + 1) * 0.45 : i < 4 ? 0 : 1,
}));

const LibraryScreen: React.FC = () => {
    const route = useRoute<RouteProp<MainTabParamList, 'Library'>>();
    const [activeTab, setActiveTab] = useState<LibraryTab>(
        route.params?.initialTab ?? 'in_progress'
    );
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

    const filteredData = MOCK_LIBRARY.filter(item => item.status === activeTab);

    const TABS: { key: LibraryTab; label: string; icon: string }[] = [
        { key: 'in_progress', label: 'Reading', icon: 'book-outline' },
        { key: 'saved',       label: 'Saved',   icon: 'bookmark-outline' },
        { key: 'completed',   label: 'Done',    icon: 'checkmark-circle-outline' },
    ];

    const tabCounts = {
        in_progress: MOCK_LIBRARY.filter(i => i.status === 'in_progress').length,
        saved: MOCK_LIBRARY.filter(i => i.status === 'saved').length,
        completed: MOCK_LIBRARY.filter(i => i.status === 'completed').length,
    };

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
                data={filteredData}
                keyExtractor={item => item._id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('StudyDetail', { studyId: item._id })}
                    >
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
                                <Ionicons
                                    name={activeTab === 'saved' ? 'bookmark' : 'bookmark-outline'}
                                    size={18}
                                    color={activeTab === 'saved' ? '#0E1F43' : '#9AADCA'}
                                />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.cardAuthors} numberOfLines={1}>{item.authors}</Text>
                        <Text style={styles.cardAbstract} numberOfLines={2}>{item.abstract}</Text>

                        {activeTab === 'in_progress' && (
                            <View style={styles.progressWrapper}>
                                <View style={styles.progressTrack}>
                                    <View style={[styles.progressFill, { width: `${item.progress * 100}%` as any }]} />
                                </View>
                                <Text style={styles.progressLabel}>{Math.round(item.progress * 100)}% read</Text>
                            </View>
                        )}

                        <View style={styles.cardMeta}>
                            <View style={styles.metaItem}>
                                <Ionicons name="calendar-outline" size={13} color="#9AADCA" />
                                <Text style={styles.metaText}>{item.year}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Ionicons name="people-outline" size={13} color="#9AADCA" />
                                <Text style={styles.metaText}>{item.citations}</Text>
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
                        <Text style={styles.emptySubtitle}>Explore the dashboard to add papers.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },

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
