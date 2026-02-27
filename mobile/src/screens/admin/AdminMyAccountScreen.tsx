import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { scale, vs, ms } from '../../utils/responsive';

const AdminMyAccountScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();

    const initials = user?.displayName
        ? user.displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
        : 'A';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#ECEEF8" />

            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <Ionicons name="chevron-back" size={20} color="#0E1F43" />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>My Account</Text>
                <View style={{ width: scale(36) }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
            >
                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <Text style={styles.avatarName}>{user?.displayName ?? 'Admin'}</Text>
                    <Text style={styles.avatarEmail}>{user?.email ?? ''}</Text>
                </View>

                {/* Read-only fields */}
                <View style={styles.formCard}>
                    <View style={styles.readOnlyRow}>
                        <Text style={styles.readOnlyText}>{user?.displayName ?? '—'}</Text>
                    </View>
                    <View style={styles.fieldDivider} />
                    <View style={styles.readOnlyRow}>
                        <Text style={styles.readOnlyText}>{user?.email ?? '—'}</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ECEEF8' },

    topBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: scale(16), paddingVertical: vs(10), backgroundColor: '#ECEEF8',
    },
    backBtn: {
        width: scale(36), height: vs(36), borderRadius: ms(10),
        backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#E0E5F0',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
    },
    topBarTitle: { fontSize: ms(16), fontWeight: '800', color: '#0E1F43' },

    scroll: {
        padding: scale(16), paddingBottom: vs(110),
        alignItems: 'center', gap: vs(20),
    },

    /* Avatar */
    avatarSection: { alignItems: 'center', paddingTop: vs(12), gap: vs(6) },
    avatarCircle: {
        width: scale(80), height: scale(80), borderRadius: scale(40),
        backgroundColor: '#E97C3A',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: vs(4),
    },
    avatarText: { color: '#fff', fontWeight: '800', fontSize: ms(28) },
    avatarName: { fontSize: ms(16), fontWeight: '800', color: '#0E1F43' },
    avatarEmail: { fontSize: ms(12), color: '#9AADCA' },

    /* Form card */
    formCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: ms(14),
        borderWidth: 1, borderColor: '#F0F2F8',
        overflow: 'hidden',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    readOnlyRow: {
        paddingHorizontal: scale(16), paddingVertical: vs(14),
    },
    readOnlyText: {
        fontSize: ms(13), color: '#0E1F43',
    },
    fieldDivider: { height: vs(1), backgroundColor: '#F0F2F8' },
});

export default AdminMyAccountScreen;
