import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, StatusBar,
    Dimensions, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { scale, vs, ms } from '../../utils/responsive';
import AdminHeader from '../../components/AdminHeader';
import api from '../../services/api.service';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W  = SCREEN_W - scale(48);
const PIE_SIZE = (SCREEN_W - scale(48)) * 0.55;

// ── Types ──────────────────────────────────────────────────────────────────────

interface AnalyticsData {
    stats: {
        totalUsers:           number;
        activeUsers:          number;
        suspendedUsers:       number;
        pendingRegistrations: number;
        totalStudies:         number;
        approvedStudies:      number;
        pendingStudies:       number;
        rejectedStudies:      number;
        totalViews:           number;
        totalDownloads:       number;
    };
    userGrowth:  { labels: string[]; data: number[] };
    yearLevel:   { name: string; count: number; color: string }[];
    categories:  { label: string; value: number }[];
    studyTypes:  { label: string; value: number }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

// ── Component ──────────────────────────────────────────────────────────────────

const AdminAnalyticsScreen: React.FC = () => {
    const [data, setData]             = useState<AnalyticsData | null>(null);
    const [loading, setLoading]       = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const res = await api.get('/admin/analytics');
            setData(res.data);
        } catch (e) {
            console.error('analytics fetch error', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    const onRefresh = () => { setRefreshing(true); fetchData(true); };

    const chartConfig = {
        backgroundGradientFrom: '#fff',
        backgroundGradientTo: '#fff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(91, 141, 239, ${opacity})`,
        labelColor: () => '#aaa',
        style: { borderRadius: 12 },
        propsForDots: { r: '5', strokeWidth: '0', fill: '#5B8DEF' },
        fillShadowGradient: '#5B8DEF',
        fillShadowGradientOpacity: 0.18,
        propsForBackgroundLines: { stroke: '#ECEEF8', strokeDasharray: '' },
    };

    // ── Loading state ──
    if (loading) return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <AdminHeader />
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0E1F43" />
                <Text style={styles.loadingText}>Loading analytics…</Text>
            </View>
        </SafeAreaView>
    );

    const d      = data!;
    const stats  = d.stats;
    const barMax = Math.max(...d.categories.map(c => c.value), 1);

    const STAT_CARDS = [
        { label: 'Total Users',   value: fmtNum(stats.totalUsers),    icon: 'people-outline',   color: '#5B8DEF',
          sub: `${stats.activeUsers} active · ${stats.suspendedUsers} suspended` },
        { label: 'Total Studies', value: fmtNum(stats.totalStudies),  icon: 'library-outline',  color: '#A78BFA',
          sub: `${stats.approvedStudies} approved · ${stats.pendingStudies} pending` },
        { label: 'Total Views',   value: fmtNum(stats.totalViews),    icon: 'eye-outline',      color: '#34D399',
          sub: 'Across all papers' },
        { label: 'Downloads',     value: fmtNum(stats.totalDownloads),icon: 'download-outline', color: '#FBBF24',
          sub: 'Across all papers' },
    ];

    const pieData = d.yearLevel.map(y => ({
        name:            y.name,
        population:      y.count,
        color:           y.color,
        legendFontColor: '#333',
        legendFontSize:  ms(11),
    }));

    const lineData = {
        labels:   d.userGrowth.labels,
        datasets: [{ data: d.userGrowth.data.length ? d.userGrowth.data : [0], strokeWidth: 2 }],
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <AdminHeader />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0E1F43" />}
            >
                {/* ── Pending alert banner ── */}
                {(stats.pendingStudies > 0 || stats.pendingRegistrations > 0) && (
                    <View style={styles.alertBanner}>
                        <Ionicons name="notifications-outline" size={ms(15)} color="#B45309" />
                        <Text style={styles.alertText}>
                            {[
                                stats.pendingStudies       > 0 ? `${stats.pendingStudies} pending submission${stats.pendingStudies > 1 ? 's' : ''}` : null,
                                stats.pendingRegistrations > 0 ? `${stats.pendingRegistrations} pending registration${stats.pendingRegistrations > 1 ? 's' : ''}` : null,
                            ].filter(Boolean).join(' · ')}
                        </Text>
                    </View>
                )}

                {/* ── Stats ── */}
                <Text style={styles.sectionLabel}>Overview</Text>
                <View style={styles.statsGrid}>
                    {[STAT_CARDS.slice(0, 2), STAT_CARDS.slice(2, 4)].map((row, ri) => (
                        <View key={ri} style={styles.statsRow}>
                            {row.map((s, i) => (
                                <View key={i} style={styles.statCard}>
                                    <View style={styles.statTop}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.statLabel}>{s.label}</Text>
                                            <Text style={styles.statValue}>{s.value}</Text>
                                            <Text style={styles.statSub}>{s.sub}</Text>
                                        </View>
                                        <View style={[styles.statIcon, { backgroundColor: s.color }]}>
                                            <Ionicons name={s.icon as any} size={ms(20)} color="#fff" />
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>

                {/* ── Submissions overview ── */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Submissions Overview</Text>
                    <View style={styles.statusRow}>
                        {[
                            { label: 'Approved', value: stats.approvedStudies, color: '#16A34A', bg: '#DCFCE7' },
                            { label: 'Pending',  value: stats.pendingStudies,  color: '#B45309', bg: '#FEF3C7' },
                            { label: 'Rejected', value: stats.rejectedStudies, color: '#DC2626', bg: '#FEE2E2' },
                        ].map(s => (
                            <View key={s.label} style={[styles.statusChip, { backgroundColor: s.bg }]}>
                                <Text style={[styles.statusChipValue, { color: s.color }]}>{s.value}</Text>
                                <Text style={[styles.statusChipLabel, { color: s.color }]}>{s.label}</Text>
                            </View>
                        ))}
                    </View>
                    {stats.totalStudies > 0 && (() => {
                        const approved = (stats.approvedStudies / stats.totalStudies) * 100;
                        const pending  = (stats.pendingStudies  / stats.totalStudies) * 100;
                        const rejected = (stats.rejectedStudies / stats.totalStudies) * 100;
                        return (
                            <View style={styles.progressBar}>
                                <View style={[styles.progressSeg, { flex: approved, backgroundColor: '#16A34A' }]} />
                                <View style={[styles.progressSeg, { flex: pending,  backgroundColor: '#FBBF24' }]} />
                                <View style={[styles.progressSeg, { flex: rejected, backgroundColor: '#EF4444' }]} />
                            </View>
                        );
                    })()}
                </View>

                {/* ── Line Chart ── */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>New Users (Last 7 Months)</Text>
                    {d.userGrowth.data.some(v => v > 0) ? (
                        <LineChart
                            data={lineData}
                            width={CHART_W + scale(16)}
                            height={vs(170)}
                            chartConfig={chartConfig}
                            bezier
                            style={styles.chartStyle}
                            withInnerLines
                            withOuterLines={false}
                            fromZero
                        />
                    ) : (
                        <View style={styles.emptyChart}>
                            <Ionicons name="bar-chart-outline" size={ms(28)} color="#D1D9EE" />
                            <Text style={styles.emptyChartText}>No data yet</Text>
                        </View>
                    )}
                </View>

                {/* ── Pie Chart ── */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Students by Year Level</Text>
                    {pieData.length > 0 ? (
                        <View style={styles.pieRow}>
                            <View style={styles.pieWrapper}>
                                <PieChart
                                    data={pieData}
                                    width={PIE_SIZE}
                                    height={PIE_SIZE}
                                    chartConfig={chartConfig}
                                    accessor="population"
                                    backgroundColor="transparent"
                                    paddingLeft="0" center={[PIE_SIZE / 4, 0]}
                                    hasLegend={false}
                                />
                                <View style={styles.pieHole} />
                            </View>
                            <View style={styles.pieLegend}>
                                {pieData.map((item, i) => (
                                    <View key={i} style={styles.legendRow}>
                                        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                                        <Text style={styles.legendLabel}>{item.name}</Text>
                                        <Text style={styles.legendValue}>{item.population}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.emptyChart}>
                            <Text style={styles.emptyChartText}>No data yet</Text>
                        </View>
                    )}
                </View>

                {/* ── Horizontal Bar Chart ── */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Top Research Categories</Text>
                    {d.categories.length > 0 ? (
                        <View style={styles.barChart}>
                            {d.categories.map((item, i) => (
                                <View key={i} style={styles.barRow}>
                                    <Text style={styles.barLabel} numberOfLines={1}>{item.label}</Text>
                                    <View style={styles.barTrack}>
                                        <View style={[styles.barFill, { width: `${(item.value / barMax) * 100}%` }]} />
                                    </View>
                                    <Text style={styles.barValue}>{item.value}</Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyChart}>
                            <Text style={styles.emptyChartText}>No approved studies yet</Text>
                        </View>
                    )}
                </View>

                {/* ── Study type breakdown ── */}
                {d.studyTypes.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Submissions by Type</Text>
                        <View style={styles.typeRow}>
                            {d.studyTypes.map((t, i) => {
                                const colors = ['#0E1F43', '#7C3AED', '#5B8DEF'];
                                return (
                                    <View key={i} style={[styles.typeChip, { backgroundColor: colors[i % colors.length] }]}>
                                        <Text style={styles.typeChipValue}>{t.value}</Text>
                                        <Text style={styles.typeChipLabel}>{t.label}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                <View style={{ height: vs(20) }} />
            </ScrollView>
        </SafeAreaView>
    );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: '#ECEEF8' },
    center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: vs(10) },
    loadingText: { fontSize: ms(13), color: '#9AADCA', fontWeight: '500' },

    // Scroll
    scroll: { paddingHorizontal: scale(16), paddingTop: vs(16), paddingBottom: vs(20) },

    // Alert banner
    alertBanner: {
        flexDirection: 'row', alignItems: 'center', gap: scale(8),
        backgroundColor: '#FEF3C7', borderRadius: ms(10),
        paddingHorizontal: scale(14), paddingVertical: vs(10),
        marginBottom: vs(14),
        borderWidth: 1, borderColor: '#FDE68A',
    },
    alertText: { flex: 1, fontSize: ms(12), color: '#B45309', fontWeight: '600' },

    sectionLabel: { fontSize: ms(15), fontWeight: '800', color: '#0E1F43', marginBottom: vs(12) },

    // Stats grid
    statsGrid: { flexDirection: 'column', gap: vs(10), marginBottom: vs(14) },
    statsRow:  { flexDirection: 'row', gap: scale(10) },
    statCard: {
        flex: 1,
        backgroundColor: '#fff', borderRadius: ms(14),
        padding: scale(14),
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    statTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    statLabel: { fontSize: ms(10), color: '#9AADCA', marginBottom: vs(2) },
    statValue: { fontSize: ms(20), fontWeight: '800', color: '#0E1F43' },
    statSub:   { fontSize: ms(9), color: '#9AADCA', marginTop: vs(2) },
    statIcon: {
        width: scale(36), height: scale(36), borderRadius: ms(10),
        justifyContent: 'center', alignItems: 'center', flexShrink: 0,
    },

    // Card
    card: {
        backgroundColor: '#fff', borderRadius: ms(12),
        padding: scale(16), marginBottom: vs(14),
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    cardTitle:  { fontSize: ms(13), fontWeight: '700', color: '#0E1F43', marginBottom: vs(12) },
    chartStyle: { marginLeft: -scale(16), borderRadius: ms(8) },

    // Submission status chips
    statusRow: { flexDirection: 'row', gap: scale(8), marginBottom: vs(12) },
    statusChip: { flex: 1, borderRadius: ms(10), paddingVertical: vs(10), alignItems: 'center', gap: vs(2) },
    statusChipValue: { fontSize: ms(18), fontWeight: '800' },
    statusChipLabel: { fontSize: ms(10), fontWeight: '600' },

    // Progress bar
    progressBar: { flexDirection: 'row', height: vs(6), borderRadius: ms(3), overflow: 'hidden', gap: 1 },
    progressSeg: { minWidth: 2 },

    // Empty state
    emptyChart:     { height: vs(80), alignItems: 'center', justifyContent: 'center', gap: vs(8) },
    emptyChartText: { fontSize: ms(12), color: '#9AADCA' },

    // Pie
    pieRow: { flexDirection: 'row', alignItems: 'center', gap: scale(8) },
    pieWrapper: {
        width: PIE_SIZE, height: PIE_SIZE,
        justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
    },
    pieHole: {
        position: 'absolute',
        width: PIE_SIZE * 0.45, height: PIE_SIZE * 0.45,
        borderRadius: PIE_SIZE * 0.225,
        backgroundColor: '#fff',
        marginLeft: 0,
    },
    pieLegend:  { flex: 1, gap: vs(10), paddingLeft: scale(4) },
    legendRow:  { flexDirection: 'row', alignItems: 'center', gap: scale(8) },
    legendDot:  { width: scale(8), height: scale(8), borderRadius: scale(4) },
    legendLabel:{ fontSize: ms(11), color: '#444', flex: 1 },
    legendValue:{ fontSize: ms(12), fontWeight: '800', color: '#0E1F43' },

    // Horizontal bars
    barChart: { gap: vs(10) },
    barRow:   { flexDirection: 'row', alignItems: 'center', gap: scale(8) },
    barLabel: { fontSize: ms(11), color: '#555', width: scale(88) },
    barTrack: { flex: 1, height: vs(10), backgroundColor: '#F0F0F8', borderRadius: ms(5), overflow: 'hidden' },
    barFill:  { height: '100%', backgroundColor: '#7C3AED', borderRadius: ms(5) },
    barValue: { fontSize: ms(11), color: '#555', width: scale(24), textAlign: 'right' },

    // Study type chips
    typeRow:       { flexDirection: 'row', gap: scale(10) },
    typeChip:      { flex: 1, borderRadius: ms(12), paddingVertical: vs(12), alignItems: 'center', gap: vs(4) },
    typeChipValue: { fontSize: ms(20), fontWeight: '800', color: '#fff' },
    typeChipLabel: { fontSize: ms(11), color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
});

export default AdminAnalyticsScreen;
