import React, { useState, useEffect, useRef } from 'react';
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
import { useAuth } from '../../contexts/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { scale, vs, ms, wp } from '../../utils/responsive';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
    navigation: LoginScreenNavigationProp;
}

const { width } = Dimensions.get('window');

const LoginScreen: React.FC<Props> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSecure, setIsSecure] = useState(true);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auth State
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    // Animation Values
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await login(email, password);
            // login() sends OTP and sets twoFactorPending — navigate to verification screen
            navigation.navigate('TwoFactor', { email });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid credentials or network error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />

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

                            {/* Icon circle */}
                            <View style={styles.iconCircle}>
                                <Ionicons name="person-outline" size={30} color="#5A6A8A" />
                            </View>

                            {/* Titles */}
                            <Text style={styles.title}>Welcome back</Text>
                            <Text style={styles.subtitle}>Sign in to continue to your account</Text>

                            {/* Email Input */}
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email address"
                                    placeholderTextColor="#AABCD0"
                                    value={email}
                                    onChangeText={t => { setEmail(t); setError(null); }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={[styles.input, styles.inputWithIcon]}
                                    placeholder="Password"
                                    placeholderTextColor="#AABCD0"
                                    value={password}
                                    onChangeText={t => { setPassword(t); setError(null); }}
                                    secureTextEntry={isSecure}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    onPress={() => setIsSecure(!isSecure)}
                                    style={styles.eyeIcon}
                                >
                                    <Ionicons
                                        name={isSecure ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color="#AABCD0"
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Error */}
                            {error ? <Text style={styles.errorText}>{error}</Text> : null}

                            {/* Remember Me & Forgot Password */}
                            <View style={styles.optionsRow}>
                                <TouchableOpacity
                                    style={styles.rememberRow}
                                    onPress={() => setRememberMe(!rememberMe)}
                                >
                                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                                        {rememberMe && <Ionicons name="checkmark" size={12} color="white" />}
                                    </View>
                                    <Text style={styles.rememberText}>Remember me</Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                                    <Text style={styles.forgotText}>Forgot password?</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Login Button */}
                            <TouchableOpacity
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={0.85}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Login</Text>
                                )}
                            </TouchableOpacity>

                            {/* Footer */}
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.footerText}>
                                    New Member?{' '}
                                    <Text style={styles.footerLink}>Register now</Text>
                                </Text>
                            </TouchableOpacity>

                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
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
        paddingTop: vs(32),
        paddingBottom: vs(28),
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
        marginBottom: vs(20),
        lineHeight: vs(18),
    },

    // Inputs
    inputWrapper: {
        width: '100%',
        marginBottom: vs(10),
        position: 'relative',
    },
    input: {
        width: '100%',
        height: vs(46),
        borderRadius: ms(10),
        borderWidth: 1.5,
        borderColor: '#D8DFEE',
        backgroundColor: '#F8F9FF',
        paddingHorizontal: scale(16),
        fontSize: ms(14),
        color: '#0E1F43',
    },
    inputWithIcon: {
        paddingRight: scale(46),
    },
    eyeIcon: {
        position: 'absolute',
        right: scale(14),
        top: vs(17),
    },

    // Error
    errorText: {
        color: '#E53935',
        fontSize: ms(13),
        textAlign: 'center',
        marginBottom: vs(10),
        marginTop: vs(-4),
    },

    // Options row
    optionsRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: vs(16),
        paddingHorizontal: scale(2),
    },
    rememberRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: scale(16),
        height: vs(16),
        borderRadius: ms(4),
        borderWidth: 1.5,
        borderColor: '#A0AFCC',
        marginRight: scale(7),
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#0E1F43',
        borderColor: '#0E1F43',
    },
    rememberText: {
        fontSize: ms(13),
        color: '#666',
        fontWeight: '500',
    },
    forgotText: {
        fontSize: ms(13),
        color: '#0E1F43',
        fontWeight: '600',
    },

    // Button
    button: {
        width: '100%',
        height: vs(48),
        borderRadius: ms(12),
        backgroundColor: '#0E1F43',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: vs(16),
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

    // Footer
    footerText: {
        fontSize: ms(13),
        color: '#888',
        textAlign: 'center',
    },
    footerLink: {
        color: '#0E1F43',
        fontWeight: '700',
    },
});

export default LoginScreen;
