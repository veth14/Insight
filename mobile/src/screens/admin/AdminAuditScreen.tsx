import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../../services/api.service';
import { scale, vs, ms } from '../../utils/responsive';

/* ── Types ──────────────────────────────────────────────────────────── */

type AuditAction =
    | 'SUSPEND_USER' | 'ACTIVATE_USER' | 'EDIT_USER' | 'CHANGE_PASSWORD'
    | 'APPROVED_REGISTRATION' | 'REJECTED_REGISTRATION'
    | 'APPROVED_LITERATURE'  | 'REJECTED_LITERATURE';

type CategoryFilter = 'all' | 'users' | 'literature' | 'security';
type DatePreset     = 'all' | 'today' | 'week' | 'month' | 'custom';

interface AuditLog {
    _id: string; adminUid: string; adminName: string;
    action: AuditAction; targetName?: string; details?: string; createdAt: string;
}

/* ── Config ─────────────────────────────────────────────────────────── */

const ACTION_META: Record<AuditAction, { label: string; icon: string; color: string; bg: string; category: CategoryFilter }> = {
    SUSPEND_USER:           { label: 'Suspended User',        icon: 'ban-outline',               color: '#F59E0B', bg: '#FEF3C7', category: 'users' },
    ACTIVATE_USER:          { label: 'Activated User',        icon: 'checkmark-circle-outline',  color: '#22C55E', bg: '#DCFCE7', category: 'users' },
    EDIT_USER:              { label: 'Edited User',           icon: 'create-outline',            color: '#5B8DEF', bg: '#EEF2FF', category: 'users' },
    CHANGE_PASSWORD:        { label: 'Reset Password',        icon: 'key-outline',               color: '#9AADCA', bg: '#F5F6FA', category: 'security' },
    APPROVED_REGISTRATION:  { label: 'Approved Registration', icon: 'person-add-outline',        color: '#22C55E', bg: '#DCFCE7', category: 'security' },
    REJECTED_REGISTRATION:  { label: 'Rejected Registration', icon: 'person-remove-outline',     color: '#EF4444', bg: '#FEE2E2', category: 'security' },
    APPROVED_LITERATURE:    { label: 'Approved Literature',   icon: 'book-outline',              color: '#22C55E', bg: '#DCFCE7', category: 'literature' },
    REJECTED_LITERATURE:    { label: 'Rejected Literature',   icon: 'close-circle-outline',      color: '#EF4444', bg: '#FEE2E2', category: 'literature' },
};

const CATEGORIES: { key: CategoryFilter; label: string; icon: string }[] = [
    { key: 'all',        label: 'All',        icon: 'apps-outline' },
    { key: 'users',      label: 'Users',      icon: 'people-outline' },
    { key: 'literature', label: 'Literature', icon: 'book-outline' },
    { key: 'security',   label: 'Security',   icon: 'shield-checkmark-outline' },
];

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
    { key: 'all',    label: 'All Time' },
    { key: 'today',  label: 'Today' },
    { key: 'week',   label: 'This Week' },
    { key: 'month',  label: 'This Month' },
    { key: 'custom', label: 'Custom Range' },
];

/* ── Helpers ────────────────────────────────────────────────────────── */

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDateTime(dateStr: string): string {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${MONTHS[d.getMonth()]} ${pad(d.getDate())}, ${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Parse YYYY-MM-DD → Date (start of day). Returns null if invalid. */
function parseDate(str: string): Date | null {
    const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d;
}

function isWithinPreset(dateStr: string, preset: DatePreset, from: string, to: string): boolean {
    const ts = new Date(dateStr).getTime();
    const diff = Date.now() - ts;
    if (preset === 'today') return diff < 86_400_000;
    if (preset === 'week')  return diff < 7 * 86_400_000;
    if (preset === 'month') return diff < 30 * 86_400_000;
    if (preset === 'custom') {
        const f = parseDate(from);
        const t = parseDate(to);
        const start = f ? f.getTime() : 0;
        const end   = t ? t.getTime() + 86_399_999 : Date.now();
        return ts >= start && ts <= end;
    }
    return true;
}

/* ── Component ──────────────────────────────────────────────────────── */

const AdminAuditScreen: React.FC = () => {
    const navigation = useNavigation();
    const [logs, setLogs]             = useState<AuditLog[]>([]);
    const [loading, setLoading]       = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch]         = useState('');
    const [category, setCategory]     = useState<CategoryFilter>('all');
    const [datePreset, setDatePreset] = useState<DatePreset>('all');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo]     = useState('');
    const [catOpen, setCatOpen]       = useState(false);
    const [dateOpen, setDateOpen]     = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchLogs = useCallback(async (searchVal: string, isRefresh: boolean) => {
        if (!isRefresh) setLoading(true);
        try {
            const params: Record<string, string> = { limit: '200' };
            if (searchVal.trim()) params.search = searchVal.trim();
            const res = await api.get('/admin/audit', { params });
            setLogs(res.data.logs ?? []);
        } catch { /* silently fail */ }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useFocusEffect(useCallback(() => { fetchLogs(search, false); }, [fetchLogs]));

    const onSearchChange = (text: string) => {
        setSearch(text);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => fetchLogs(text, false), 400);
    };

    const onRefresh = () => { setRefreshing(true); fetchLogs(search, true); };

    const filtered = logs.filter(log => {
        const meta = ACTION_META[log.action];
        if (category !== 'all' && meta?.category !== category) return false;
        if (!isWithinPreset(log.createdAt, datePreset, customFrom, customTo)) return false;
        return true;
    });

    const catLabel  = CATEGORIES.find(c => c.key === category)?.label ?? 'All';
    const dateLabel = datePreset === 'custom'
        ? (customFrom || customTo ? `${customFrom || '…'} → ${customTo || '…'}` : 'Custom')
        : DATE_PRESETS.find(d => d.key === datePreset)?.label ?? 'All Time';
    const hasFilters = category !== 'all' || datePreset !== 'all';

    /* ── Log Row ── */
    const LogRow = ({ item }: { item: AuditLog }) => {
        const meta = ACTION_META[item.action] ?? {
            label: item.action, icon: 'ellipsis-horizontal-circle-outline',
            color: '#9AADCA', bg: '#F5F6FA', category: 'all' as CategoryFilter,
        };
        const expanded = expandedId === item._id;
        return (
            <TouchableOpacity
                style={styles.logCard}
                onPress={() => setExpandedId(expanded ? null : item._id)}
                activeOpacity={0.85}
            >
                {/* Colour strip */}
                <View style={[styles.logStrip, { backgroundColor: meta.color }]} />

                <View style={[styles.logIconBox, { backgroundColor: meta.bg }]}>
                    <Ionicons name={meta.icon as any} size={ms(16)} color={meta.color} />
                </View>

                <View style={{ flex: 1 }}>
                    <View style={styles.logTopRow}>
                        <Text style={styles.logAction}>{meta.label}</Text>
                        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={ms(13)} color="#C0CDE8" />
                    </View>
                    <Text style={styles.logSub} numberOfLines={1}>
                        <Text style={styles.logBy}>{item.adminName}</Text>
                        {item.targetName ? <Text style={styles.logArrow}> → {item.targetName}</Text> : null}
                    </Text>
                    <Text style={styles.logTime}>{formatDateTime(item.createdAt)}</Text>

                    {expanded && (
                        <View style={styles.detailBox}>
                            <Ionicons
                                name="information-circle-outline"
                                size={ms(13)}
                                color={item.details ? '#5B8DEF' : '#C0CDE8'}
                            />
                            <Text style={[styles.detailText, !item.details && { color: '#C0CDE8' }]}>
                                {item.details ?? 'No additional details recorded.'}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#ECEEF8" />

            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <Ionicons name="chevron-back" size={ms(20)} color="#0E1F43" />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>Admin Audit Trail</Text>
                <View style={{ width: scale(36) }} />
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
                <Ionicons name="search-outline" size={16} color="#9AADCA" style={{ marginRight: scale(8) }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by action, target, admin..."
                    placeholderTextColor="#9AADCA"
                    value={search}
                    onChangeText={onSearchChange}
                    autoCapitalize="none"
                    clearButtonMode="while-editing"
                />
            </View>

            {/* ── Compact filter bar ── */}
            <View style={styles.filterBar}>
                {/* Category pill */}
                <TouchableOpacity
                    style={[styles.filterPill, catOpen && styles.filterPillOpen, category !== 'all' && styles.filterPillActive]}
                    onPress={() => { setCatOpen(v => !v); setDateOpen(false); }}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name="people-outline"
                        size={ms(12)}
                        color={category !== 'all' ? '#fff' : '#9AADCA'}
                    />
                    <Text style={[styles.filterPillText, category !== 'all' && styles.filterPillTextActive]}>
                        {catLabel}
                    </Text>
                    <Ionicons name={catOpen ? 'chevron-up' : 'chevron-down'} size={ms(11)} color={category !== 'all' ? '#fff' : '#9AADCA'} />
                </TouchableOpacity>

                {/* Date pill */}
                <TouchableOpacity
                    style={[styles.filterPill, dateOpen && styles.filterPillOpen, datePreset !== 'all' && styles.filterPillActive]}
                    onPress={() => { setDateOpen(v => !v); setCatOpen(false); }}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name="calendar-outline"
                        size={ms(12)}
                        color={datePreset !== 'all' ? '#fff' : '#9AADCA'}
                    />
                    <Text style={[styles.filterPillText, datePreset !== 'all' && styles.filterPillTextActive]} numberOfLines={1}>
                        {dateLabel}
                    </Text>
                    <Ionicons name={dateOpen ? 'chevron-up' : 'chevron-down'} size={ms(11)} color={datePreset !== 'all' ? '#fff' : '#9AADCA'} />
                </TouchableOpacity>

                {/* Clear — only when filters active */}
                {hasFilters && (
                    <TouchableOpacity
                        style={styles.clearBtn}
                        onPress={() => { setCategory('all'); setDatePreset('all'); setCustomFrom(''); setCustomTo(''); }}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="close-circle" size={ms(16)} color="#EF4444" />
                    </TouchableOpacity>
                )}

                {/* Result count right-aligned */}
                <Text style={styles.resultCount}>{filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}</Text>
            </View>

            {/* Category dropdown */}
            {catOpen && (
                <View style={styles.dropdown}>
                    {CATEGORIES.map(c => (
                        <TouchableOpacity
                            key={c.key}
                            style={[styles.dropdownItem, category === c.key && styles.dropdownItemActive]}
                            onPress={() => { setCategory(c.key); setCatOpen(false); }}
                            activeOpacity={0.8}
                        >
                            <Ionicons name={c.icon as any} size={ms(14)} color={category === c.key ? '#0E1F43' : '#9AADCA'} />
                            <Text style={[styles.dropdownText, category === c.key && styles.dropdownTextActive]}>{c.label}</Text>
                            {category === c.key && <Ionicons name="checkmark" size={ms(14)} color="#0E1F43" style={{ marginLeft: 'auto' }} />}
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Date dropdown */}
            {dateOpen && (
                <View style={styles.dropdown}>
                    {DATE_PRESETS.map(d => (
                        <TouchableOpacity
                            key={d.key}
                            style={[styles.dropdownItem, datePreset === d.key && styles.dropdownItemActive]}
                            onPress={() => { setDatePreset(d.key); if (d.key !== 'custom') setDateOpen(false); }}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={d.key === 'custom' ? 'calendar-number-outline' : 'time-outline'}
                                size={ms(14)} color={datePreset === d.key ? '#0E1F43' : '#9AADCA'}
                            />
                            <Text style={[styles.dropdownText, datePreset === d.key && styles.dropdownTextActive]}>{d.label}</Text>
                            {datePreset === d.key && d.key !== 'custom' && <Ionicons name="checkmark" size={ms(14)} color="#0E1F43" style={{ marginLeft: 'auto' }} />}
                        </TouchableOpacity>
                    ))}

                    {/* Custom date range inputs */}
                    {datePreset === 'custom' && (
                        <View style={styles.customDateRow}>
                            <View style={styles.customDateField}>
                                <Text style={styles.customDateLabel}>From</Text>
                                <TextInput
                                    style={styles.customDateInput}
                                    value={customFrom}
                                    onChangeText={setCustomFrom}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#C0CDE8"
                                    keyboardType="numbers-and-punctuation"
                                    maxLength={10}
                                />
                            </View>
                            <Ionicons name="arrow-forward" size={ms(14)} color="#9AADCA" style={{ marginTop: vs(18) }} />
                            <View style={styles.customDateField}>
                                <Text style={styles.customDateLabel}>To</Text>
                                <TextInput
                                    style={styles.customDateInput}
                                    value={customTo}
                                    onChangeText={setCustomTo}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#C0CDE8"
                                    keyboardType="numbers-and-punctuation"
                                    maxLength={10}
                                />
                            </View>
                            <TouchableOpacity
                                style={styles.applyBtn}
                                onPress={() => setDateOpen(false)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.applyBtnText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {/* List */}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#0E1F43" />
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item._id}
                    renderItem={({ item }) => <LogRow item={item} />}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0E1F43" />}
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <Ionicons name="clipboard-outline" size={ms(40)} color="#C0CDE8" />
                            <Text style={styles.emptyText}>No audit logs found</Text>
                            <Text style={styles.emptySub}>Try adjusting your filters</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

/* ── Styles ─────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ECEEF8' },

    topBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: scale(16), paddingVertical: vs(10),
    },
    backBtn: {
        width: scale(36), height: vs(36), borderRadius: ms(10),
        backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#E0E5F0',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
    },
    topBarTitle: { fontSize: ms(16), fontWeight: '800', color: '#0E1F43' },

    searchRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        marginHorizontal: scale(16), marginBottom: vs(8),
        borderRadius: ms(12), borderWidth: 1, borderColor: '#E8ECF4',
        paddingHorizontal: scale(12), height: vs(40),
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    searchInput: { flex: 1, fontSize: ms(13), color: '#0E1F43' },

    /* Filter bar — single compact row */
    filterBar: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: scale(16), marginBottom: vs(6), gap: scale(6),
    },
    filterPill: {
        flexDirection: 'row', alignItems: 'center', gap: scale(4),
        paddingHorizontal: scale(10), height: vs(30),
        borderRadius: ms(20), backgroundColor: '#fff',
        borderWidth: 1, borderColor: '#E8ECF4',
    },
    filterPillOpen: { borderColor: '#0E1F43' },
    filterPillActive: { backgroundColor: '#0E1F43', borderColor: '#0E1F43' },
    filterPillText: { fontSize: ms(11), fontWeight: '600', color: '#9AADCA', maxWidth: scale(80) },
    filterPillTextActive: { color: '#fff' },
    clearBtn: { padding: scale(2) },
    resultCount: { fontSize: ms(11), fontWeight: '600', color: '#9AADCA', marginLeft: 'auto' },

    /* Dropdowns */
    dropdown: {
        marginHorizontal: scale(16), marginBottom: vs(6),
        backgroundColor: '#fff', borderRadius: ms(14),
        borderWidth: 1, borderColor: '#F0F2F8',
        overflow: 'hidden',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 4,
    },
    dropdownItem: {
        flexDirection: 'row', alignItems: 'center', gap: scale(10),
        paddingHorizontal: scale(14), paddingVertical: vs(9),
        borderBottomWidth: 1, borderBottomColor: '#F5F6FA',
    },
    dropdownItemActive: { backgroundColor: '#F5F8FF' },
    dropdownText: { fontSize: ms(12), fontWeight: '600', color: '#9AADCA' },
    dropdownTextActive: { color: '#0E1F43' },

    /* Custom date inputs */
    customDateRow: {
        flexDirection: 'row', alignItems: 'flex-end', gap: scale(8),
        paddingHorizontal: scale(14), paddingTop: vs(4), paddingBottom: vs(12),
    },
    customDateField: { flex: 1 },
    customDateLabel: { fontSize: ms(10), fontWeight: '700', color: '#9AADCA', marginBottom: vs(4), textTransform: 'uppercase' },
    customDateInput: {
        height: vs(36), borderWidth: 1, borderColor: '#E8ECF4',
        borderRadius: ms(8), paddingHorizontal: scale(10),
        fontSize: ms(12), color: '#0E1F43', backgroundColor: '#F7F9FF',
    },
    applyBtn: {
        height: vs(36), paddingHorizontal: scale(12),
        backgroundColor: '#0E1F43', borderRadius: ms(8),
        justifyContent: 'center', alignItems: 'center', marginBottom: vs(0),
    },
    applyBtnText: { fontSize: ms(12), fontWeight: '700', color: '#fff' },

    /* List */
    list: { paddingHorizontal: scale(16), paddingBottom: vs(110), gap: vs(6) },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: vs(80), gap: vs(8) },
    emptyText: { fontSize: ms(14), color: '#9AADCA', fontWeight: '700' },
    emptySub: { fontSize: ms(12), color: '#C0CDE8' },

    /* Log card — compact */
    logCard: {
        backgroundColor: '#fff', borderRadius: ms(12),
        paddingHorizontal: scale(12), paddingVertical: vs(9),
        flexDirection: 'row', alignItems: 'flex-start', gap: scale(10),
        borderWidth: 1, borderColor: '#F0F2F8',
        overflow: 'hidden',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
    },
    logStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: scale(3) },
    logIconBox: {
        width: scale(32), height: scale(32), borderRadius: ms(10),
        justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: vs(1),
    },
    logTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: vs(1) },
    logAction: { fontSize: ms(12), fontWeight: '700', color: '#0E1F43', flex: 1 },
    logSub: { fontSize: ms(11), color: '#9AADCA', marginBottom: vs(2) },
    logBy: { fontWeight: '600', color: '#5B6F96' },
    logArrow: { color: '#9AADCA' },
    logTime: { fontSize: ms(10), color: '#C0CDE8' },

    detailBox: {
        flexDirection: 'row', alignItems: 'flex-start', gap: scale(6),
        marginTop: vs(8), backgroundColor: '#F7F9FF',
        borderRadius: ms(8), padding: scale(8),
        borderWidth: 1, borderColor: '#E8ECF4',
    },
    detailText: { flex: 1, fontSize: ms(11), color: '#5B6F96', lineHeight: ms(16) },
});

export default AdminAuditScreen;
