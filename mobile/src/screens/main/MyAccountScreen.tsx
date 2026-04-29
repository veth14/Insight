import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, StatusBar, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api.service';
import { scale, vs, ms } from '../../utils/responsive';

// ── Display maps ───────────────────────────────────────────────────────────────

const PROGRAM_LABELS: Record<string, string> = {
    BSIT: 'Bachelor of Science in Information Technology',
};

const YEAR_LABELS: Record<number, string> = {
    1: '1st Year',
    2: '2nd Year',
    3: '3rd Year',
    4: '4th Year',
    5: '5th Year',
};

// ── Field helpers ────────────────────────────────────────────────────────

const EditableField = ({
    label, value, onChangeText, keyboardType = 'default', left, maxLength,
}: {
    label: string; value: string; onChangeText: (t: string) => void;
    keyboardType?: any; left?: React.ReactNode; maxLength?: number;
}) => (
    <View style={styles.inputBox}>
        {left}
        <TextInput
            style={[styles.input, !!left && { paddingLeft: 6 }]}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            placeholderTextColor="#9AADCA"
            placeholder={label}
            maxLength={maxLength}
        />
    </View>
);

const ReadOnlyField = ({ value, left }: { value: string; left?: React.ReactNode }) => (
    <View style={styles.inputBox}>
        {left}
        <View style={styles.readOnlyInner}>
            <Text style={styles.readOnlyText} numberOfLines={2}>{value}</Text>
            <Ionicons name="lock-closed-outline" size={14} color="#C8D3E6" style={{ marginLeft: 6 }} />
        </View>
    </View>
);

// ── Screen ─────────────────────────────────────────────────────────────────────

const MyAccountScreen: React.FC = () => {
    const navigation = useNavigation();
    const { user, refreshUser } = useAuth();

    const initials = user?.displayName
        ? user.displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    // Editable fields
    const [phone, setPhone] = useState(user?.phoneNumber ?? '');

    const handlePhoneChange = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        if (cleaned.length <= 11) {
            setPhone(cleaned);
        }
    };

    // Read-only values derived from user
    const studentNo = user?.studentNumber ?? '—';
    const yearDisplay = user?.yearLevel ? (YEAR_LABELS[user.yearLevel] ?? `Year ${user.yearLevel}`) : '—';
    const programDisplay = user?.program ? (PROGRAM_LABELS[user.program] ?? user.program) : '—';

    const [saving, setSaving] = useState(false);

    const handleUpdate = async () => {
        try {
            setSaving(true);
            await api.put('/auth/me', {
                displayName: user?.displayName,
                phoneNumber: phone.trim(),
            });
            await refreshUser();
            Alert.alert('Success', 'Phone number updated successfully.');
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.message ?? 'Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />

            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <Ionicons name="chevron-back" size={20} color="#0E1F43" />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>My Account</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <Text style={styles.avatarName}>{user?.displayName || 'Student'}</Text>
                    <Text style={styles.avatarEmail}>{user?.email ?? ''}</Text>
                </View>

                {/* Editable section */}
                <View style={styles.sectionLabel}>
                    <Text style={styles.sectionLabelText}>EDITABLE INFORMATION</Text>
                </View>
                <View style={styles.formCard}>
                    {/* Phone only */}
                    <EditableField
                        label="Phone number"
                        value={phone}
                        onChangeText={handlePhoneChange}
                        keyboardType="phone-pad"
                        maxLength={11}
                        left={
                            <View style={styles.flagBox}>
                                <Text style={styles.flagEmoji}>🇵🇭</Text>
                            </View>
                        }
                    />
                </View>

                {/* Read-only section */}
                <View style={styles.sectionLabel}>
                    <Text style={styles.sectionLabelText}>ACCOUNT DETAILS  •  CANNOT BE CHANGED</Text>
                </View>
                <View style={styles.formCard}>
                    {/* Full name */}
                    <ReadOnlyField value={user?.displayName ?? '—'} />
                    <View style={styles.fieldDivider} />

                    {/* Email */}
                    <ReadOnlyField value={user?.email ?? '—'} />
                    <View style={styles.fieldDivider} />

                    {/* Student number */}
                    <ReadOnlyField value={studentNo} />
                    <View style={styles.fieldDivider} />

                    {/* Year level */}
                    <ReadOnlyField value={yearDisplay} />
                    <View style={styles.fieldDivider} />

                    {/* Program */}
                    <ReadOnlyField value={programDisplay} />
                </View>

                {/* Update button */}
                <TouchableOpacity
                    style={[styles.updateBtn, saving && { opacity: 0.7 }]}
                    activeOpacity={0.8}
                    onPress={handleUpdate}
                    disabled={saving}
                >
                    {saving
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.updateBtnText}>Update Profile</Text>
                    }
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

    scroll: { padding: scale(16), paddingBottom: vs(110), gap: vs(12) },

    // Avatar
    avatarSection: { alignItems: 'center', gap: vs(4), paddingVertical: vs(8) },
    avatarCircle: {
        width: scale(84), height: vs(84), borderRadius: ms(42),
        backgroundColor: '#E97C3A',
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { fontSize: ms(28), fontWeight: '800', color: '#fff' },
    avatarName: { fontSize: ms(17), fontWeight: '800', color: '#0E1F43', marginTop: vs(6) },
    avatarEmail: { fontSize: ms(12), color: '#9AADCA' },

    // Section label
    sectionLabel: { paddingHorizontal: scale(4), paddingTop: vs(4) },
    sectionLabelText: { fontSize: ms(10), fontWeight: '700', color: '#9AADCA', letterSpacing: 0.8 },

    // Form card
    formCard: {
        backgroundColor: '#fff', borderRadius: ms(16),
        borderWidth: 1, borderColor: '#F0F2F8',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
        overflow: 'hidden',
    },
    fieldDivider: { height: vs(1), backgroundColor: '#F5F6FA', marginHorizontal: scale(14) },

    inputBox: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: scale(14), minHeight: vs(50),
    },
    input: {
        flex: 1, fontSize: ms(14), color: '#0E1F43',
        paddingVertical: Platform.OS === 'ios' ? vs(13) : vs(10),
    },

    // Read-only row
    readOnlyInner: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: Platform.OS === 'ios' ? vs(13) : vs(10),
    },
    readOnlyText: { fontSize: ms(14), color: '#9AADCA', flex: 1 },

    flagBox: { marginRight: scale(6), justifyContent: 'center' },
    flagEmoji: { fontSize: ms(18) },

    // Update button
    updateBtn: {
        height: vs(52), borderRadius: ms(14),
        backgroundColor: '#0E1F43',
        justifyContent: 'center', alignItems: 'center',
        marginTop: vs(4),
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
    },
    updateBtnText: { color: '#fff', fontSize: ms(15), fontWeight: '800', letterSpacing: 0.3 },
});

export default MyAccountScreen;
