import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList,
    StatusBar, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/AppHeader';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types';
import { scale, vs, ms, wp } from '../../utils/responsive';

const { width } = Dimensions.get('window');

// ─── Sample image assets ─────────────────────────────────────────────────────
const IMG_ML        = require('../../../assets/images/SAMPLE/machine learning.jpg');
const IMG_AI_EDU    = require('../../../assets/images/SAMPLE/AI in Education.png');
const IMG_AI_EDU2   = require('../../../assets/images/SAMPLE/ai in education.jpg');
const IMG_MOBILE    = require('../../../assets/images/SAMPLE/mobile.jpeg');
const IMG_LOGO      = require('../../../assets/images/Insiqht_LOGO.png');

const MOCK_RECENTLY_ADDED = [
    { _id: 'r1', title: 'Machine Learning Approaches in Predicting Student Academic Performance', category: 'Information Technology', image: IMG_ML },
    { _id: 'r2', title: 'InsIQht: A Mobile-Based Centralized Repository for Capstone Projects', category: 'Information Technology', image: IMG_LOGO },
];

const MOCK_RECOMMENDED = [
    { _id: 'rec1', title: 'AI in Education: A Systematic Review', category: 'Artificial Intelligence', views: '1k', image: IMG_AI_EDU },
    { _id: 'rec2', title: 'Artificial Intelligence in Education', category: 'Artificial Intelligence', views: '2k', image: IMG_AI_EDU2 },
    { _id: 'rec3', title: 'Mobile Health Applications', category: 'Mobile App', views: '3k', image: IMG_MOBILE },
];

const MOCK_TRENDING = [
    { _id: 't1', title: 'InsIQht: A Mobile-Based Centralized Repository for BSIT Capstone Projects', category: 'Computer Science', image: IMG_LOGO },
    { _id: 't2', title: 'Machine Learning Approaches in Predicting Student Academic Performance 2026', category: 'Artificial Intelligent', image: IMG_ML },
];

const DashboardScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

    const handleStudyPress = (studyId: string) => navigation.navigate('StudyDetail', { studyId });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <AppHeader />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                {/* â”€â”€ Stat Cards â”€â”€ */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Ionicons name="document-text-outline" size={20} color="#0E1F43" />
                        <Text style={styles.statNumber}>1,248</Text>
                        <Text style={styles.statLabel}>Studies</Text>
                        <Text style={[styles.statChange, { color: '#E53935' }]}>-12%</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="eye-outline" size={20} color="#0E1F43" />
                        <Text style={styles.statNumber}>4</Text>
                        <Text style={styles.statLabel}>Reading</Text>
                        <Text style={[styles.statChange, { color: '#3B82F6' }]}>+2%</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="bookmark-outline" size={20} color="#0E1F43" />
                        <Text style={styles.statNumber}>4</Text>
                        <Text style={styles.statLabel}>Saved</Text>
                        <Text style={[styles.statChange, { color: '#10B981' }]}>+3%</Text>
                    </View>
                </View>

                {/* â”€â”€ Recently Added â”€â”€ */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recently Added</Text>
                </View>
                <View style={styles.recentRow}>
                    {MOCK_RECENTLY_ADDED.map(item => (
                        <TouchableOpacity key={item._id} style={styles.recentCard} onPress={() => handleStudyPress(item._id)} activeOpacity={0.85}>
                            <Image source={item.image} style={styles.recentThumb} resizeMode="cover" />
                            <View style={styles.recentBody}>
                                <Text style={styles.cardCategory}>{item.category}</Text>
                                <Text style={styles.recentTitle} numberOfLines={2}>{item.title}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* â”€â”€ Recommended For You â”€â”€ */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recommended For You</Text>
                </View>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={MOCK_RECOMMENDED}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.hList}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.recCard} onPress={() => handleStudyPress(item._id)} activeOpacity={0.85}>
                            <Image source={item.image} style={styles.recThumb} resizeMode="cover" />
                            <View style={styles.recBody}>
                                <Text style={styles.recTitle} numberOfLines={2}>{item.title}</Text>
                                <Text style={styles.cardCategory}>{item.category}</Text>
                                <View style={styles.recMeta}>
                                    <Ionicons name="eye-outline" size={12} color="#888" />
                                    <Text style={styles.recViews}>{item.views}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />

                {/* â”€â”€ Trending â”€â”€ */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Trending</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('TrendingAll')}><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
                </View>
                <View style={styles.trendingList}>
                    {MOCK_TRENDING.map(item => (
                        <TouchableOpacity key={item._id} style={styles.trendRow} onPress={() => handleStudyPress(item._id)} activeOpacity={0.85}>
                            <Image source={item.image} style={styles.trendThumb} resizeMode="cover" />
                            <View style={styles.trendBody}>
                                <Text style={styles.cardCategory}>{item.category}</Text>
                                <Text style={styles.trendTitle} numberOfLines={2}>{item.title}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

            </ScrollView>

        </SafeAreaView>
    );
};

// â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CARD_W = wp(62);
const REC_W = wp(38);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },



    scroll: { paddingBottom: 100 },

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
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F2F8',
    },
    statNumber: { fontSize: ms(20), fontWeight: '700', color: '#0E1F43', marginTop: vs(6) },
    statLabel: { fontSize: ms(11), color: '#888', marginTop: vs(1) },
    statChange: { fontSize: ms(11), fontWeight: '600', marginTop: vs(3) },

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
    recMeta: { flexDirection: 'row', alignItems: 'center', marginTop: vs(4), gap: scale(3) },
    recViews: { fontSize: ms(11), color: '#888' },

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


});

export default DashboardScreen;

