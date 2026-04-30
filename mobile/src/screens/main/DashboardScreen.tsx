import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList,
    StatusBar, Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/AppHeader';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types';
import { scale, vs, ms, wp } from '../../utils/responsive';
import api from '../../services/api.service';
import { useOffline } from '../../contexts/OfflineContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DASHBOARD_CACHE_KEY = '@insight_dashboard_cache';

// Types
interface StudyCard {
    _id: string;
    title: string;
    category?: string;
    systemImageUrl?: string | null;
    viewCount?: number;
    downloadCount?: number;
}

interface StudyKPI {
    title: string;
    count: number;
}

interface DashboardStats {
    totalApproved: number;
    readingCount: number;
    savedCount: number;
    mostDownloaded: StudyKPI;
    mostViewed: StudyKPI;
    // Legacy fallback fields
    maxDownloads?: number;
    maxViews?: number;
}

interface DashboardData {
    stats: DashboardStats;
    recentlyAdded: StudyCard[];
    recommended: StudyCard[];
    trending: StudyCard[];
}

// Helpers
function fmtNum(n?: number): string {
    if (!n) return '0';
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
}

const DashboardScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

    const { isOffline } = useOffline();
    const [data, setData]             = useState<DashboardData | null>(null);
    const [loading, setLoading]       = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDashboard = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const res = await api.get('/studies/dashboard');
            setData(res.data);
            // Cache data for offline use
            await AsyncStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(res.data));
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            // If offline or fetch fails, try loading from cache
            const cached = await AsyncStorage.getItem(DASHBOARD_CACHE_KEY);
            if (cached) {
                setData(JSON.parse(cached));
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchDashboard();
        }, [fetchDashboard])
    );

    const handleStudyPress = (studyId: string) => navigation.navigate('StudyDetail', { studyId });

    const StudyImage = ({ uri, style }: { uri?: string | null; style: any }) =>
        uri
            ? <Image source={{ uri }} style={style} resizeMode="cover" />
            : <View style={[style, styles.imgPlaceholder]}>
                <Ionicons name="image-outline" size={24} color="#C5D0E0" />
              </View>;

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                <AppHeader />
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#0E1F43" />
                </View>
            </SafeAreaView>
        );
    }

    const stats         = data?.stats;
    const recentlyAdded = data?.recentlyAdded ?? [];
    const recommended   = data?.recommended   ?? [];
    const trending      = data?.trending      ?? [];



    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <AppHeader />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchDashboard(true); }}
                        colors={['#0E1F43']}
                        tintColor="#0E1F43"
                    />
                }
            >
                {/* Offline Banner */}
                {isOffline && (
                    <View style={styles.offlineBanner}>
                        <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
                        <Text style={styles.offlineBannerText}>You're offline. Access your downloads below.</Text>
                    </View>
                )}

                {/* Stat Cards */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Ionicons name="document-text-outline" size={20} color="#0E1F43" />
                        <Text style={styles.statNumber}>{fmtNum(stats?.totalApproved)}</Text>
                        <Text style={styles.statLabel}>Total Studies</Text>
                        <Text style={styles.statStudyTitle}>Active research papers</Text>
                    </View>
                    <View style={[styles.statCard, styles.statCardWide]}>
                        <Ionicons name="download-outline" size={20} color="#0E1F43" />
                        <Text style={styles.statNumber}>{fmtNum(stats?.mostDownloaded?.count ?? stats?.maxDownloads)}</Text>
                        <Text style={styles.statLabel}>Most Downloaded</Text>
                        {stats?.mostDownloaded?.title && stats.mostDownloaded.title !== 'N/A' && (
                            <Text style={styles.statStudyTitle} numberOfLines={2}>{stats.mostDownloaded.title}</Text>
                        )}
                    </View>
                    <View style={[styles.statCard, styles.statCardWide]}>
                        <Ionicons name="eye-outline" size={20} color="#0E1F43" />
                        <Text style={styles.statNumber}>{fmtNum(stats?.mostViewed?.count ?? stats?.maxViews)}</Text>
                        <Text style={styles.statLabel}>Most Viewed</Text>
                        {stats?.mostViewed?.title && stats.mostViewed.title !== 'N/A' && (
                            <Text style={styles.statStudyTitle} numberOfLines={2}>{stats.mostViewed.title}</Text>
                        )}
                    </View>
                </View>

                {/* Recently Added */}
                {recentlyAdded.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recently Added</Text>
                        </View>
                        <View style={styles.recentRow}>
                            {recentlyAdded.slice(0, 2).map(item => (
                                <TouchableOpacity
                                    key={item._id}
                                    style={styles.recentCard}
                                    onPress={() => handleStudyPress(item._id)}
                                    activeOpacity={0.85}
                                >
                                    <StudyImage uri={item.systemImageUrl} style={styles.recentThumb} />
                                    <View style={styles.recentBody}>
                                        <Text style={styles.cardCategory}>{item.category ?? 'General'}</Text>
                                        <Text style={styles.recentTitle} numberOfLines={2}>{item.title}</Text>
                                        <View style={styles.cardMetaRow}>
                                            <View style={styles.metaItem}>
                                                <Ionicons name="eye-outline" size={12} color="#888" />
                                                <Text style={styles.metaText}>{fmtNum(item.viewCount)}</Text>
                                            </View>
                                            <View style={styles.metaItem}>
                                                <Ionicons name="download-outline" size={12} color="#888" />
                                                <Text style={styles.metaText}>{fmtNum(item.downloadCount)}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}

                {/* Recommended For You */}
                {recommended.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recommended For You</Text>
                        </View>
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            data={recommended}
                            keyExtractor={item => item._id}
                            contentContainerStyle={styles.hList}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.recCard}
                                    onPress={() => handleStudyPress(item._id)}
                                    activeOpacity={0.85}
                                >
                                    <StudyImage uri={item.systemImageUrl} style={styles.recThumb} />
                                    <View style={styles.recBody}>
                                        <Text style={styles.recTitle} numberOfLines={2}>{item.title}</Text>
                                        <Text style={styles.cardCategory}>{item.category ?? 'General'}</Text>
                                        <View style={styles.cardMetaRow}>
                                            <View style={styles.metaItem}>
                                                <Ionicons name="eye-outline" size={12} color="#888" />
                                                <Text style={styles.metaText}>{fmtNum(item.viewCount)}</Text>
                                            </View>
                                            <View style={styles.metaItem}>
                                                <Ionicons name="download-outline" size={12} color="#888" />
                                                <Text style={styles.metaText}>{fmtNum(item.downloadCount)}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </>
                )}

                {/* Trending */}
                {trending.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Trending</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('TrendingAll')}>
                                <Text style={styles.seeAll}>See all</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.trendingList}>
                            {trending.map(item => (
                                <TouchableOpacity
                                    key={item._id}
                                    style={styles.trendRow}
                                    onPress={() => handleStudyPress(item._id)}
                                    activeOpacity={0.85}
                                >
                                    <StudyImage uri={item.systemImageUrl} style={styles.trendThumb} />
                                    <View style={styles.trendBody}>
                                        <Text style={styles.cardCategory}>{item.category ?? 'General'}</Text>
                                        <Text style={styles.trendTitle} numberOfLines={2}>{item.title}</Text>
                                        <View style={styles.cardMetaRow}>
                                            <View style={styles.metaItem}>
                                                <Ionicons name="eye-outline" size={12} color="#888" />
                                                <Text style={styles.metaText}>{fmtNum(item.viewCount)}</Text>
                                            </View>
                                            <View style={styles.metaItem}>
                                                <Ionicons name="download-outline" size={12} color="#888" />
                                                <Text style={styles.metaText}>{fmtNum(item.downloadCount)}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}

                {/* Quick Access Downloads */}
                {isOffline && (
                    <TouchableOpacity 
                        style={[styles.downloadsBtn, styles.downloadsBtnOffline]} 
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('Downloads')}
                    >
                        <View style={styles.downloadsBtnContent}>
                            <View style={styles.downloadsIconCircle}>
                                <Ionicons name="download" size={20} color="#fff" />
                            </View>
                            <View>
                                <Text style={[styles.downloadsBtnTitle, { color: '#fff' }]}>My Downloads</Text>
                                <Text style={[styles.downloadsBtnSub, { color: 'rgba(255,255,255,0.7)' }]}>Access saved papers offline</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#fff" />
                    </TouchableOpacity>
                )}

            </ScrollView>
        </SafeAreaView>
    );
};

// Styles
const REC_W = wp(38);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { paddingBottom: 100 },

    imgPlaceholder: {
        backgroundColor: '#EEF2F8',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: scale(16),
        paddingTop: vs(16),
        paddingBottom: vs(8),
        gap: scale(10),
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: ms(14),
        padding: scale(12),
        alignItems: 'flex-start',
        minHeight: vs(105), // Ensure uniform height
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F2F8',
    },
    statNumber: { fontSize: ms(20), fontWeight: '700', color: '#0E1F43', marginTop: vs(6) },
    statLabel: { fontSize: ms(11), color: '#888', marginTop: vs(1), fontWeight: '600' },
    statStudyTitle: {
        fontSize: ms(10), color: '#5A6A8A', marginTop: vs(6),
        fontStyle: 'italic', lineHeight: vs(13),
    },
    statCardWide: {
        flex: 1.3,
    },

    // Section header
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: scale(20), paddingTop: vs(20), paddingBottom: vs(12),
    },
    sectionTitle: { fontSize: ms(16), fontWeight: '700', color: '#0E1F43' },
    seeAll: { fontSize: ms(13), fontWeight: '600', color: '#3B82F6' },

    hList: { paddingHorizontal: scale(20), gap: scale(12), paddingBottom: vs(4) },

    recentRow: {
        flexDirection: 'row',
        paddingHorizontal: scale(20),
        gap: scale(12),
        marginBottom: vs(4),
    },

    // Recently Added cards
    recentCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: ms(14),
        overflow: 'hidden',
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F2F8',
    },
    recentThumb: {
        width: '100%', height: vs(130),
    },
    recentBody: { padding: scale(10) },
    cardCategory: { fontSize: ms(10), fontWeight: '600', color: '#888', marginBottom: vs(4), textTransform: 'capitalize' },
    recentTitle: { fontSize: ms(12), fontWeight: '600', color: '#1A2744', lineHeight: vs(17) },

    // Reusable meta row for cards
    cardMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: vs(6), gap: scale(12) },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: scale(4) },
    metaText: { fontSize: ms(11), color: '#888' },

    // Recommended cards
    recCard: {
        width: REC_W,
        backgroundColor: '#fff',
        borderRadius: ms(14),
        overflow: 'hidden',
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F2F8',
    },
    recThumb: { width: '100%', height: vs(90) },
    recBody: { padding: scale(10) },
    recTitle: { fontSize: ms(12), fontWeight: '600', color: '#1A2744', lineHeight: vs(17), marginBottom: vs(4) },

    // Trending
    trendingList: { paddingHorizontal: scale(20), gap: vs(12) },
    trendRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: ms(14),
        overflow: 'hidden',
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F0F2F8',
    },
    trendThumb: {
        width: scale(80), height: vs(80),
        flexShrink: 0,
    },
    trendBody: { flex: 1, padding: scale(12), justifyContent: 'center' },
    trendTitle: { fontSize: ms(13), fontWeight: '600', color: '#1A2744', lineHeight: vs(18) },

    // Offline Banner
    offlineBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E53E3E',
        paddingVertical: vs(8),
        gap: scale(8),
    },
    offlineBannerText: {
        color: '#fff',
        fontSize: ms(12),
        fontWeight: '600',
    },

    // Downloads Button
    downloadsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        marginHorizontal: scale(16),
        marginTop: vs(16),
        padding: scale(16),
        borderRadius: ms(16),
        borderWidth: 1,
        borderColor: '#F0F2F8',
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    downloadsBtnOffline: {
        backgroundColor: '#0E1F43',
        borderColor: '#0E1F43',
    },
    downloadsBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(12),
    },
    downloadsIconCircle: {
        width: scale(40),
        height: vs(40),
        borderRadius: ms(20),
        backgroundColor: '#E97C3A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    downloadsBtnTitle: {
        fontSize: ms(15),
        fontWeight: '700',
        color: '#0E1F43',
    },
    downloadsBtnSub: {
        fontSize: ms(12),
        color: '#8A97B0',
    },
});

export default DashboardScreen;
