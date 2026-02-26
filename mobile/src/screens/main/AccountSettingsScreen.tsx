import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Switch, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { scale, vs, ms } from '../../utils/responsive';

const AccountSettingsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user, logout } = useAuth();
    const [emailNotif, setEmailNotif] = useState(false);
    const [researchUpdates, setResearchUpdates] = useState(false);

    const initials = user?.displayName
        ? user.displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    const RowItem = ({
        icon, label, subtitle, onPress, right,
    }: {
        icon: string; label: string; subtitle?: string;
        onPress?: () => void; right?: React.ReactNode;
    }) => (
        <TouchableOpacity
            style={styles.row}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={styles.rowIconBox}>
                <Ionicons name={icon as any} size={18} color="#0E1F43" />
            </View>
            <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>{label}</Text>
                {subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
            </View>
            {right ?? <Ionicons name="chevron-forward" size={16} color="#C0CDE8" />}
        </TouchableOpacity>
    );

    const SectionLabel = ({ title }: { title: string }) => (
        <Text style={styles.sectionLabel}>{title}</Text>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />

            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <Ionicons name="chevron-back" size={20} color="#0E1F43" />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>Account Settings</Text>
                <View style={{ width: 36 }} />
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
                        <Text style={styles.profileName}>{user?.displayName ?? 'Student'}</Text>
                        <Text style={styles.profileEmail} numberOfLines={1}>{user?.email ?? ''}</Text>
                    </View>
                </View>

                {/* Account */}
                <View style={styles.card}>
                    <RowItem icon="person-circle-outline" label="My Account" subtitle="Make changes to your account" onPress={() => navigation.navigate('MyAccount')} />
                    <View style={styles.divider} />
                    <RowItem icon="shield-checkmark-outline" label="Change password" subtitle="Further secure your account for safety" onPress={() => navigation.navigate('ChangePassword')} />
                </View>

                {/* Notification Preferences */}
                <SectionLabel title="NOTIFICATION PREFERENCES" />
                <View style={styles.card}>
                    <RowItem
                        icon="mail-outline"
                        label="Email Notification"
                        subtitle="Receive email alerts for important updates"
                        right={
                            <Switch
                                value={emailNotif}
                                onValueChange={setEmailNotif}
                                trackColor={{ false: '#D0D8E8', true: '#0E1F43' }}
                                thumbColor="#fff"
                                ios_backgroundColor="#D0D8E8"
                            />
                        }
                    />
                    <View style={styles.divider} />
                    <RowItem
                        icon="book-outline"
                        label="Research Updates"
                        subtitle="Notify me about new research in my field"
                        right={
                            <Switch
                                value={researchUpdates}
                                onValueChange={setResearchUpdates}
                                trackColor={{ false: '#D0D8E8', true: '#0E1F43' }}
                                thumbColor="#fff"
                                ios_backgroundColor="#D0D8E8"
                            />
                        }
                    />
                </View>

                {/* Library */}
                <SectionLabel title="LIBRARY" />
                <View style={styles.card}>
                    <RowItem icon="download-outline" label="Downloads" onPress={() => navigation.navigate('Downloads')} />
                    <View style={styles.divider} />
                    <RowItem icon="bookmark-outline" label="Bookmarks" onPress={() => navigation.getParent()?.navigate('Library', { initialTab: 'saved' })} />
                </View>

                {/* Legal */}
                <SectionLabel title="LEGAL POLICIES" />
                <View style={styles.card}>
                    <RowItem icon="lock-closed-outline" label="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} />
                    <View style={styles.divider} />
                    <RowItem icon="document-text-outline" label="Terms of Service" onPress={() => navigation.navigate('TermsOfUse')} />
                </View>

                {/* Sign out */}
                <TouchableOpacity
                    style={styles.signOutBtn}
                    onPress={logout}
                    activeOpacity={0.8}
                >
                    <Ionicons name="log-out-outline" size={18} color="#E53935" />
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

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

    // Profile card
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

    // Section label
    sectionLabel: {
        fontSize: ms(11), fontWeight: '700', color: '#9AADCA',
        letterSpacing: 0.8, paddingHorizontal: scale(4), marginTop: vs(4),
    },

    // Card
    card: {
        backgroundColor: '#fff', borderRadius: ms(14),
        borderWidth: 1, borderColor: '#F0F2F8',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
        overflow: 'hidden',
    },
    divider: { height: vs(1), backgroundColor: '#F5F6FA', marginLeft: scale(56) },

    // Row
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

    // Sign out
    signOutBtn: {
        marginTop: vs(6),
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(8),
        height: vs(50), borderRadius: ms(14),
        borderWidth: 1.5, borderColor: '#FFCDD2',
        backgroundColor: '#fff',
    },
    signOutText: { fontSize: ms(14), fontWeight: '800', color: '#E53935' },
});

export default AccountSettingsScreen;
