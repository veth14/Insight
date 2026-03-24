import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Switch, StatusBar, TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useSecurity } from '../../contexts/SecurityContext';
import { scale, vs, ms } from '../../utils/responsive';
import api from '../../services/api.service';

const AdminSettingsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user, logout, refreshUser } = useAuth();
    const { appLockEnabled } = useSecurity();

    // Notification Preferences
    const [newRegistrations, setNewRegistrations] = useState(user?.notificationPreferences?.newRegistrations ?? true);
    const [literatureSubmissions, setLiteratureSubmissions] = useState(user?.notificationPreferences?.literatureSubmissions ?? true);

    // System Limits
    const [maxUpload, setMaxUpload] = useState(10);
    const [dailyDownload, setDailyDownload] = useState(50);

    useEffect(() => {
        if (user?.notificationPreferences) {
            setNewRegistrations(user.notificationPreferences.newRegistrations ?? true);
            setLiteratureSubmissions(user.notificationPreferences.literatureSubmissions ?? true);
        }
    }, [user?.notificationPreferences]);

    const updatePreferences = async (updates: { newRegistrations?: boolean, literatureSubmissions?: boolean }) => {
        try {
            await api.put('/auth/me', { notificationPreferences: updates });
            await refreshUser();
        } catch (error) {
            console.error('Failed to update preferences', error);
            Alert.alert('Error', 'Failed to update notification preferences.');
            // Revert state on failure
            if (user?.notificationPreferences) {
                setNewRegistrations(user.notificationPreferences.newRegistrations ?? true);
                setLiteratureSubmissions(user.notificationPreferences.literatureSubmissions ?? true);
            }
        }
    };

    const handleToggleRegistrations = (val: boolean) => {
        setNewRegistrations(val);
        updatePreferences({ newRegistrations: val, literatureSubmissions });
    };

    const handleToggleLiterature = (val: boolean) => {
        setLiteratureSubmissions(val);
        updatePreferences({ newRegistrations, literatureSubmissions: val });
    };

    const initials = user?.displayName
        ? user.displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
        : 'A';

    /* ------------------------------------------------------------------ */
    /* Sub-components                                                        */
    /* ------------------------------------------------------------------ */

    const SectionLabel = ({ title }: { title: string }) => (
        <Text style={styles.sectionLabel}>{title}</Text>
    );

    const ToggleRow = ({
        icon, label, subtitle, value, onValueChange,
    }: {
        icon: string; label: string; subtitle?: string;
        value: boolean; onValueChange: (v: boolean) => void;
    }) => (
        <View style={styles.row}>
            <View style={styles.rowIconBox}>
                <Ionicons name={icon as any} size={18} color="#0E1F43" />
            </View>
            <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>{label}</Text>
                {subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#D0D8E8', true: '#0E1F43' }}
                thumbColor="#fff"
                ios_backgroundColor="#D0D8E8"
            />
        </View>
    );

    const NavRow = ({
        icon, label, subtitle, onPress,
    }: {
        icon: string; label: string; subtitle?: string; onPress: () => void;
    }) => (
        <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.rowIconBox}>
                <Ionicons name={icon as any} size={18} color="#0E1F43" />
            </View>
            <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>{label}</Text>
                {subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={16} color="#C0CDE8" />
        </TouchableOpacity>
    );

    const Stepper = ({
        label, value, onChange,
    }: {
        label: string; value: number; onChange: (v: number) => void;
    }) => (
        <View style={styles.stepperBlock}>
            <Text style={styles.stepperLabel}>{label}</Text>
            <View style={styles.stepperRow}>
                <TextInput
                    style={styles.stepperInput}
                    value={String(value)}
                    keyboardType="numeric"
                    onChangeText={t => {
                        const n = parseInt(t, 10);
                        if (!isNaN(n) && n > 0) onChange(n);
                    }}
                />
                <View style={styles.stepperBtns}>
                    <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => onChange(value + 1)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-up" size={14} color="#0E1F43" />
                    </TouchableOpacity>
                    <View style={styles.stepperBtnDivider} />
                    <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => onChange(Math.max(1, value - 1))}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-down" size={14} color="#0E1F43" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    /* ------------------------------------------------------------------ */
    /* Render                                                               */
    /* ------------------------------------------------------------------ */

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />

            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <Ionicons name="chevron-back" size={20} color="#0E1F43" />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>Settings</Text>
                <View style={{ width: scale(36) }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                {/* Profile card */}
                <View style={styles.profileCard}>
                    <View style={styles.profileAvatar}>
                        <Text style={styles.profileAvatarText}>{initials}</Text>
                        <View style={styles.editBadge}>
                            <Ionicons name="pencil" size={10} color="#fff" />
                        </View>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.profileName}>{user?.displayName ?? 'Admin'}</Text>
                        <Text style={styles.profileEmail} numberOfLines={1}>{user?.email ?? ''}</Text>
                    </View>
                </View>

                {/* Account */}
                <View style={styles.card}>
                    <NavRow
                        icon="person-circle-outline"
                        label="My Account"
                        subtitle="Make changes to your account"
                        onPress={() => navigation.navigate('MyAccount')}
                    />
                    <View style={styles.divider} />
                    <NavRow
                        icon="shield-checkmark-outline"
                        label="Change password"
                        subtitle="Further secure your account for safety"
                        onPress={() => navigation.navigate('ChangePassword')}
                    />
                </View>

                {/* Notification Preferences */}
                <SectionLabel title="Notification Preferences" />
                <View style={styles.card}>
                    <ToggleRow
                        icon="person-add-outline"
                        label="New Registrations"
                        subtitle="Email alerts for new account requests"
                        value={newRegistrations}
                        onValueChange={handleToggleRegistrations}
                    />
                    <View style={styles.divider} />
                    <ToggleRow
                        icon="document-text-outline"
                        label="Literature Submissions"
                        subtitle="Email alerts for new submissions"
                        value={literatureSubmissions}
                        onValueChange={handleToggleLiterature}
                    />
                </View>

                {/* Security Settings */}
                <SectionLabel title="Security Settings" />
                <View style={styles.card}>
                    <ToggleRow
                        icon="finger-print-outline"
                        label="Two-Factor Authentication"
                        subtitle="Require pin after login"
                        value={appLockEnabled}
                        onValueChange={() => navigation.navigate('AppLockSetup')}
                    />
                    <View style={styles.divider} />
                    <NavRow
                        icon="people-outline"
                        label="Users"
                        subtitle="Manage all registered users"
                        onPress={() => navigation.navigate('ManageUsers' as any)}
                    />
                    <View style={styles.divider} />
                    <NavRow
                        icon="clipboard-outline"
                        label="Audit"
                        subtitle="Track all administrative actions"
                        onPress={() => navigation.navigate('AdminAudit' as any)}
                    />
                </View>

                {/* System Limits */}
                <SectionLabel title="System Limits" />
                <View style={styles.limitsCard}>
                    <Stepper
                        label="Max Upload Size (MB)"
                        value={maxUpload}
                        onChange={setMaxUpload}
                    />
                    <View style={styles.limitsDivider} />
                    <Stepper
                        label="Daily Download Limit per User"
                        value={dailyDownload}
                        onChange={setDailyDownload}
                    />
                    <TouchableOpacity
                        style={styles.saveBtn}
                        activeOpacity={0.85}
                        onPress={() => Alert.alert('Saved', 'System limits have been updated.')}
                    >
                        <Text style={styles.saveBtnText}>Save Limits</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

/* ---------------------------------------------------------------------- */
/* Styles                                                                   */
/* ---------------------------------------------------------------------- */

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },

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

    scroll: { padding: scale(16), paddingBottom: vs(110), gap: vs(10) },

    /* Profile card */
    profileCard: {
        backgroundColor: '#0E1F43', borderRadius: ms(16),
        padding: scale(16), flexDirection: 'row', alignItems: 'center', gap: scale(14),
        marginBottom: vs(4),
    },
    profileAvatar: {
        width: scale(52), height: vs(52), borderRadius: ms(26),
        backgroundColor: '#E97C3A',
        justifyContent: 'center', alignItems: 'center',
    },
    profileAvatarText: { color: '#fff', fontWeight: '800', fontSize: ms(18) },
    editBadge: {
        position: 'absolute', bottom: 0, right: 0,
        width: scale(18), height: vs(18), borderRadius: ms(9),
        backgroundColor: '#0E1F43', borderWidth: 1.5, borderColor: '#fff',
        justifyContent: 'center', alignItems: 'center',
    },
    profileName: { fontSize: ms(15), fontWeight: '800', color: '#fff' },
    profileEmail: { fontSize: ms(12), color: 'rgba(255,255,255,0.55)', marginTop: vs(2) },

    /* Section label */
    sectionLabel: {
        fontSize: ms(12), fontWeight: '700', color: '#0E1F43',
        letterSpacing: 0.3, paddingHorizontal: scale(4), marginTop: vs(4),
    },

    /* Card */
    card: {
        backgroundColor: '#fff', borderRadius: ms(14),
        borderWidth: 1, borderColor: '#F0F2F8',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
        overflow: 'hidden',
    },
    divider: { height: vs(1), backgroundColor: '#F5F6FA', marginLeft: scale(56) },

    /* Row */
    row: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: scale(14), paddingVertical: vs(13), gap: scale(12),
    },
    rowIconBox: {
        width: scale(32), height: vs(32), borderRadius: ms(8),
        backgroundColor: '#F0F2F8',
        justifyContent: 'center', alignItems: 'center',
    },
    rowBody: { flex: 1 },
    rowLabel: { fontSize: ms(13), fontWeight: '700', color: '#0E1F43' },
    rowSub: { fontSize: ms(11), color: '#9AADCA', marginTop: vs(1) },

    /* System Limits card */
    limitsCard: {
        backgroundColor: '#fff', borderRadius: ms(14),
        borderWidth: 1, borderColor: '#F0F2F8',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
        overflow: 'hidden',
        padding: scale(16), gap: vs(12),
    },
    limitsDivider: { height: vs(1), backgroundColor: '#F5F6FA' },
    stepperBlock: { gap: vs(6) },
    stepperLabel: { fontSize: ms(12), fontWeight: '600', color: '#0E1F43' },
    stepperRow: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: '#E0E5F0', borderRadius: ms(8),
        overflow: 'hidden',
    },
    stepperInput: {
        flex: 1, paddingHorizontal: scale(12), paddingVertical: vs(10),
        fontSize: ms(14), color: '#0E1F43', fontWeight: '600',
    },
    stepperBtns: {
        borderLeftWidth: 1, borderLeftColor: '#E0E5F0',
        width: scale(36),
    },
    stepperBtn: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        paddingVertical: vs(4),
    },
    stepperBtnDivider: { height: vs(1), backgroundColor: '#E0E5F0' },

    /* Save button */
    saveBtn: {
        backgroundColor: '#0E1F43', borderRadius: ms(12),
        paddingVertical: vs(14), alignItems: 'center', marginTop: vs(4),
    },
    saveBtnText: { color: '#fff', fontSize: ms(14), fontWeight: '800' },
});

export default AdminSettingsScreen;
