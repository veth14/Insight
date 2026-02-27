import React, { useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { scale, vs, ms } from '../../utils/responsive';
import { useAuth } from '../../contexts/AuthContext';

const POLL_INTERVAL_MS = 30_000; // re-check approval every 30 s

const UploadLockedScreen: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const isRejected = user?.registrationStatus === 'rejected';
    const [checking, setChecking] = React.useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useFocusEffect(
        useCallback(() => {
            // Immediately refresh on focus
            const check = async () => {
                try {
                    setChecking(true);
                    await refreshUser();
                } catch (_) {
                    // silently ignore — user stays on this screen
                } finally {
                    setChecking(false);
                }
            };
            check();

            // Then poll every 30 s so the student doesn't have to do anything
            intervalRef.current = setInterval(check, POLL_INTERVAL_MS);

            return () => {
                if (intervalRef.current) clearInterval(intervalRef.current);
            };
        }, [refreshUser]),
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />

            <View style={styles.inner}>
                {/* Icon */}
                <View style={[styles.iconCircle, isRejected && styles.iconCircleRejected]}>
                    <Ionicons
                        name={isRejected ? 'close-circle-outline' : 'lock-closed-outline'}
                        size={ms(40)}
                        color={isRejected ? '#DC2626' : '#F59E0B'}
                    />
                </View>

                {/* Title */}
                <Text style={styles.title}>
                    {isRejected ? 'Access Rejected' : 'Upload Not Yet Available'}
                </Text>

                {/* Description */}
                <Text style={styles.description}>
                    {isRejected
                        ? 'Your Student Registration Form was not approved by the administrator. You cannot upload at this time.'
                        : 'Your account is pending admin approval. Once your Student Registration Form is reviewed and approved, you will be able to upload your research here.'}
                </Text>

                {/* Status chip */}
                <View style={[styles.chip, isRejected ? styles.chipRejected : styles.chipPending]}>
                    <View style={[styles.dot, isRejected ? styles.dotRejected : styles.dotPending]} />
                    <Text style={[styles.chipText, isRejected ? styles.chipTextRejected : styles.chipTextPending]}>
                        {isRejected ? 'Registration Rejected' : 'Pending Approval'}
                    </Text>
                </View>

                {/* Info box */}
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={ms(16)} color="#5B8DEF" />
                    <Text style={styles.infoText}>
                        {isRejected
                            ? 'Please contact your administrator for further instructions.'
                            : 'You can still browse, search, and save research papers while you wait.'}
                    </Text>
                </View>

                {/* Check status button */}
                {!isRejected && (
                    <TouchableOpacity
                        style={[styles.checkBtn, checking && styles.checkBtnDisabled]}
                        onPress={async () => {
                            try {
                                setChecking(true);
                                await refreshUser();
                            } catch (_) {}
                            finally { setChecking(false); }
                        }}
                        disabled={checking}
                        activeOpacity={0.75}
                    >
                        {checking
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Ionicons name="refresh-outline" size={ms(16)} color="#fff" />
                        }
                        <Text style={styles.checkBtnText}>
                            {checking ? 'Checking…' : 'Check Approval Status'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    inner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: scale(32),
        gap: vs(16),
    },

    iconCircle: {
        width: scale(88),
        height: scale(88),
        borderRadius: ms(44),
        backgroundColor: '#FFFBEB',
        borderWidth: 2,
        borderColor: '#FDE68A',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(4),
    },
    iconCircleRejected: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA',
    },

    title: {
        fontSize: ms(20),
        fontWeight: '800',
        color: '#0E1F43',
        textAlign: 'center',
    },
    description: {
        fontSize: ms(13),
        color: '#9AADCA',
        textAlign: 'center',
        lineHeight: ms(20),
    },

    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(6),
        paddingHorizontal: scale(16),
        paddingVertical: vs(7),
        borderRadius: ms(20),
    },
    chipPending: { backgroundColor: '#FFFBEB' },
    chipRejected: { backgroundColor: '#FEF2F2' },
    dot: { width: scale(7), height: scale(7), borderRadius: ms(4) },
    dotPending: { backgroundColor: '#F59E0B' },
    dotRejected: { backgroundColor: '#DC2626' },
    chipText: { fontSize: ms(12), fontWeight: '700' },
    chipTextPending: { color: '#B45309' },
    chipTextRejected: { color: '#DC2626' },

    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: scale(8),
        backgroundColor: '#EEF4FF',
        borderRadius: ms(12),
        paddingHorizontal: scale(14),
        paddingVertical: vs(12),
        borderWidth: 1,
        borderColor: '#DBEAFE',
        marginTop: vs(4),
    },
    infoText: {
        flex: 1,
        fontSize: ms(12),
        color: '#3B5A9E',
        lineHeight: ms(18),
    },
    checkBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(8),
        backgroundColor: '#0E1F43',
        paddingHorizontal: scale(24),
        paddingVertical: vs(12),
        borderRadius: ms(12),
        marginTop: vs(4),
    },
    checkBtnDisabled: { opacity: 0.6 },
    checkBtnText: {
        color: '#fff',
        fontSize: ms(13),
        fontWeight: '700',
    },
});

export default UploadLockedScreen;
