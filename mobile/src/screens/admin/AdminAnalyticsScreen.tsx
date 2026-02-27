import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, StatusBar,
    TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { scale, vs, ms } from '../../utils/responsive';
import AdminHeader from '../../components/AdminHeader';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - scale(48);
const PIE_SIZE = (SCREEN_W - scale(48)) * 0.55;

// ── Mock Data ──────────────────────────────────────────────────────────────────

const STATS = [
    { label: 'Total Users',   value: '1,247', delta: '+12%', icon: 'people-outline',      color: '#5B8DEF' },
    { label: 'Total Studies', value: '856',   delta: '+8%',  icon: 'library-outline',     color: '#A78BFA' },
    { label: 'Total Views',   value: '24.5K', delta: '+23%', icon: 'eye-outline',          color: '#34D399' },
    { label: 'Downloads',     value: '3,942', delta: '+5%',  icon: 'download-outline',    color: '#FBBF24' },
];

const LINE_DATA = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [{ data: [80, 120, 160, 210, 270, 340, 420], strokeWidth: 2 }],
};

const PIE_DATA = [
    { name: '1st Year', population: 320, color: '#7C3AED', legendFontColor: '#333', legendFontSize: ms(11) },
    { name: '2nd Year', population: 280, color: '#A78BFA', legendFontColor: '#333', legendFontSize: ms(11) },
    { name: '3rd Year', population: 350, color: '#C4B5FD', legendFontColor: '#333', legendFontSize: ms(11) },
    { name: '4th Year', population: 297, color: '#EC4899', legendFontColor: '#333', legendFontSize: ms(11) },
];

const BAR_DATA = [
    { label: 'AI/ML',            value: 95 },
    { label: 'Web Sys',          value: 78 },
    { label: 'Mobile',           value: 68 },
    { label: 'IoT',              value: 55 },
    { label: 'Security',         value: 48 },
    { label: 'Data Analytics',   value: 42 },
    { label: 'Cloud',            value: 35 },
];
const BAR_MAX = Math.max(...BAR_DATA.map(b => b.value));

// ── Component ──────────────────────────────────────────────────────────────────

const AdminAnalyticsScreen: React.FC = () => {
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
        propsForBackgroundLines: {
            stroke: '#ECEEF8',
            strokeDasharray: '',
        },
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* ── Header ── */}
            <AdminHeader />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                {/* ── Stats ── */}
                <Text style={styles.sectionLabel}>User Analytics</Text>
                <View style={styles.statsGrid}>
                    {[STATS.slice(0, 2), STATS.slice(2, 4)].map((row, ri) => (
                        <View key={ri} style={styles.statsRow}>
                            {row.map((s, i) => (
                                <View key={i} style={styles.statCard}>
                                    <View style={styles.statTop}>
                                        <View>
                                            <Text style={styles.statLabel}>{s.label}</Text>
                                            <Text style={styles.statValue}>{s.value}</Text>
                                        </View>
                                        <View style={styles.statIcon}>
                                            <Ionicons name={s.icon as any} size={ms(20)} color="#fff" />
                                        </View>
                                    </View>
                                    <View style={styles.statDeltaRow}>
                                        <Ionicons name="trending-up-outline" size={ms(12)} color="#34D399" />
                                        <Text style={styles.statDelta}>{s.delta}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>

                {/* ── Line Chart ── */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>User Growth</Text>
                    <LineChart
                        data={LINE_DATA}
                        width={CHART_W + scale(16)}
                        height={vs(180)}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chartStyle}
                        withInnerLines={true}
                        withOuterLines={false}
                        withHorizontalLabels={true}
                        withVerticalLabels={true}
                        fromZero={false}
                        yAxisInterval={1}
                    />
                </View>

                {/* ── Pie Chart ── */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Access by Year Level</Text>
                    <View style={styles.pieRow}>
                        <View style={styles.pieWrapper}>
                            <PieChart
                                data={PIE_DATA}
                                width={PIE_SIZE}
                                height={PIE_SIZE}
                                chartConfig={chartConfig}
                                accessor="population"
                                backgroundColor="transparent"
                                paddingLeft="30"
                                hasLegend={false}
                            />
                            <View style={styles.pieHole} />
                        </View>
                        <View style={styles.pieLegend}>
                            {PIE_DATA.map((item, i) => (
                                <View key={i} style={styles.legendRow}>
                                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                                    <Text style={styles.legendLabel}>{item.name}</Text>
                                    <Text style={styles.legendValue}>{item.population}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* ── Horizontal Bar Chart ── */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Top Research Areas</Text>
                    <View style={styles.barChart}>
                        {BAR_DATA.map((item, i) => (
                            <View key={i} style={styles.barRow}>
                                <Text style={styles.barLabel} numberOfLines={1}>{item.label}</Text>
                                <View style={styles.barTrack}>
                                    <View style={[styles.barFill, { width: `${(item.value / BAR_MAX) * 100}%` }]} />
                                </View>
                                <Text style={styles.barValue}>{item.value}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={{ height: vs(20) }} />
            </ScrollView>

        </SafeAreaView>
    );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ECEEF8' },



    // Scroll
    scroll: { paddingHorizontal: scale(16), paddingTop: vs(16), paddingBottom: vs(20) },

    sectionLabel: { fontSize: ms(15), fontWeight: '800', color: '#0E1F43', marginBottom: vs(12) },

    // Stats grid
    statsGrid: { flexDirection: 'column', gap: vs(10), marginBottom: vs(14) },
    statsRow: { flexDirection: 'row', gap: scale(10) },
    statCard: {
        flex: 1,
        backgroundColor: '#fff', borderRadius: ms(14),
        padding: scale(16),
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: vs(8) },
    statLabel: { fontSize: ms(11), color: '#9AADCA', marginBottom: vs(4) },
    statValue: { fontSize: ms(22), fontWeight: '800', color: '#0E1F43' },
    statIcon: {
        width: scale(40), height: scale(40), borderRadius: ms(10),
        backgroundColor: '#0E1F43',
        justifyContent: 'center', alignItems: 'center',
    },
    statDeltaRow: { flexDirection: 'row', alignItems: 'center', gap: scale(4) },
    statDelta: { fontSize: ms(11), color: '#34D399', fontWeight: '600' },

    // Card
    card: {
        backgroundColor: '#fff', borderRadius: ms(12),
        padding: scale(16), marginBottom: vs(14),
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    cardTitle: { fontSize: ms(13), fontWeight: '700', color: '#0E1F43', marginBottom: vs(12) },
    chartStyle: { marginLeft: -scale(16), borderRadius: ms(8) },

    // Pie
    pieRow: { flexDirection: 'row', alignItems: 'center', gap: scale(8) },
    pieWrapper: {
        width: PIE_SIZE,
        height: PIE_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    pieHole: {
        position: 'absolute',
        width: PIE_SIZE * 0.45,
        height: PIE_SIZE * 0.45,
        borderRadius: PIE_SIZE * 0.225,
        backgroundColor: '#fff',
        marginLeft: -32,
    },
    pieLegend: { flex: 1, gap: vs(12), paddingLeft: scale(4) },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: scale(8) },
    legendDot: { width: scale(10), height: scale(10), borderRadius: scale(5) },
    legendLabel: { fontSize: ms(12), color: '#444', flex: 1 },
    legendValue: { fontSize: ms(13), fontWeight: '800', color: '#0E1F43' },

    // Horizontal bars
    barChart: { gap: vs(8) },
    barRow: { flexDirection: 'row', alignItems: 'center', gap: scale(8) },
    barLabel: { fontSize: ms(11), color: '#555', width: scale(80) },
    barTrack: { flex: 1, height: vs(10), backgroundColor: '#F0F0F8', borderRadius: ms(5), overflow: 'hidden' },
    barFill: { height: '100%', backgroundColor: '#7C3AED', borderRadius: ms(5) },
    barValue: { fontSize: ms(11), color: '#555', width: scale(24), textAlign: 'right' },

});

export default AdminAnalyticsScreen;
