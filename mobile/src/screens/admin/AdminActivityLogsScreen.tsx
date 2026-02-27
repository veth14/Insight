import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, StatusBar, ActivityIndicator, RefreshControl,
    Modal, TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api.service';
import AdminHeader from '../../components/AdminHeader';
import { scale, vs, ms } from '../../utils/responsive';

/* ── Types ──────────────────────────────────────────────────────────── */
type FilterType = 'all' | 'upload' | 'download' | 'bookmark' | 'citation';

interface ActivityLog {
    _id: string;
    userId: string;
    userName: string;
    actionType: FilterType;
    actionLabel: string;
    studyTitle?: string;
    createdAt: string;
}

/* ── Filter options ─────────────────────────────────────────────────── */
const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all',      label: 'All' },
    { key: 'upload',   label: 'Uploads' },
    { key: 'download', label: 'Downloads' },
    { key: 'bookmark', label: 'Bookmarks' },
    { key: 'citation', label: 'Citations' },
];

/* ── Helpers ────────────────────────────────────────────────────────── */
const AVATAR_COLORS = ['#0E1F43', '#1E40AF', '#7C3AED', '#065F46', '#92400E', '#9B1C1C'];
const avatarColor = (name: string) =>
    AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

function initials(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function timeAgo(dateStr: string): string {
    const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (secs < 60)           return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60)           return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)            return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

/* ── Screen ─────────────────────────────────────────────────────────── */
const AdminActivityLogsScreen: React.FC = () => {
    const [logs, setLogs]             = useState<ActivityLog[]>([]);
    const [loading, setLoading]       = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch]         = useState('');
    const [filter, setFilter]         = useState<FilterType>('all');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownTop, setDropdownTop]   = useState(0);
    const filterBtnRef = useRef<View>(null);
    const searchTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchLogs = useCallback(async (q: string, type: FilterType, isRefresh: boolean) => {
        if (!isRefresh) setLoading(true);
        try {
            const params: Record<string, string> = { limit: '60' };
            if (q.trim())     params.search = q.trim();
            if (type !== 'all') params.type  = type;
            const res = await api.get('/admin/activities', { params });
            setLogs(res.data.activities ?? []);
        } catch (err) {
            console.error('fetchLogs error', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchLogs(search, filter, false); }, [fetchLogs, filter]));

    const onSearch = (text: string) => {
        setSearch(text);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => fetchLogs(text, filter, false), 400);
    };

    const onRefresh = () => { setRefreshing(true); fetchLogs(search, filter, true); };

    const openDropdown = () => {
        filterBtnRef.current?.measure((_x, _y, _w, h, _px, pageY) => {
            setDropdownTop(pageY + h + 4);
            setDropdownOpen(true);
        });
    };

    const applyFilter = (key: FilterType) => {
        setFilter(key);
        setDropdownOpen(false);
        fetchLogs(search, key, false);
    };

    const filterLabel = FILTERS.find(f => f.key === filter)?.label ?? 'All';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#ECEEF8" />
            <AdminHeader />

            <View style={styles.content}>
                <Text style={styles.title}>Activity Logs</Text>

                {/* Search bar */}
                <View style={styles.searchBox}>
                    <Ionicons name="search-outline" size={ms(16)} color="#9AADCA" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search activities..."
                        placeholderTextColor="#9AADCA"
                        value={search}
                        onChangeText={onSearch}
                        returnKeyType="search"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => { setSearch(''); fetchLogs('', filter, false); }}>
                            <Ionicons name="close-circle" size={ms(16)} color="#9AADCA" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filter row */}
                <View style={styles.filterRow}>
                    <View ref={filterBtnRef} collapsable={false}>
                        <TouchableOpacity style={styles.filterBtn} onPress={openDropdown} activeOpacity={0.75}>
                            <Ionicons name="filter-outline" size={ms(14)} color="#0E1F43" />
                            <Text style={styles.filterBtnText}>{filterLabel}</Text>
                            <Ionicons name="chevron-down-outline" size={ms(13)} color="#0E1F43" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* List */}
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#0E1F43" />
                    </View>
                ) : (
                    <FlatList
                        data={logs}
                        keyExtractor={item => item._id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0E1F43']} tintColor="#0E1F43" />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyBox}>
                                <Ionicons name="pulse-outline" size={ms(42)} color="#C8D0E0" />
                                <Text style={styles.emptyTitle}>No activity yet</Text>
                                <Text style={styles.emptySub}>
                                    User actions (uploads, downloads, bookmarks, citations) will appear here.
                                </Text>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <View style={styles.card}>
                                <View style={[styles.avatar, { backgroundColor: avatarColor(item.userName) }]}>
                                    <Text style={styles.avatarText}>{initials(item.userName)}</Text>
                                </View>
                                <View style={styles.cardBody}>
                                    <View style={styles.cardTop}>
                                        <Text style={styles.userName} numberOfLines={1}>{item.userName}</Text>
                                        <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
                                    </View>
                                    <Text style={styles.actionLabel}>{item.actionLabel}</Text>
                                    {!!item.studyTitle && (
                                        <Text style={styles.studyTitle} numberOfLines={1}>
                                            "{item.studyTitle}"
                                        </Text>
                                    )}
                                </View>
                            </View>
                        )}
                    />
                )}
            </View>

            {/* Dropdown modal */}
            <Modal
                transparent
                visible={dropdownOpen}
                animationType="fade"
                onRequestClose={() => setDropdownOpen(false)}
            >
                <TouchableWithoutFeedback onPress={() => setDropdownOpen(false)}>
                    <View style={StyleSheet.absoluteFill} />
                </TouchableWithoutFeedback>
                <View style={[styles.dropdown, { top: dropdownTop }]}>
                    {FILTERS.map(f => (
                        <TouchableOpacity
                            key={f.key}
                            style={[styles.dropdownItem, filter === f.key && styles.dropdownItemActive]}
                            onPress={() => applyFilter(f.key)}
                            activeOpacity={0.75}
                        >
                            <Text style={[styles.dropdownItemText, filter === f.key && styles.dropdownItemTextActive]}>
                                {f.label}
                            </Text>
                            {filter === f.key && (
                                <Ionicons name="checkmark" size={ms(14)} color="#0E1F43" />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </Modal>
        </SafeAreaView>
    );
};

/* ── Styles ─────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ECEEF8' },

    content: { flex: 1, paddingHorizontal: scale(16) },

    title: {
        fontSize: ms(22),
        fontWeight: '800',
        color: '#0E1F43',
        marginTop: vs(14),
        marginBottom: vs(12),
    },

    /* Search */
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: ms(12),
        paddingHorizontal: scale(12),
        paddingVertical: vs(9),
        gap: scale(8),
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        fontSize: ms(13),
        color: '#0E1F43',
        padding: 0,
    },

    /* Filter */
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: vs(10),
        marginBottom: vs(6),
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(5),
        backgroundColor: '#fff',
        borderRadius: ms(10),
        paddingHorizontal: scale(12),
        paddingVertical: vs(7),
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
    },
    filterBtnText: {
        fontSize: ms(13),
        fontWeight: '600',
        color: '#0E1F43',
    },

    /* List */
    listContent: { paddingBottom: vs(24), gap: vs(8) },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: vs(60) },

    /* Empty */
    emptyBox: {
        alignItems: 'center',
        paddingTop: vs(60),
        gap: vs(8),
        paddingHorizontal: scale(32),
    },
    emptyTitle: { fontSize: ms(15), fontWeight: '700', color: '#0E1F43', marginTop: vs(4) },
    emptySub:  { fontSize: ms(12), color: '#9AADCA', textAlign: 'center', lineHeight: ms(18) },

    /* Card */
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#fff',
        borderRadius: ms(14),
        padding: scale(14),
        gap: scale(12),
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    avatar: {
        width: scale(44),
        height: scale(44),
        borderRadius: ms(10),
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    avatarText: { fontSize: ms(14), fontWeight: '800', color: '#fff' },

    cardBody: { flex: 1, gap: vs(2) },
    cardTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

    userName:    { fontSize: ms(13), fontWeight: '700', color: '#0E1F43', flex: 1, marginRight: scale(8) },
    timeText:    { fontSize: ms(11), color: '#9AADCA', flexShrink: 0 },
    actionLabel: { fontSize: ms(12), color: '#5B6D8E', marginTop: vs(1) },
    studyTitle:  { fontSize: ms(12), color: '#9AADCA', fontStyle: 'italic', marginTop: vs(1) },

    /* Dropdown */
    dropdown: {
        position: 'absolute',
        right: scale(16),
        backgroundColor: '#fff',
        borderRadius: ms(12),
        paddingVertical: vs(4),
        minWidth: scale(140),
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 8,
        zIndex: 999,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: scale(16),
        paddingVertical: vs(10),
    },
    dropdownItemActive: { backgroundColor: '#F0F4FF' },
    dropdownItemText:       { fontSize: ms(13), color: '#4B5563' },
    dropdownItemTextActive: { fontWeight: '700', color: '#0E1F43' },
});

export default AdminActivityLogsScreen;

