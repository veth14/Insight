import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, StatusBar, Platform, Alert, ActivityIndicator,
    Modal, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
} from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api.service';
import { auth } from '../../config/firebase';
import { scale, vs, ms } from '../../utils/responsive';
import { usePreventScreenCapture } from 'expo-screen-capture';

// ── PasswordRow (defined outside screen to avoid remount on every keystroke) ───

type PasswordFieldProps = {
    label: string;
    value: string;
    onChange: (v: string) => void;
    visible: boolean;
    onToggle: () => void;
};

const PasswordRow: React.FC<PasswordFieldProps> = ({ label, value, onChange, visible, onToggle }) => (
    <View style={styles.inputWrapper}>
        <TextInput
            style={styles.textInput}
            placeholder={label}
            placeholderTextColor="#B0BDD6"
            value={value}
            onChangeText={onChange}
            secureTextEntry={!visible}
            autoCapitalize="none"
            autoCorrect={false}
        />
        <TouchableOpacity onPress={onToggle} style={styles.eyeBtn} activeOpacity={0.7}>
            <Ionicons name={visible ? 'eye-outline' : 'eye-off-outline'} size={18} color="#B0BDD6" />
        </TouchableOpacity>
    </View>
);

// ── Screen ─────────────────────────────────────────────────────────────────────

const ChangePasswordScreen: React.FC = () => {
    const navigation = useNavigation();
    const { user, sendResetOTP, verifyResetOTP, resetPassword } = useAuth();
    const insets = useSafeAreaInsets();

    usePreventScreenCapture();

    // ── Form state ───────────────────────────────────────────────────────────
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [sending, setSending] = useState(false);

    // ── OTP modal state ──────────────────────────────────────────────────────
    const [otpVisible, setOtpVisible] = useState(false);
    const [digits, setDigits] = useState(['', '', '', '']);
    const [otpError, setOtpError] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);

    // ── Forgot-password flow state ────────────────────────────────────────────
    const [forgotStep, setForgotStep] = useState<'none' | 'otp' | 'newpass'>('none');
    const [forgotSending, setForgotSending] = useState(false);
    const [forgotDigits, setForgotDigits] = useState(['', '', '', '', '', '']);
    const [forgotToken, setForgotToken] = useState('');
    const [forgotNewPass, setForgotNewPass] = useState('');
    const [forgotConfirmPass, setForgotConfirmPass] = useState('');
    const [showForgotNew, setShowForgotNew] = useState(false);
    const [showForgotConfirm, setShowForgotConfirm] = useState(false);
    const [resettingPassword, setResettingPassword] = useState(false);

    const refs = [
        useRef<TextInput>(null),
        useRef<TextInput>(null),
        useRef<TextInput>(null),
        useRef<TextInput>(null),
    ];

    const forgotRefs = [
        useRef<TextInput>(null),
        useRef<TextInput>(null),
        useRef<TextInput>(null),
        useRef<TextInput>(null),
        useRef<TextInput>(null),
        useRef<TextInput>(null),
    ];

    // ── Validation ───────────────────────────────────────────────────────────
    const validate = (): string | null => {
        if (!currentPassword || !newPassword || !confirmPassword)
            return 'All fields are required.';
        if (newPassword.length < 6)
            return 'New password must be at least 6 characters.';
        if (!/[a-zA-Z]/.test(newPassword) || !/[0-9!@#$%^&*]/.test(newPassword))
            return 'New password must include letters and numbers or special characters (!$@%).';
        if (newPassword !== confirmPassword)
            return 'Passwords do not match.';
        if (newPassword === currentPassword)
            return 'New password must be different from current password.';
        return null;
    };

    // ── Send OTP ─────────────────────────────────────────────────────────────
    const handleSendOTP = async () => {
        const err = validate();
        if (err) { Alert.alert('Validation', err); return; }

        try {
            setSending(true);
            const token = await auth.currentUser?.getIdToken();
            await api.post(
                '/auth/send-otp',
                { email: user?.email },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            setDigits(['', '', '', '']);
            setOtpError('');
            setOtpVisible(true);
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message ?? 'Failed to send OTP. Please try again.');
        } finally {
            setSending(false);
        }
    };

    // ── Resend OTP ───────────────────────────────────────────────────────────
    const handleResend = async () => {
        try {
            setResending(true);
            const token = await auth.currentUser?.getIdToken();
            await api.post(
                '/auth/send-otp',
                { email: user?.email },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            setDigits(['', '', '', '']);
            setOtpError('');
        } catch (e: any) {
            setOtpError(e?.response?.data?.message ?? 'Failed to resend. Try again.');
        } finally {
            setResending(false);
        }
    };

    // ── Verify OTP + update password ─────────────────────────────────────────
    const handleVerify = async () => {
        const code = digits.join('');
        if (code.length < 4) { setOtpError('Please enter the 4-digit code.'); return; }

        try {
            setVerifying(true);
            setOtpError('');
            const token = await auth.currentUser?.getIdToken();

            // 1. Verify OTP with backend
            await api.post(
                '/auth/verify-otp',
                { email: user?.email, otp: code },
                { headers: { Authorization: `Bearer ${token}` } },
            );

            // 2. Re-authenticate Firebase user with current password
            const credential = EmailAuthProvider.credential(user!.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser!, credential);

            // 3. Update password in Firebase
            await updatePassword(auth.currentUser!, newPassword);

            setOtpVisible(false);
            Alert.alert('Password Changed', 'Your password has been updated successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (e: any) {
            // Firebase re-auth errors
            if (
                e?.code === 'auth/wrong-password' ||
                e?.code === 'auth/invalid-credential'
            ) {
                setOtpVisible(false);
                Alert.alert('Incorrect Password', 'The current password you entered is wrong. Please try again.');
            } else {
                // Backend OTP error
                setOtpError(e?.response?.data?.message ?? 'Invalid or expired code. Please try again.');
            }
        } finally {
            setVerifying(false);
        }
    };

    // ── Forgot-password handlers ──────────────────────────────────────────────
    const handleForgotPassword = async () => {
        if (!user?.email) return;
        try {
            setForgotSending(true);
            await sendResetOTP(user.email);
            setForgotDigits(['', '', '', '', '', '']);
            setForgotNewPass('');
            setForgotConfirmPass('');
            setOtpError('');
            setForgotStep('otp');
            setOtpVisible(true);
        } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message ?? 'Failed to send reset code. Please try again.');
        } finally {
            setForgotSending(false);
        }
    };

    const handleForgotVerify = async () => {
        const code = forgotDigits.join('');
        if (code.length < 6) { setOtpError('Please enter the 6-digit code.'); return; }
        try {
            setVerifying(true);
            setOtpError('');
            const token = await verifyResetOTP(user!.email, code);
            setForgotToken(token);
            setForgotStep('newpass');
        } catch (e: any) {
            setOtpError(e?.response?.data?.message ?? 'Invalid or expired code. Please try again.');
        } finally {
            setVerifying(false);
        }
    };

    const handleForgotResetPassword = async () => {
        if (!forgotNewPass || forgotNewPass.length < 6) {
            setOtpError('Password must be at least 6 characters.');
            return;
        }
        if (!/[a-zA-Z]/.test(forgotNewPass) || !/[0-9!@#$%^&*]/.test(forgotNewPass)) {
            setOtpError('Must include letters and numbers or special characters (!$@%).');
            return;
        }
        if (forgotNewPass !== forgotConfirmPass) {
            setOtpError('Passwords do not match.');
            return;
        }
        try {
            setResettingPassword(true);
            setOtpError('');
            await resetPassword(user!.email, forgotToken, forgotNewPass);
            setOtpVisible(false);
            setForgotStep('none');
            Alert.alert('Password Reset', 'Your password has been reset successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (e: any) {
            if (e?.response?.data?.code === 'TOKEN_EXPIRED' || e?.response?.data?.code === 'INVALID_TOKEN') {
                setOtpError('Reset session expired. Please start over.');
                setForgotStep('otp');
            } else {
                setOtpError(e?.response?.data?.message ?? 'Failed to reset password.');
            }
        } finally {
            setResettingPassword(false);
        }
    };

    const handleForgotDigitChange = (val: string, idx: number) => {
        const updated = [...forgotDigits];
        updated[idx] = val.replace(/[^0-9]/g, '').slice(-1);
        setForgotDigits(updated);
        if (updated[idx] && idx < 5) forgotRefs[idx + 1].current?.focus();
    };

    const handleForgotKeyPress = (e: any, idx: number) => {
        if (e.nativeEvent.key === 'Backspace' && !forgotDigits[idx] && idx > 0) {
            forgotRefs[idx - 1].current?.focus();
        }
    };

    // ── Digit input helpers ──────────────────────────────────────────────────
    const handleDigitChange = (val: string, idx: number) => {
        const updated = [...digits];
        updated[idx] = val.replace(/[^0-9]/g, '').slice(-1);
        setDigits(updated);
        if (updated[idx] && idx < 3) refs[idx + 1].current?.focus();
    };

    const handleKeyPress = (e: any, idx: number) => {
        if (e.nativeEvent.key === 'Backspace' && !digits[idx] && idx > 0) {
            refs[idx - 1].current?.focus();
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
                <Text style={styles.topBarTitle}>Change Password</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
            >
                {/* Hint */}
                <View style={styles.hintBox}>
                    <Text style={styles.hintText}>
                        Your password must be at least 6 characters and should include a combination
                        of numbers, letters and special characters (!$@%).
                    </Text>
                </View>

                {/* Fields card */}
                <View style={styles.card}>
                    <PasswordRow
                        label="Current Password"
                        value={currentPassword}
                        onChange={setCurrentPassword}
                        visible={showCurrent}
                        onToggle={() => setShowCurrent(v => !v)}
                    />
                    <View style={styles.divider} />
                    <PasswordRow
                        label="New password"
                        value={newPassword}
                        onChange={setNewPassword}
                        visible={showNew}
                        onToggle={() => setShowNew(v => !v)}
                    />
                    <View style={styles.divider} />
                    <PasswordRow
                        label="Re-type new password"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        visible={showConfirm}
                        onToggle={() => setShowConfirm(v => !v)}
                    />
                </View>

                {/* Forgot link */}
                <TouchableOpacity
                    style={styles.forgotRow}
                    activeOpacity={0.7}
                    onPress={handleForgotPassword}
                    disabled={forgotSending}
                >
                    {forgotSending
                        ? <ActivityIndicator size="small" color="#0E1F43" />
                        : <Text style={styles.forgotText}>Forgot your password?</Text>
                    }
                </TouchableOpacity>

                {/* Change Password button */}
                <TouchableOpacity
                    style={[styles.submitBtn, sending && { opacity: 0.7 }]}
                    activeOpacity={0.8}
                    onPress={handleSendOTP}
                    disabled={sending}
                >
                    {sending
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.submitBtnText}>Change Password</Text>
                    }
                </TouchableOpacity>
            </ScrollView>

            {/* ── OTP Modal ─────────────────────────────────────────────── */}
            <Modal
                visible={otpVisible}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => { setOtpVisible(false); setForgotStep('none'); }}
            >
                {/* This View fills the ENTIRE modal window — covers tab bar guaranteed */}
                <View style={styles.modalBackdrop}>
                    <KeyboardAvoidingView
                        style={styles.modalOverlay}
                        behavior="padding"
                        keyboardVerticalOffset={0}
                    >
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => { setOtpVisible(false); setForgotStep('none'); }}
                    />

                        <View style={styles.modalSheet}>

                        {forgotStep === 'newpass' ? (
                            /* ── Set new password step ─── */
                            <>
                                <View style={styles.modalIconBox}>
                                    <Ionicons name="key-outline" size={28} color="#0E1F43" />
                                </View>
                                <Text style={styles.modalTitle}>Set New Password</Text>
                                <Text style={styles.modalSub}>
                                    Create a new password for{'\n'}
                                    <Text style={styles.modalEmail}>{user?.email}</Text>
                                </Text>

                                <View style={styles.modalInputWrapper}>
                                    <TextInput
                                        style={styles.modalInputField}
                                        placeholder="New password"
                                        placeholderTextColor="#B0BDD6"
                                        value={forgotNewPass}
                                        onChangeText={v => { setForgotNewPass(v); setOtpError(''); }}
                                        secureTextEntry={!showForgotNew}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <TouchableOpacity onPress={() => setShowForgotNew(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                        <Ionicons name={showForgotNew ? 'eye-outline' : 'eye-off-outline'} size={18} color="#B0BDD6" />
                                    </TouchableOpacity>
                                </View>

                                <View style={[styles.modalInputWrapper, { marginTop: vs(10) }]}>
                                    <TextInput
                                        style={styles.modalInputField}
                                        placeholder="Confirm new password"
                                        placeholderTextColor="#B0BDD6"
                                        value={forgotConfirmPass}
                                        onChangeText={v => { setForgotConfirmPass(v); setOtpError(''); }}
                                        secureTextEntry={!showForgotConfirm}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <TouchableOpacity onPress={() => setShowForgotConfirm(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                        <Ionicons name={showForgotConfirm ? 'eye-outline' : 'eye-off-outline'} size={18} color="#B0BDD6" />
                                    </TouchableOpacity>
                                </View>

                                {!!otpError && <Text style={styles.otpErrorText}>{otpError}</Text>}

                                <TouchableOpacity
                                    style={[styles.confirmBtn, { marginTop: vs(16) }, resettingPassword && { opacity: 0.7 }]}
                                    onPress={handleForgotResetPassword}
                                    disabled={resettingPassword}
                                    activeOpacity={0.8}
                                >
                                    {resettingPassword
                                        ? <ActivityIndicator color="#fff" />
                                        : <Text style={styles.confirmBtnText}>Save New Password</Text>
                                    }
                                </TouchableOpacity>
                            </>
                        ) : (
                            /* ── OTP entry step (change or forgot) ─── */
                            <>
                                <View style={styles.modalIconBox}>
                                    <Ionicons name={forgotStep === 'otp' ? 'mail-outline' : 'lock-closed'} size={28} color="#0E1F43" />
                                </View>
                                <Text style={styles.modalTitle}>
                                    {forgotStep === 'otp' ? 'Check your email' : 'Verify your identity'}
                                </Text>
                                <Text style={styles.modalSub}>
                                    A {forgotStep === 'otp' ? '6' : '4'}-digit code was sent to{'\n'}
                                    <Text style={styles.modalEmail}>{user?.email}</Text>
                                </Text>

                                {/* OTP boxes */}
                                <View style={styles.otpRow}>
                                    {(forgotStep === 'otp' ? forgotDigits : digits).map((d, i) => (
                                        <TextInput
                                            key={i}
                                            ref={forgotStep === 'otp' ? forgotRefs[i] : refs[i]}
                                            style={[
                                                styles.otpBox,
                                                forgotStep === 'otp' && styles.otpBoxSm,
                                                d ? styles.otpBoxFilled : undefined,
                                                otpError ? styles.otpBoxError : undefined,
                                            ]}
                                            value={d}
                                            onChangeText={val => forgotStep === 'otp'
                                                ? handleForgotDigitChange(val, i)
                                                : handleDigitChange(val, i)
                                            }
                                            onKeyPress={e => forgotStep === 'otp'
                                                ? handleForgotKeyPress(e, i)
                                                : handleKeyPress(e, i)
                                            }
                                            keyboardType="number-pad"
                                            maxLength={1}
                                            textAlign="center"
                                            selectionColor="#0E1F43"
                                        />
                                    ))}
                                </View>

                                {!!otpError && <Text style={styles.otpErrorText}>{otpError}</Text>}

                                <TouchableOpacity
                                    style={[styles.confirmBtn, verifying && { opacity: 0.7 }]}
                                    activeOpacity={0.8}
                                    onPress={forgotStep === 'otp' ? handleForgotVerify : handleVerify}
                                    disabled={verifying}
                                >
                                    {verifying
                                        ? <ActivityIndicator color="#fff" />
                                        : <Text style={styles.confirmBtnText}>Confirm</Text>
                                    }
                                </TouchableOpacity>

                                <View style={styles.resendRow}>
                                    <Text style={styles.resendLabel}>Didn't receive a code? </Text>
                                    <TouchableOpacity onPress={handleResend} disabled={resending} activeOpacity={0.7}>
                                        {resending
                                            ? <ActivityIndicator size="small" color="#E97C3A" />
                                            : <Text style={styles.resendLink}>Resend</Text>
                                        }
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

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

    scroll: { padding: scale(16), paddingBottom: vs(80), gap: vs(16) },

    hintBox: {
        backgroundColor: '#fff',
        borderRadius: ms(14),
        padding: scale(14),
        borderWidth: 1,
        borderColor: '#EEF1F8',
    },
    hintText: { fontSize: ms(12.5), color: '#7B8FAB', lineHeight: vs(19) },

    // Card
    card: {
        backgroundColor: '#fff', borderRadius: ms(16),
        borderWidth: 1, borderColor: '#F0F2F8',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, overflow: 'hidden',
    },
    divider: { height: vs(1), backgroundColor: '#F5F6FA', marginHorizontal: scale(14) },

    // Password input row
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: scale(14), minHeight: vs(52),
    },
    textInput: {
        flex: 1, fontSize: ms(14), color: '#0E1F43',
        paddingVertical: Platform.OS === 'ios' ? vs(13) : vs(10),
    },
    eyeBtn: { padding: scale(6) },

    // Forgot
    forgotRow: { alignSelf: 'flex-end' },
    forgotText: { fontSize: ms(13), fontWeight: '700', color: '#0E1F43' },

    // Submit button
    submitBtn: {
        height: vs(54), borderRadius: ms(16),
        backgroundColor: '#0E1F43',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
        marginTop: vs(8),
    },
    submitBtnText: { color: '#fff', fontSize: ms(15), fontWeight: '800', letterSpacing: 0.3 },

    // ── OTP Modal ─────────────────────────────────────────────────────────────
    // fills the full Modal window — tabs included
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: scale(20),
    },
    modalOverlay: {
        width: '100%',
    },
    modalSheet: {
        backgroundColor: '#fff',
        borderRadius: ms(24),
        paddingHorizontal: scale(24),
        paddingVertical: vs(24),
        alignItems: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 20,
    },
    modalHandle: {
        width: scale(40), height: vs(4), borderRadius: ms(2),
        backgroundColor: '#D0D8E8', marginBottom: vs(16),
    },
    modalIconBox: {
        width: scale(60), height: vs(60), borderRadius: ms(18),
        backgroundColor: '#EEF2FF',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: vs(16),
    },
    modalTitle: {
        fontSize: ms(18), fontWeight: '800', color: '#0E1F43',
        marginBottom: vs(8), textAlign: 'center',
    },
    modalSub: {
        fontSize: ms(13), color: '#7B8FAB', textAlign: 'center',
        lineHeight: vs(20), marginBottom: vs(28),
    },
    modalEmail: { fontWeight: '700', color: '#0E1F43' },

    // OTP boxes
    otpRow: { flexDirection: 'row', gap: scale(14), marginBottom: vs(10) },
    otpBox: {
        width: scale(58), height: vs(62), borderRadius: ms(14),
        borderWidth: 2, borderColor: '#E0E5F0',
        backgroundColor: '#F5F6FA',
        fontSize: ms(24), fontWeight: '800', color: '#0E1F43',
    },
    otpBoxFilled: { borderColor: '#0E1F43', backgroundColor: '#fff' },
    otpBoxError: { borderColor: '#E53E3E' },

    otpErrorText: {
        fontSize: ms(12), color: '#E53E3E',
        textAlign: 'center', marginBottom: vs(8), marginTop: vs(4),
    },

    // Confirm button
    confirmBtn: {
        width: '100%', height: vs(52), borderRadius: ms(14),
        backgroundColor: '#0E1F43',
        justifyContent: 'center', alignItems: 'center',
        marginTop: vs(12),
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
    },
    confirmBtnText: { color: '#fff', fontSize: ms(15), fontWeight: '800' },

    // Resend
    resendRow: {
        flexDirection: 'row', alignItems: 'center',
        marginTop: vs(16),
    },
    resendLabel: { fontSize: ms(13), color: '#9AADCA' },
    resendLink: { fontSize: ms(13), fontWeight: '700', color: '#E97C3A' },

    // Forgot-flow new password inputs inside modal
    modalInputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        width: '100%',
        backgroundColor: '#F5F6FA',
        borderRadius: ms(12),
        borderWidth: 1.5,
        borderColor: '#E0E5F0',
        paddingHorizontal: scale(14),
        height: vs(50),
    },
    modalInputField: {
        flex: 1, fontSize: ms(14), color: '#0E1F43',
    },
    // Smaller OTP box for 6-digit layout
    otpBoxSm: {
        width: scale(40),
        height: vs(48),
        fontSize: ms(20),
    },
});

export default ChangePasswordScreen;
