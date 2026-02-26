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
    const [error, setError] = useState<string | null>(null);
    const resendCooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        setError(null);
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
        if (code.length < 4) { setError('Please enter all 4 digits.'); triggerShake(); return; }
        if (isExpired) { setError('Your code has expired. Please request a new one.'); triggerShake(); return; }

        setLoading(true);
        setError(null);
        try {
            await verifyOTP(email, code);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Verification failed. Please try again.';
            setError(msg);
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
        setError(null);
        setOtp(['', '', '', '']);
        try {
            await resendOTP(email);
            startResendCooldown(RESEND_COOLDOWN);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } catch (err: any) {
            const status = err.response?.status;
            if (status === 429) {
                const retryAfter: number = err.response?.data?.retryAfter ?? RESEND_COOLDOWN;
                startResendCooldown(retryAfter);
                setError(`Please wait before requesting a new code.`);
            } else {
                Alert.alert('Error', 'Failed to resend the code. Please try again.');
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

                            {/* Error */}
                            {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
const BOX_SIZE = 80;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FA',
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    inner: {
        width: '100%',
        alignItems: 'center',
    },

    // Logo — sits above the card
    logo: {
        width: width * 0.80,
        height: width * 0.55,
        marginBottom: -5,
        marginTop: -130,
    },

    // Card
    card: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 28,
        alignItems: 'center',
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },

    // Icon circle
    iconCircle: {
        width: 74,
        height: 74,
        borderRadius: 42,
        backgroundColor: '#EAECF2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },

    // Text
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#0E1F43',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        color: '#999',
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 21,
    },

    // OTP
    otpRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 14,
        marginBottom: 30,
        width: '100%',
    },
    otpBox: {
        width: BOX_SIZE,
        height: BOX_SIZE,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#D8DFEE',
        backgroundColor: '#F8F9FF',
        fontSize: 30,
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
        fontSize: 18,
        textAlign: 'center',
        marginTop: 6,
        marginBottom: 2,
    },

    resendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    resendLabel: {
        fontSize: 13,
        color: '#888',
    },
    resendLink: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0E1F43',
        textDecorationLine: 'underline',
    },
    resendCooldownText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#A0AFCC',
    },
    resendCooldownWarn: {
        color: '#E07B54',
    },

    // Button
    button: {
        width: '100%',
        height: 60,
        borderRadius: 20,
        backgroundColor: '#0E1F43',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    buttonDisabled: {
        backgroundColor: '#A0AFCC',
    },
    buttonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    // Back
    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        fontSize: 16,
        color: '#0E1F43',
        fontWeight: '500',
    },
});
