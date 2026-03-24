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
    Dimensions,
    StatusBar,
    Image,
    ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { scale, vs, ms, wp } from '../../utils/responsive';import CustomAlert, { AlertButton } from '../../components/CustomAlert';
type TwoFactorNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'TwoFactor'>;
type TwoFactorRouteProp = RouteProp<AuthStackParamList, 'TwoFactor'>;

interface Props {
    navigation: TwoFactorNavigationProp;
    route: TwoFactorRouteProp;
}

const { width } = Dimensions.get('window');

const RESEND_COOLDOWN = 5 * 60; // 5 minutes — also acts as OTP expiry

const TwoFactorScreen: React.FC<Props> = ({ navigation, route }) => {
    const { email } = route.params;
    const { verifyOTP, resendOTP } = useAuth();

    const [otp, setOtp] = useState<string[]>(['', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
    const resendCooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean; title: string; message: string; buttons?: AlertButton[]; icon?: any; iconColor?: string;
    }>({ visible: false, title: '', message: '' });

    const showAlert = (title: string, message: string, buttons?: AlertButton[], icon?: any, iconColor?: string) => {
        setAlertConfig({ visible: true, title, message, buttons, icon, iconColor });
    };

    const inputRefs = useRef<(TextInput | null)[]>([null, null, null, null]);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;

    // ─── Resend cooldown ─────────────────────────────────────────────────────
    const startResendCooldown = useCallback((seconds: number) => {
        setResendCooldown(seconds);
        if (resendCooldownRef.current) clearInterval(resendCooldownRef.current);
        resendCooldownRef.current = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) { clearInterval(resendCooldownRef.current!); return 0; }
                return prev - 1;
            });
        }, 1000);
    }, []);

    useEffect(() => {
        startResendCooldown(RESEND_COOLDOWN);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        setTimeout(() => inputRefs.current[0]?.focus(), 400);
        return () => {
            if (resendCooldownRef.current) clearInterval(resendCooldownRef.current);
        };
    }, []);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const isExpired = resendCooldown === 0;

    // ─── OTP Input Handlers ───────────────────────────────────────────────────
    const handleChange = (text: string, index: number) => {
        const digit = text.replace(/[^0-9]/g, '').slice(-1);
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);
        if (digit && index < 3) inputRefs.current[index + 1]?.focus();
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

    // ─── Verify ───────────────────────────────────────────────────────────────
    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length < 4) { showAlert('Incomplete Validaton', 'Please enter all 4 digits.', undefined, 'alert-circle', '#E97C3A'); triggerShake(); return; }
        if (isExpired) { showAlert('Expired', 'Your code has expired. Please request a new one.', undefined, 'time', '#EF4444'); triggerShake(); return; }

        setLoading(true);
        try {
            await verifyOTP(email, code);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Verification failed. Please try again.';
            showAlert('Verification Failed', msg, undefined, 'close-circle', '#EF4444');
            triggerShake();
            setOtp(['', '', '', '']);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } finally {
            setLoading(false);
        }
    };

    // ─── Resend ───────────────────────────────────────────────────────────────
    const handleResend = async () => {
        if (resending || resendCooldown > 0) return;
        setResending(true);
        setOtp(['', '', '', '']);
        try {
            await resendOTP(email);
            startResendCooldown(RESEND_COOLDOWN);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
            showAlert('Code Sent', 'A verification code has been securely sent to your email.', undefined, 'paper-plane', '#10B981');
        } catch (err: any) {
            const status = err.response?.status;
            if (status === 429) {
                const retryAfter: number = err.response?.data?.retryAfter ?? RESEND_COOLDOWN;
                startResendCooldown(retryAfter);
                showAlert('Too Many Requests', 'Please wait before requesting a new code.', undefined, 'time', '#EF4444');
            } else {
                showAlert('Error', 'Failed to resend the code. Please try again.', undefined, 'alert-circle', '#EF4444');
            }
        } finally {
            setResending(false);
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

    const allFilled = otp.every(d => d !== '');

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>

                        {/* Logo — above the card */}
                        <Image
                            source={require('../../../assets/images/logobgr.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />

                        {/* Card */}
                        <View style={styles.card}>

                            {/* Shield icon circle */}
                            <View style={styles.iconCircle}>
                                <Ionicons name="shield-outline" size={30} color="#5A6A8A" />
                            </View>

                            {/* Titles */}
                            <Text style={styles.title}>Two-Factor Authentication</Text>
                            <Text style={styles.subtitle}>
                                Enter the 4-digit PIN sent to your device
                            </Text>

                            {/* OTP Boxes */}
                            <Animated.View
                                style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}
                            >
                                {otp.map((digit, i) => (
                                    <TextInput
                                        key={i}
                                        ref={ref => { inputRefs.current[i] = ref; }}
                                        style={[
                                            styles.otpBox,
                                            digit !== '' && styles.otpBoxFilled,
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

                            {/* Verify button */}
                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    (!allFilled || loading || isExpired) && styles.buttonDisabled,
                                ]}
                                onPress={handleVerify}
                                disabled={!allFilled || loading || isExpired}
                                activeOpacity={0.85}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Verify &amp; Continue</Text>
                                )}
                            </TouchableOpacity>

                            {/* Resend row — always visible */}
                            <View style={styles.resendRow}>
                                <Text style={styles.resendLabel}>Didn't receive a code? </Text>
                                {isExpired ? (
                                    <TouchableOpacity onPress={handleResend} disabled={resending}>
                                        {resending ? (
                                            <ActivityIndicator size="small" color="#0E1F43" />
                                        ) : (
                                            <Text style={styles.resendLink}>Code expired — Resend</Text>
                                        )}
                                    </TouchableOpacity>
                                ) : (
                                    <Text style={[styles.resendCooldownText, resendCooldown < 60 && styles.resendCooldownWarn]}>
                                        Resend in {formatTime(resendCooldown)}
                                    </Text>
                                )}
                            </View>

                            {/* Back to Login */}
                            <TouchableOpacity
                                style={styles.backRow}
                                onPress={() => navigation.navigate('Login')}
                            >
                                <Ionicons name="arrow-back" size={13} color="#0E1F43" />
                                <Text style={styles.backText}> Back to Login</Text>
                            </TouchableOpacity>

                        </View>

                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default TwoFactorScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const BOX_SIZE = scale(58);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: scale(24),
        paddingVertical: vs(20),
    },
    inner: {
        width: '100%',
        alignItems: 'center',
    },

    // Logo — sits above the card
    logo: {
        width: wp(60),
        height: wp(40),
        marginBottom: -5,
        marginTop: vs(-80),
    },

    // Card
    card: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: ms(20),
        paddingHorizontal: scale(24),
        paddingTop: vs(20),
        paddingBottom: vs(18),
        alignItems: 'center',
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },

    // Icon circle
    iconCircle: {
        width: scale(56),
        height: vs(56),
        borderRadius: ms(28),
        backgroundColor: '#EAECF2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: vs(12),
    },

    // Text
    title: {
        fontSize: ms(22),
        fontWeight: '700',
        color: '#0E1F43',
        textAlign: 'center',
        marginBottom: vs(6),
    },
    subtitle: {
        fontSize: ms(14),
        color: '#999',
        textAlign: 'center',
        marginBottom: vs(16),
        lineHeight: vs(18),
    },

    // OTP
    otpRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: scale(12),
        marginBottom: vs(20),
        width: '100%',
    },
    otpBox: {
        width: BOX_SIZE,
        height: BOX_SIZE,
        borderRadius: ms(10),
        borderWidth: 1.5,
        borderColor: '#D8DFEE',
        backgroundColor: '#F8F9FF',
        fontSize: ms(22),
        fontWeight: '700',
        color: '#0E1F43',
        textAlign: 'center',
    },
    otpBoxFilled: {
        borderColor: '#0E1F43',
        backgroundColor: '#EDF1FF',
    },
    otpBoxError: {
        borderColor: '#E53935',
        backgroundColor: '#FFF5F5',
    },

    // Error
    errorText: {
        color: '#E53935',
        fontSize: ms(12),
        textAlign: 'center',
        marginTop: vs(4),
        marginBottom: vs(2),
    },

    resendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: vs(18),
    },
    resendLabel: {
        fontSize: ms(13),
        color: '#888',
    },
    resendLink: {
        fontSize: ms(13),
        fontWeight: '700',
        color: '#0E1F43',
        textDecorationLine: 'underline',
    },
    resendCooldownText: {
        fontSize: ms(13),
        fontWeight: '700',
        color: '#A0AFCC',
    },
    resendCooldownWarn: {
        color: '#E07B54',
    },

    // Button
    button: {
        width: '100%',
        height: vs(48),
        borderRadius: ms(12),
        backgroundColor: '#0E1F43',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: vs(14),
    },
    buttonDisabled: {
        backgroundColor: '#A0AFCC',
    },
    buttonText: {
        color: '#fff',
        fontSize: ms(15),
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    // Back
    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        fontSize: ms(13),
        color: '#0E1F43',
        fontWeight: '500',
    },
});
