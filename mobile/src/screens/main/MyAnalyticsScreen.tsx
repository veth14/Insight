import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, StatusBar, ActivityIndicator, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { scale, vs, ms, wp } from '../../utils/responsive';
import api from '../../services/api.service';
import { AcademicStudy } from '../../types';

const screenWidth = Dimensions.get('window').width;

const MyAnalyticsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [studies, setStudies] = useState<AcademicStudy[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMyStudies = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/studies/my');
            setStudies(res.data.studies ?? []);
        } catch (err) {
            console.error('Failed to fetch studies:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchMyStudies();
        }, [fetchMyStudies])
    );

    const approvedStudies = studies.filter(s => s.approvalStatus === 'approved');
    const totalViews      = approvedStudies.reduce((acc, curr) => acc + (curr.viewCount || 0), 0);
    const totalSaves      = approvedStudies.reduce((acc, curr) => acc + (curr.downloadCount || 0), 0);
    const totalCitations  = approvedStudies.reduce((acc, curr) => acc + (curr.citationCount || 0), 0);
    const uploadedCount   = approvedStudies.length;
    const totalUploaded   = studies.length;

    const processChartData = () => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentMonth = new Date().getMonth();
        
        const labels = [];
        for (let i = 5; i >= 0; i--) {
            let d = new Date();
            d.setMonth(currentMonth - i);
            labels.push(months[d.getMonth()]);
        }

        const viewsData = [0, 0, 0, 0, 0, 0];
        const savesData = [0, 0, 0, 0, 0, 0];

        approvedStudies.forEach(study => {
            if (!study.createdAt) return;
            const studyDate = new Date(study.createdAt);
            const monthDiff = (new Date().getFullYear() - studyDate.getFullYear()) * 12 + (new Date().getMonth() - studyDate.getMonth());
            
            if (monthDiff >= 0 && monthDiff < 6) {
                const index = 5 - monthDiff;
                viewsData[index] += (study.viewCount || 0);
                savesData[index] += (study.downloadCount || 0);
            }
        });

        // Ensure we don't crash chart-kit with all zeros without min/max configuration
        const hasData = viewsData.some(v => v > 0) || savesData.some(v => v > 0);
        if (!hasData) {
            viewsData[5] = 1; // dummy value so chart renders an empty grid correctly
        }

        return {
            labels,
            datasets: [
                {
                    data: viewsData,
                    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                    strokeWidth: 2
                },
                {
                    data: savesData,
                    color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                    strokeWidth: 2,
                    withDots: false,
                    strokeDashArray: [5, 5]
                }
            ]
        };
    };

    const dynamicChartData = processChartData();

    const renderHeader = () => (
        <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                <Ionicons name="chevron-back" size={20} color="#0E1F43" />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>My Analytics</Text>
            <View style={{ width: 36 }} />
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
                {renderHeader()}
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#0E1F43" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
            {renderHeader()}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                
                {/* Performance Summary */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Performance Summary</Text>
                    <TouchableOpacity onPress={fetchMyStudies}>
                        <Text style={styles.refreshText}>Refresh Data</Text>
                    </TouchableOpacity>
                </View>

                {/* Main Stat Card */}
                <View style={styles.mainStatCard}>
                    <View style={styles.mainStatHeaderRow}>
                        <Ionicons name="cloud-upload-outline" size={20} color="#C0CDE8" />
                        <View style={styles.newBadge}>
                            <Text style={styles.newBadgeText}>+1 New</Text>
                        </View>
                    </View>
                    <Text style={styles.mainStatSubtitle}>TOTAL UPLOADED PROJECTS</Text>
                    <Text style={styles.mainStatValue}>{uploadedCount.toString().padStart(2, '0')}</Text>
                </View>

                {/* Sub Stats Row */}
                <View style={styles.subStatsRow}>
                    <View style={styles.subStatCard}>
                        <Ionicons name="eye-outline" size={16} color="#888" />
                        <Text style={styles.subStatValue}>{totalViews >= 1000 ? (totalViews/1000).toFixed(1)+'k' : totalViews}</Text>
                        <View style={styles.subStatLabelRow}>
                            <Text style={styles.subStatLabel}>Total Views </Text>
                            <Text style={[styles.subStatTrend, { color: '#22C55E' }]}>+12%</Text>
                        </View>
                    </View>
                    <View style={styles.subStatCard}>
                        <Ionicons name="document-text-outline" size={16} color="#888" />
                        <Text style={styles.subStatValue}>{totalCitations}</Text>
                        <View style={styles.subStatLabelRow}>
                            <Text style={styles.subStatLabel}>Total Citations </Text>
                            <Text style={[styles.subStatTrend, { color: '#22C55E' }]}>+5%</Text>
                        </View>
                    </View>
                    <View style={styles.subStatCard}>
                        <Ionicons name="bookmark-outline" size={16} color="#888" />
                        <Text style={styles.subStatValue}>{totalSaves}</Text>
                        <View style={styles.subStatLabelRow}>
                            <Text style={styles.subStatLabel}>Total Saves </Text>
                            <Text style={[styles.subStatTrend, { color: '#E53E3E' }]}>-8%</Text>
                        </View>
                    </View>
                </View>

                {/* Engagement Trends */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Engagement Trends</Text>
                    <Text style={styles.chartSubtitle}>Monthly view and save patterns</Text>
                    
                    <View style={styles.chartWrapper}>
                        <LineChart
                            data={dynamicChartData}
                            width={screenWidth - scale(64)}
                            height={vs(200)}
                            chartConfig={{
                                backgroundColor: '#fff',
                                backgroundGradientFrom: '#fff',
                                backgroundGradientTo: '#fff',
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(136, 136, 136, ${opacity})`,
                                style: { borderRadius: 16 },
                                propsForDots: { r: "0" },
                                propsForBackgroundLines: { strokeDasharray: "4", stroke: "#E0E5F0" },
                            }}
                            bezier
                            style={{ marginVertical: 8, marginLeft: -10 }}
                            withVerticalLines={false}
                        />
                    </View>
                </View>

                {/* My Projects */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>My Projects ({totalUploaded})</Text>
                    <TouchableOpacity style={styles.periodBadge}>
                        <Text style={styles.periodText}>Last 12 Months</Text>
                    </TouchableOpacity>
                </View>

                {studies.map(study => (
                    <TouchableOpacity key={study._id} style={styles.projectCard} onPress={() => navigation.navigate('StudyDetail', { studyId: study._id })}>
                        <View style={styles.projectHeader}>
                            <Text style={styles.projectTitle} numberOfLines={2}>{study.title}</Text>
                            <View style={[styles.statusBadge, study.approvalStatus === 'approved' ? styles.statusApproved : study.approvalStatus === 'rejected' ? styles.statusRejected : styles.statusPending]}>
                                <Text style={
                                    study.approvalStatus === 'approved' ? styles.statusTextApproved :
                                    study.approvalStatus === 'rejected' ? styles.statusTextRejected :
                                    styles.statusTextPending
                                }>
                                    {study.approvalStatus?.toUpperCase() || 'PENDING'}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.projectMeta}>
                            {study.category || 'General'} • UPLOADED {new Date(study.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                        
                        <View style={styles.projectStatsRow}>
                            <View style={styles.projectStat}>
                                <Ionicons name="eye-outline" size={12} color="#888" />
                                <Text style={styles.projectStatLabel}>VIEWS</Text>
                                <Text style={styles.projectStatVal}>{study.viewCount}</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.projectStat}>
                                <Ionicons name="bookmark-outline" size={12} color="#888" />
                                <Text style={styles.projectStatLabel}>SAVES</Text>
                                <Text style={styles.projectStatVal}>{study.downloadCount || 0}</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.projectStat}>
                                <Ionicons name="document-text-outline" size={12} color="#888" />
                                <Text style={styles.projectStatLabel}>CITATIONS</Text>
                                <Text style={styles.projectStatVal}>{study.citationCount || 0}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}

                {/* Upload Button */}
                <TouchableOpacity style={styles.uploadBtn} activeOpacity={0.8} onPress={() => navigation.navigate('Upload')}>
                    <View style={styles.uploadIconWrap}>
                        <Ionicons name="cloud-upload-outline" size={20} color="#0E1F43" />
                    </View>
                    <Text style={styles.uploadBtnTitle}>Upload New Project</Text>
                    <Text style={styles.uploadBtnSub}>Share your latest work</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    topBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: scale(16), paddingVertical: vs(10), backgroundColor: '#F5F6FA',
    },
    backBtn: {
        width: scale(36), height: vs(36), borderRadius: ms(10),
        backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#E0E5F0',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
    },
    topBarTitle: { fontSize: ms(16), fontWeight: '800', color: '#0E1F43' },
    
    scroll: { padding: scale(16), paddingBottom: vs(100), gap: vs(12) },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: vs(8) },
    sectionTitle: { fontSize: ms(16), fontWeight: '800', color: '#0E1F43' },
    refreshText: { fontSize: ms(11), fontWeight: '600', color: '#3B82F6' },

    mainStatCard: {
        backgroundColor: '#0E1F43', borderRadius: ms(16), padding: scale(16),
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
    },
    mainStatHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    newBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: scale(8), paddingVertical: vs(4), borderRadius: ms(12) },
    newBadgeText: { color: '#fff', fontSize: ms(10), fontWeight: '700' },
    mainStatSubtitle: { color: '#9AADCA', fontSize: ms(10), fontWeight: '700', letterSpacing: 0.5, marginTop: vs(12) },
    mainStatValue: { color: '#fff', fontSize: ms(28), fontWeight: '800', marginTop: vs(2) },

    subStatsRow: { flexDirection: 'row', gap: scale(8) },
    subStatCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: ms(12), padding: scale(12),
        borderWidth: 1, borderColor: '#F0F2F8',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    subStatValue: { fontSize: ms(16), fontWeight: '800', color: '#0E1F43', marginTop: vs(6) },
    subStatLabelRow: { flexDirection: 'row', alignItems: 'center', marginTop: vs(4) },
    subStatLabel: { fontSize: ms(9), color: '#888' },
    subStatTrend: { fontSize: ms(9), fontWeight: '700' },

    chartCard: {
        backgroundColor: '#fff', borderRadius: ms(16), padding: scale(16),
        borderWidth: 1, borderColor: '#F0F2F8',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    chartTitle: { fontSize: ms(13), fontWeight: '700', color: '#0E1F43' },
    chartSubtitle: { fontSize: ms(11), color: '#888', marginTop: vs(2) },
    chartWrapper: { marginTop: vs(16), alignItems: 'center', overflow: 'hidden' },

    periodBadge: { backgroundColor: '#F0F2F8', paddingHorizontal: scale(10), paddingVertical: vs(4), borderRadius: ms(12) },
    periodText: { fontSize: ms(10), fontWeight: '600', color: '#888' },

    projectCard: {
        backgroundColor: '#fff', borderRadius: ms(14), padding: scale(16),
        borderWidth: 1, borderColor: '#F0F2F8',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    projectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    projectTitle: { fontSize: ms(13), fontWeight: '700', color: '#1A2744', flex: 1, marginRight: scale(12) },
    statusBadge: { paddingHorizontal: scale(8), paddingVertical: vs(4), borderRadius: ms(6), marginLeft: scale(8) },
    statusApproved: { backgroundColor: '#DEF7EC' },
    statusRejected: { backgroundColor: '#FDE8E8' },
    statusPending: { backgroundColor: '#FEF4E4' },
    statusTextApproved: { fontSize: ms(9), fontWeight: '800', color: '#03543F' },
    statusTextRejected: { fontSize: ms(9), fontWeight: '800', color: '#9B1C1C' },
    statusTextPending: { fontSize: ms(9), fontWeight: '800', color: '#92400E' },
    projectMeta: { fontSize: ms(10), color: '#888', marginTop: vs(6), textTransform: 'uppercase' },
    
    projectStatsRow: { flexDirection: 'row', alignItems: 'center', marginTop: vs(12), paddingTop: vs(12), borderTopWidth: 1, borderTopColor: '#F0F2F8' },
    projectStat: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, height: vs(24), backgroundColor: '#F0F2F8' },
    projectStatLabel: { fontSize: ms(9), color: '#888', marginTop: vs(4), fontWeight: '600' },
    projectStatVal: { fontSize: ms(13), fontWeight: '800', color: '#0E1F43', marginTop: vs(2) },

    uploadBtn: {
        borderWidth: 1.5, borderColor: '#E0E5F0', borderStyle: 'dashed', borderRadius: ms(16),
        paddingVertical: vs(20), alignItems: 'center', justifyContent: 'center',
        marginTop: vs(8), backgroundColor: '#FAFBFC'
    },
    uploadIconWrap: { width: scale(40), height: vs(40), borderRadius: ms(20), backgroundColor: '#F0F2F8', alignItems: 'center', justifyContent: 'center', marginBottom: vs(8) },
    uploadBtnTitle: { fontSize: ms(13), fontWeight: '700', color: '#0E1F43' },
    uploadBtnSub: { fontSize: ms(11), color: '#888', marginTop: vs(2) },
});

export default MyAnalyticsScreen;
