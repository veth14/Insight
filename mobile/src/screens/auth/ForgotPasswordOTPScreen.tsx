import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Animated,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { scale, vs, ms } from '../../utils/responsive';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPasswordOTP'>;
type RouteP = RouteProp<AuthStackParamList, 'ForgotPasswordOTP'>;
interface Props { navigation: Nav; route: RouteP; }

const BOX_SIZE = scale(44);
const RESEND_COOLDOWN = 5 * 60;

const ForgotPasswordOTPScreen: React.FC<Props> = ({ navigation, route }) => {
    const { email } = route.params;
    const { verifyResetOTP, sendResetOTP } = useAuth();

    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
    const [error, setError] = useState<string | null>(null);
    const [verified, setVerified] = useState(false);
    const [resetToken, setResetToken] = useState('');

    const inputRefs = useRef<(TextInput | null)[]>(Array(6).fill(null));
    const resendCooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const startCooldown = useCallback((secs: number) => {
        setResendCooldown(secs);
        if (resendCooldownRef.current) clearInterval(resendCooldownRef.current);
        resendCooldownRef.current = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) { clearInterval(resendCooldownRef.current!); return 0; }
                return prev - 1;
            });
        }, 1000);
    }, []);

    useEffect(() => {
        startCooldown(RESEND_COOLDOWN);
        setTimeout(() => inputRefs.current[0]?.focus(), 300);
        return () => { if (resendCooldownRef.current) clearInterval(resendCooldownRef.current); };
    }, []);

    const isExpired = resendCooldown === 0;
    const allFilled = otp.every(d => d !== '');

    const handleChange = (text: string, index: number) => {
        const digit = text.replace(/[^0-9]/g, '').slice(-1);
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);
        setError(null);
        if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace') {
            if (otp[index] === '' && index > 0) {
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
                inputRefs.current[index - 1]?.focus();
            } else {
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        }
    };

    const triggerShake = () => {
        shakeAnim.setValue(0);
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length < 6) { setError('Please enter all 6 digits.'); triggerShake(); return; }
        if (isExpired) { setError('Your code has expired. Please request a new one.'); triggerShake(); return; }

        setLoading(true);
        setError(null);
        try {
            const token = await verifyResetOTP(email, code);
            setResetToken(token);
            setVerified(true);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Incorrect code. Please try again.';
            setError(msg);
            triggerShake();
            setOtp(['', '', '', '', '', '']);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resending || resendCooldown > 0) return;
        setResending(true);
        setError(null);
        setOtp(['', '', '', '', '', '']);
        try {
            await sendResetOTP(email);
            startCooldown(RESEND_COOLDOWN);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } catch (err: any) {
            const status = err.response?.status;
            if (status === 429) {
                const retryAfter: number = err.response?.data?.retryAfter ?? RESEND_COOLDOWN;
                startCooldown(retryAfter);
                setError('Please wait before requesting a new code.');
            } else {
                Alert.alert('Error', 'Failed to resend code. Please try again.');
            }
        } finally {
            setResending(false);
        }
    };

    // ── Success state ──────────────────────────────────────────────────────────
    if (verified) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                <View style={styles.scroll}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={20} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Identity verified</Text>
                    <Text style={styles.subtitle}>
                        Your code was accepted. Click continue to create a new password for your account.
                    </Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate('ResetPassword', { email, resetToken })}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.buttonText}>Continue</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Back button */}
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={20} color="#fff" />
                    </TouchableOpacity>

                    <Text style={styles.title}>Check your email</Text>
                    <Text style={styles.subtitle}>
                        We sent a reset link to{' '}
                        <Text style={styles.emailBold}>{email}</Text>
                        {' '}— enter the 6-digit code mentioned in the email.
                    </Text>

                    {/* OTP Boxes */}
                    <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
                        {otp.map((digit, i) => (
                            <TextInput
                                key={i}
                                ref={ref => { inputRefs.current[i] = ref; }}
                                style={[
                                    styles.otpBox,
                                    digit !== '' && styles.otpBoxFilled,
                                    !!error && styles.otpBoxError,
                                ]}
                                value={digit}
                                onChangeText={text => handleChange(text, i)}
                                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                                keyboardType="number-pad"
                                maxLength={1}
                                textAlign="center"
                                selectTextOnFocus
                                caretHidden
                            />
                        ))}
                    </Animated.View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    {/* Verify button */}
                    <TouchableOpacity
                        style={[styles.button, (!allFilled || loading || isExpired) && styles.buttonDisabled]}
                        onPress={handleVerify}
                        disabled={!allFilled || loading || isExpired}
                        activeOpacity={0.85}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.buttonText}>Verify Code</Text>
                        }
                    </TouchableOpacity>

                    {/* Resend row */}
                    <View style={styles.resendRow}>
                        <Text style={styles.resendLabel}>Haven't got the email yet? </Text>
                        {isExpired ? (
                            <TouchableOpacity onPress={handleResend} disabled={resending}>
                                {resending
                                    ? <ActivityIndicator size="small" color="#0E1F43" />
                                    : <Text style={styles.resendLink}>Resend email</Text>
                                }
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.resendLink} onPress={undefined}>
                                <Text style={styles.resendCooldown}>
                                    Resend in {Math.floor(resendCooldown / 60).toString().padStart(2, '0')}:{(resendCooldown % 60).toString().padStart(2, '0')}
                                </Text>
                            </Text>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: scale(28),
        paddingTop: vs(32),
        paddingBottom: vs(28),
    },
    backBtn: {
        width: scale(38), height: vs(38), borderRadius: ms(19),
        backgroundColor: '#0E1F43',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: vs(28),
    },
    title: {
        fontSize: ms(22), fontWeight: '700', color: '#0E1F43',
        marginBottom: vs(8),
    },
    subtitle: {
        fontSize: ms(14), color: '#9AA5B8',
        lineHeight: vs(18), marginBottom: vs(24),
    },
    emailBold: { fontWeight: '700', color: '#0E1F43' },
    otpRow: {
        flexDirection: 'row',
        gap: scale(10),
        marginBottom: vs(16),
    },
    otpBox: {
        width: BOX_SIZE, height: BOX_SIZE,
        borderRadius: ms(10), borderWidth: 1.5, borderColor: '#D8DCE8',
        fontSize: ms(18), fontWeight: '700', color: '#0E1F43',
        backgroundColor: '#fff',
    },
    otpBoxFilled: { borderColor: '#0E1F43' },
    otpBoxError: { borderColor: '#E53935' },
    errorText: { fontSize: ms(12), color: '#E53935', marginBottom: vs(10) },
    button: {
        backgroundColor: '#0E1F43',
        height: vs(48), borderRadius: ms(12),
        alignItems: 'center', justifyContent: 'center',
        marginTop: vs(10), marginBottom: vs(16),
    },
    buttonDisabled: { backgroundColor: '#9AA5B8' },
    buttonText: { fontSize: ms(15), fontWeight: '700', color: '#fff' },
    resendRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center',
    },
    resendLabel: { fontSize: ms(13), color: '#9AA5B8' },
    resendLink: { fontSize: ms(13), fontWeight: '700', color: '#0E1F43', textDecorationLine: 'underline' },
    resendCooldown: { fontSize: ms(13), fontWeight: '600', color: '#9AA5B8', textDecorationLine: 'none' },
});

export default ForgotPasswordOTPScreen;
