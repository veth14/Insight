import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, StatusBar, ActivityIndicator, RefreshControl,
    Modal, TouchableWithoutFeedback, ScrollView, Switch,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../../services/api.service';
import { scale, vs, ms } from '../../utils/responsive';

/* -- Types ---------------------------------------------------------------- */

type UserStatus = 'active' | 'suspended';
type FilterTab  = 'all' | UserStatus;

interface AdminUser {
    uid: string;
    displayName: string;
    email: string;
    studentNumber: string;
    phoneNumber?: string;
    role: string;
    yearLevel?: number;
    program?: string;
    status: UserStatus;
    studentAccessRights?: boolean;
    lastActiveAt?: string;
    createdAt: string;
}

interface EditForm {
    displayName: string;
    phoneNumber: string;
    yearLevel: number;
    status: UserStatus;
    studentAccessRights: boolean;
}

/* -- Helpers -------------------------------------------------------------- */

const AVATAR_COLORS = ['#6C7FD8', '#F59E0B', '#22C55E', '#EF4444', '#8B5CF6', '#14B8A6'];

function getColor(name: string): string {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
    return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
}

function timeAgo(dateStr?: string): string {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m2 = Math.floor(s / 60);
    if (m2 < 60) return `${m2}m ago`;
    const h = Math.floor(m2 / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function yearLabel(y?: number): string {
    const map: Record<number, string> = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: '5th Year' };
    return y ? (map[y] ?? `${y}th Year`) : '';
}

const YEAR_OPTIONS = [
    { label: 'All Year', value: 0 },
    { label: '1st Year', value: 1 },
    { label: '2nd Year', value: 2 },
    { label: '3rd Year', value: 3 },
    { label: '4th Year', value: 4 },
];

/* -- Screen -------------------------------------------------------------- */

const ManageUsersScreen: React.FC = () => {
    const navigation = useNavigation();

    const [users, setUsers]             = useState<AdminUser[]>([]);
    const [loading, setLoading]         = useState(true);
    const [refreshing, setRefreshing]   = useState(false);
    const [search, setSearch]           = useState('');
    const [filter, setFilter]           = useState<FilterTab>('all');
    const [menuUser, setMenuUser]       = useState<AdminUser | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    /* Edit modal */
    const [editUser, setEditUser]       = useState<AdminUser | null>(null);
    const [editForm, setEditForm]       = useState<EditForm>({
        displayName: '', phoneNumber: '', yearLevel: 0, status: 'active', studentAccessRights: true,
    });
    const [editLoading, setEditLoading] = useState(false);
    const [yearPickerOpen, setYearPickerOpen]     = useState(false);
    const [statusPickerOpen, setStatusPickerOpen] = useState(false);

    const menuBtnRefs = useRef<Record<string, any>>({});
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* -- Data ---- */
    const fetchUsers = useCallback(async (q: string, st: FilterTab, isRefresh: boolean) => {
        if (!isRefresh) setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (q.trim()) params.search = q.trim();
            if (st !== 'all') params.status = st;
            const res = await api.get('/admin/users', { params });
            setUsers(res.data.users ?? []);
        } catch { /* ignore */ }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useFocusEffect(useCallback(() => { fetchUsers(search, filter, false); }, [fetchUsers, filter]));

    const onSearchChange = (text: string) => {
        setSearch(text);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => fetchUsers(text, filter, false), 400);
    };

    const onRefresh = () => { setRefreshing(true); fetchUsers(search, filter, true); };

    /* -- Context menu ---- */
    const openMenu = (user: AdminUser, ref: any) => {
        if (ref?.current) {
            ref.current.measureInWindow((_x: number, y: number, _w: number, h: number) => {
                setMenuPosition({ top: y + h + vs(4) });
                setMenuUser(user);
            });
        }
    };

    const closeMenu = () => { setMenuUser(null); setMenuPosition(null); };

    /* -- Suspend / Activate ---- */
    const handleToggleStatus = async (user: AdminUser) => {
        closeMenu();
        setActionLoading(true);
        const newStatus = user.status === 'active' ? 'suspended' : 'active';
        try {
            await api.patch(`/admin/users/${user.uid}/status`, { status: newStatus });
            setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, status: newStatus } : u));
        } catch { /* ignore */ }
        finally { setActionLoading(false); }
    };

    /* -- Edit ---- */
    const openEdit = (user: AdminUser) => {
        closeMenu();
        setEditForm({
            displayName: user.displayName,
            phoneNumber: user.phoneNumber ?? '',
            yearLevel: user.yearLevel ?? 0,
            status: user.status,
            studentAccessRights: user.studentAccessRights ?? true,
        });
        setYearPickerOpen(false);
        setStatusPickerOpen(false);
        setEditUser(user);
    };

    const handleSaveEdit = async () => {
        if (!editUser) return;
        setEditLoading(true);
        try {
            const res = await api.put(`/admin/users/${editUser.uid}`, editForm);
            setUsers(prev => prev.map(u => u.uid === editUser.uid ? { ...u, ...res.data.user } : u));
            setEditUser(null);
        } catch { /* ignore */ }
        finally { setEditLoading(false); }
    };

    /* -- User Card ---- */
    const UserCard: React.FC<{ item: AdminUser }> = ({ item }) => {
        const btnRef = useRef<any>(null);
        menuBtnRefs.current[item.uid] = btnRef;
        const yearLine = [yearLabel(item.yearLevel), item.program].filter(Boolean).join(' \u2022 ');

        return (
            <View style={styles.card}>
                <View style={[styles.avatar, { backgroundColor: getColor(item.displayName) }]}>
                    <Text style={styles.avatarText}>{getInitials(item.displayName)}</Text>
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{item.displayName}</Text>
                    <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
                    {!!yearLine && <Text style={styles.userMeta}>{yearLine}</Text>}
                    <View style={styles.cardFooter}>
                        <View style={[styles.statusDot, { backgroundColor: item.status === 'active' ? '#22C55E' : '#F59E0B' }]} />
                        <Text style={styles.statusText}>
                            {item.status === 'active' ? 'Active' : 'Suspended'}
                        </Text>
                        <Text style={styles.lastActive}> \u00b7 {timeAgo(item.lastActiveAt)}</Text>
                    </View>
                </View>

                {/* Three-dot menu button */}
                <TouchableOpacity
                    ref={btnRef}
                    style={styles.menuBtn}
                    onPress={() => openMenu(item, btnRef)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="ellipsis-vertical" size={ms(18)} color="#9AADCA" />
                </TouchableOpacity>
            </View>
        );
    };

    const TABS: { key: FilterTab; label: string }[] = [
        { key: 'all',       label: 'All' },
        { key: 'active',    label: 'Active' },
        { key: 'suspended', label: 'Suspended' },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />

            {/* Top bar — matches ChangePassword / Settings style */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <Ionicons name="chevron-back" size={20} color="#0E1F43" />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>Manage Users</Text>
                <View style={{ width: scale(36) }} />
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
                <Ionicons name="search-outline" size={16} color="#9AADCA" style={{ marginRight: scale(8) }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, email or ID..."
                    placeholderTextColor="#9AADCA"
                    value={search}
                    onChangeText={onSearchChange}
                    autoCapitalize="none"
                    clearButtonMode="while-editing"
                />
            </View>

            {/* Filter tabs */}
            <View style={styles.tabsRow}>
                {TABS.map(t => (
                    <TouchableOpacity
                        key={t.key}
                        style={[styles.tab, filter === t.key && styles.tabActive]}
                        onPress={() => setFilter(t.key)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.tabText, filter === t.key && styles.tabTextActive]}>{t.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#0E1F43" />
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={item => item.uid}
                    renderItem={({ item }) => <UserCard item={item} />}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0E1F43" />}
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <Ionicons name="people-outline" size={ms(40)} color="#C0CDE8" />
                            <Text style={styles.emptyText}>No users found</Text>
                        </View>
                    }
                />
            )}

            {/* Context menu — inline positioned */}
            {menuUser && menuPosition && (
                <>
                    <TouchableWithoutFeedback onPress={closeMenu}>
                        <View style={StyleSheet.absoluteFill} />
                    </TouchableWithoutFeedback>
                    <View style={[styles.contextMenu, { top: menuPosition.top, right: scale(16) }]}>
                        {/* Suspend / Activate */}
                        <TouchableOpacity
                            style={styles.contextItem}
                            onPress={() => handleToggleStatus(menuUser)}
                            activeOpacity={0.8}
                            disabled={actionLoading}
                        >
                            <Ionicons
                                name={menuUser.status === 'active' ? 'ban-outline' : 'checkmark-circle-outline'}
                                size={ms(16)}
                                color={menuUser.status === 'active' ? '#F59E0B' : '#22C55E'}
                            />
                            <Text style={[styles.contextItemText, {
                                color: menuUser.status === 'active' ? '#F59E0B' : '#22C55E',
                            }]}>
                                {menuUser.status === 'active' ? 'Suspend User' : 'Activate User'}
                            </Text>
                        </TouchableOpacity>
                        <View style={styles.contextDivider} />
                        {/* Edit */}
                        <TouchableOpacity
                            style={styles.contextItem}
                            onPress={() => openEdit(menuUser)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="create-outline" size={ms(16)} color="#5B8DEF" />
                            <Text style={[styles.contextItemText, { color: '#5B8DEF' }]}>Edit User</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}

            {/* Edit User Modal */}
            <Modal visible={!!editUser} transparent animationType="slide" onRequestClose={() => setEditUser(null)}>
                {/* Dim backdrop */}
                <TouchableWithoutFeedback onPress={() => setEditUser(null)}>
                    <View style={styles.editBackdrop} />
                </TouchableWithoutFeedback>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.editOverlay}
                    pointerEvents="box-none"
                >
                    <View style={styles.editSheet}>
                        {/* Handle */}
                        <View style={styles.editHandle} />
                        <Text style={styles.editTitle}>Edit User</Text>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                            {/* Full Name */}
                            <Text style={styles.fieldLabel}>Full Name</Text>
                            <TextInput
                                style={styles.fieldInput}
                                value={editForm.displayName}
                                onChangeText={v => setEditForm(f => ({ ...f, displayName: v }))}
                                placeholder="Full name"
                                placeholderTextColor="#C0CDE8"
                            />

                            {/* Email (disabled) */}
                            <Text style={styles.fieldLabel}>Email Address</Text>
                            <TextInput
                                style={[styles.fieldInput, styles.fieldDisabled]}
                                value={editUser?.email ?? ''}
                                editable={false}
                            />

                            {/* Phone */}
                            <Text style={styles.fieldLabel}>Phone Number</Text>
                            <TextInput
                                style={styles.fieldInput}
                                value={editForm.phoneNumber}
                                onChangeText={v => setEditForm(f => ({ ...f, phoneNumber: v }))}
                                placeholder="Phone number"
                                placeholderTextColor="#C0CDE8"
                                keyboardType="phone-pad"
                            />

                            {/* Student ID (disabled) */}
                            <Text style={styles.fieldLabel}>Student ID</Text>
                            <TextInput
                                style={[styles.fieldInput, styles.fieldDisabled]}
                                value={editUser?.studentNumber ?? ''}
                                editable={false}
                            />
                            <Text style={styles.fieldNote}>Student ID cannot be modified</Text>

                            {/* Year Level dropdown */}
                            <Text style={styles.fieldLabel}>Year Level</Text>
                            <TouchableOpacity
                                style={styles.dropdownTrigger}
                                onPress={() => { setYearPickerOpen(v => !v); setStatusPickerOpen(false); }}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.dropdownValue}>
                                    {YEAR_OPTIONS.find(o => o.value === editForm.yearLevel)?.label ?? 'All Year'}
                                </Text>
                                <Ionicons name={yearPickerOpen ? 'chevron-up' : 'chevron-down'} size={ms(14)} color="#9AADCA" />
                            </TouchableOpacity>
                            {yearPickerOpen && (
                                <View style={styles.dropdownList}>
                                    {YEAR_OPTIONS.map(o => (
                                        <TouchableOpacity
                                            key={o.value}
                                            style={[styles.dropdownItem, editForm.yearLevel === o.value && styles.dropdownItemActive]}
                                            onPress={() => { setEditForm(f => ({ ...f, yearLevel: o.value })); setYearPickerOpen(false); }}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={[styles.dropdownItemText, editForm.yearLevel === o.value && styles.dropdownItemTextActive]}>
                                                {o.label}
                                            </Text>
                                            {editForm.yearLevel === o.value && <Ionicons name="checkmark" size={ms(14)} color="#0E1F43" />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Account Status dropdown */}
                            <Text style={styles.fieldLabel}>Account Status</Text>
                            <TouchableOpacity
                                style={styles.dropdownTrigger}
                                onPress={() => { setStatusPickerOpen(v => !v); setYearPickerOpen(false); }}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.dropdownValue}>
                                    {editForm.status === 'active' ? 'Active' : 'Suspended'}
                                </Text>
                                <Ionicons name={statusPickerOpen ? 'chevron-up' : 'chevron-down'} size={ms(14)} color="#9AADCA" />
                            </TouchableOpacity>
                            {statusPickerOpen && (
                                <View style={styles.dropdownList}>
                                    {(['active', 'suspended'] as UserStatus[]).map(s => (
                                        <TouchableOpacity
                                            key={s}
                                            style={[styles.dropdownItem, editForm.status === s && styles.dropdownItemActive]}
                                            onPress={() => { setEditForm(f => ({ ...f, status: s })); setStatusPickerOpen(false); }}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={[styles.dropdownItemText, editForm.status === s && styles.dropdownItemTextActive]}>
                                                {s === 'active' ? 'Active' : 'Suspended'}
                                            </Text>
                                            {editForm.status === s && <Ionicons name="checkmark" size={ms(14)} color="#0E1F43" />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Student Access Rights toggle */}
                            <View style={styles.toggleRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.fieldLabel}>Student Access Rights</Text>
                                    <Text style={styles.fieldNote}>Allow access to student features</Text>
                                </View>
                                <Switch
                                    value={editForm.studentAccessRights}
                                    onValueChange={v => setEditForm(f => ({ ...f, studentAccessRights: v }))}
                                    trackColor={{ false: '#D0D8E8', true: '#0E1F43' }}
                                    thumbColor="#fff"
                                    ios_backgroundColor="#D0D8E8"
                                />
                            </View>

                            {/* Actions */}
                            <TouchableOpacity
                                style={[styles.saveBtn, editLoading && { opacity: 0.6 }]}
                                onPress={handleSaveEdit}
                                disabled={editLoading}
                                activeOpacity={0.8}
                            >
                                {editLoading
                                    ? <ActivityIndicator color="#fff" size="small" />
                                    : <Text style={styles.saveBtnText}>Save Changes</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setEditUser(null)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

/* -- Styles -------------------------------------------------------------- */

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },

    /* Header — ChangePassword style */
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

    searchRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        marginHorizontal: scale(16), marginBottom: vs(10),
        borderRadius: ms(12), borderWidth: 1, borderColor: '#E8ECF4',
        paddingHorizontal: scale(12), height: vs(40),
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    searchInput: { flex: 1, fontSize: ms(13), color: '#0E1F43' },

    tabsRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: scale(16), gap: scale(8), marginBottom: vs(10),
    },
    tab: { paddingHorizontal: scale(16), paddingVertical: vs(6), borderRadius: ms(20) },
    tabActive: { backgroundColor: '#0E1F43' },
    tabText: { fontSize: ms(13), fontWeight: '600', color: '#9AADCA' },
    tabTextActive: { color: '#fff' },

    list: { paddingHorizontal: scale(16), paddingBottom: vs(40), gap: vs(8) },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: vs(80), gap: vs(8) },
    emptyText: { fontSize: ms(14), color: '#9AADCA', fontWeight: '700' },

    /* Card */
    card: {
        backgroundColor: '#fff', borderRadius: ms(14),
        paddingHorizontal: scale(14), paddingVertical: vs(12),
        flexDirection: 'row', alignItems: 'center', gap: scale(12),
        borderWidth: 1, borderColor: '#F0F2F8',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    avatar: { width: scale(44), height: scale(44), borderRadius: ms(22), justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    avatarText: { fontSize: ms(15), fontWeight: '800', color: '#fff' },
    userName:  { fontSize: ms(13), fontWeight: '700', color: '#0E1F43' },
    userEmail: { fontSize: ms(11), color: '#9AADCA', marginTop: vs(1) },
    userMeta:  { fontSize: ms(11), color: '#C0CDE8', marginTop: vs(1) },
    cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: vs(4) },
    statusDot:  { width: scale(7), height: scale(7), borderRadius: ms(4) },
    statusText: { fontSize: ms(11), fontWeight: '600', color: '#5B6F96', marginLeft: scale(5) },
    lastActive: { fontSize: ms(11), color: '#C0CDE8' },
    menuBtn: { padding: scale(4) },

    /* Context menu */
    contextMenu: {
        position: 'absolute', right: scale(16),
        backgroundColor: '#fff', borderRadius: ms(12),
        borderWidth: 1, borderColor: '#F0F2F8',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12, shadowRadius: 12, elevation: 8,
        minWidth: scale(160), zIndex: 999,
    },
    contextItem: {
        flexDirection: 'row', alignItems: 'center', gap: scale(10),
        paddingHorizontal: scale(14), paddingVertical: vs(11),
    },
    contextItemText: { fontSize: ms(13), fontWeight: '600' },
    contextDivider: { height: 1, backgroundColor: '#F5F6FA' },

    /* Edit bottom sheet */
    editBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(14,31,67,0.55)',
    },
    editOverlay: { flex: 1, justifyContent: 'flex-end', pointerEvents: 'box-none' },
    editSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: ms(28), borderTopRightRadius: ms(28),
        paddingHorizontal: scale(20), paddingTop: vs(12), paddingBottom: vs(40),
        height: '62%',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.18, shadowRadius: 20, elevation: 24,
    },
    editHandle: {
        width: scale(40), height: vs(4), backgroundColor: '#E0E5F0',
        borderRadius: ms(4), alignSelf: 'center', marginBottom: vs(14),
    },
    editTitle: { fontSize: ms(17), fontWeight: '800', color: '#0E1F43', marginBottom: vs(14) },

    fieldLabel: { fontSize: ms(11), fontWeight: '700', color: '#9AADCA', textTransform: 'uppercase', marginBottom: vs(5), marginTop: vs(10) },
    fieldInput: {
        borderWidth: 1, borderColor: '#E8ECF4', borderRadius: ms(10),
        paddingHorizontal: scale(12), height: vs(42), fontSize: ms(13), color: '#0E1F43',
        backgroundColor: '#fff',
    },
    fieldDisabled: { backgroundColor: '#F5F6FA', color: '#9AADCA' },
    fieldNote: { fontSize: ms(10), color: '#C0CDE8', marginTop: vs(3) },

    dropdownTrigger: {
        borderWidth: 1, borderColor: '#E8ECF4', borderRadius: ms(10),
        paddingHorizontal: scale(12), height: vs(42),
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#fff',
    },
    dropdownValue: { fontSize: ms(13), color: '#0E1F43' },
    dropdownList: {
        borderWidth: 1, borderColor: '#E8ECF4', borderRadius: ms(10),
        marginTop: vs(2), overflow: 'hidden', backgroundColor: '#fff',
    },
    dropdownItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: scale(14), paddingVertical: vs(10),
        borderBottomWidth: 1, borderBottomColor: '#F5F6FA',
    },
    dropdownItemActive: { backgroundColor: '#F5F8FF' },
    dropdownItemText: { fontSize: ms(13), color: '#9AADCA' },
    dropdownItemTextActive: { color: '#0E1F43', fontWeight: '700' },

    toggleRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: vs(12), borderBottomWidth: 1, borderBottomColor: '#F5F6FA',
    },

    saveBtn: {
        backgroundColor: '#0E1F43', borderRadius: ms(12),
        paddingVertical: vs(13), alignItems: 'center', marginTop: vs(20), marginBottom: vs(8),
    },
    saveBtnText: { fontSize: ms(14), fontWeight: '700', color: '#fff' },
    cancelBtn: {
        borderWidth: 1, borderColor: '#E8ECF4', borderRadius: ms(12),
        paddingVertical: vs(12), alignItems: 'center',
    },
    cancelBtnText: { fontSize: ms(13), fontWeight: '600', color: '#9AADCA' },
});

export default ManageUsersScreen;
