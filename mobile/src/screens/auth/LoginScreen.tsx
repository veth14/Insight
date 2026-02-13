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
    Animated,
    Dimensions,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
    navigation: LoginScreenNavigationProp;
}

const { width } = Dimensions.get('window');

const FloatingLabelInput = ({ 
    label, 
    value, 
    onChangeText, 
    secureTextEntry, 
    onToggleSecure,
    isPassword,
    keyboardType = 'default'
}: any) => {
    const [isFocused, setIsFocused] = useState(false);
    const animatedLabel = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(animatedLabel, {
            toValue: (isFocused || value) ? 1 : 0,
            duration: 200,
            useNativeDriver: false, // Text style text cannot animate natively
        }).start();
    }, [isFocused, value]);

    const labelStyle = {
        top: animatedLabel.interpolate({
            inputRange: [0, 1],
            outputRange: [18, 6],
        }),
        fontSize: animatedLabel.interpolate({
            inputRange: [0, 1],
            outputRange: [16, 12],
        }),
        color: animatedLabel.interpolate({
            inputRange: [0, 1],
            outputRange: [COLORS.text.secondary, COLORS.primary],
        }),
    };

    return (
        <View style={styles.inputContainer}>
            <Animated.Text style={[styles.floatingLabel, labelStyle]}>
                {label}
            </Animated.Text>
            <TextInput
                style={[
                    styles.input, 
                    isFocused && styles.inputFocused,
                    { paddingRight: isPassword ? 50 : SPACING.m }
                ]}
                value={value}
                onChangeText={onChangeText}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                secureTextEntry={secureTextEntry}
                autoCapitalize="none"
                keyboardType={keyboardType}
            />
            {isPassword && (
                <TouchableOpacity onPress={onToggleSecure} style={styles.eyeIcon}>
                    <Ionicons 
                        name={secureTextEntry ? "eye-off-outline" : "eye-outline"} 
                        size={24} 
                        color={COLORS.text.secondary} 
                    />
                </TouchableOpacity>
            )}
        </View>
    );
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSecure, setIsSecure] = useState(true);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    
    // Animation Values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Missing Fields', 'Please enter both email and password.');
            return;
        }

        if (!email.includes('@')) {
            Alert.alert('Invalid Email', 'Please enter a valid university email.');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
        } catch (error: any) {
            Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={[COLORS.primary, '#2E5090']}
                style={styles.background}
            />
            
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.logoCircle}>
                        <Ionicons name="school" size={48} color={COLORS.primary} />
                    </View>
                    <Text style={styles.title}>INSIGHT</Text>
                    <Text style={styles.subtitle}>University Academic Research Repository</Text>
                </Animated.View>

                <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <FloatingLabelInput
                        label="University Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                    />
                    
                    <FloatingLabelInput
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={isSecure}
                        onToggleSecure={() => setIsSecure(!isSecure)}
                        isPassword
                    />

                    <TouchableOpacity style={styles.forgotPass}>
                        <Text style={styles.forgotPassText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <Text style={styles.loginButtonText}>Signing in...</Text>
                        ) : (
                            <View style={styles.loginBtnContent}>
                                <Text style={styles.loginButtonText}>Sign In</Text>
                                <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.socialRow}>
                        <TouchableOpacity style={styles.socialBtn}>
                            <Ionicons name="logo-google" size={20} color={COLORS.text.secondary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialBtn}>
                            <Ionicons name="logo-apple" size={20} color={COLORS.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.registerLink}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <Text style={styles.registerText}>
                            New here? <Text style={styles.registerHighlight}>Create an Account</Text>
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primary,
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: '100%',
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
        padding: SPACING.l,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.m,
        ...SHADOWS.medium,
    },
    title: {
        ...TYPOGRAPHY.h1,
        color: '#FFF',
        letterSpacing: 2,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        ...TYPOGRAPHY.body,
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: BORDER_RADIUS.l,
        padding: SPACING.l,
        paddingVertical: SPACING.xl,
        ...SHADOWS.medium,
    },
    inputContainer: {
        marginBottom: SPACING.l,
        position: 'relative',
    },
    input: {
        height: 56,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.m,
        paddingHorizontal: SPACING.m,
        paddingTop: SPACING.s, // Space for label
        fontSize: 16,
        color: COLORS.text.primary,
        backgroundColor: '#FAFAFA',
    },
    inputFocused: {
        borderColor: COLORS.primary,
        backgroundColor: '#FFF',
    },
    floatingLabel: {
        position: 'absolute',
        left: SPACING.m,
        zIndex: 1,
        backgroundColor: 'transparent',
    },
    eyeIcon: {
        position: 'absolute',
        right: SPACING.m,
        top: 16,
    },
    forgotPass: {
        alignSelf: 'flex-end',
        marginBottom: SPACING.l,
    },
    forgotPassText: {
        color: COLORS.text.secondary,
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
        backgroundColor: COLORS.accent,
        height: 56,
        borderRadius: BORDER_RADIUS.m,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.subtle,
    },
    loginBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: SPACING.l,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dividerText: {
        marginHorizontal: SPACING.m,
        color: COLORS.text.secondary,
        fontSize: 12,
    },
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: SPACING.l,
    },
    socialBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: SPACING.s,
        backgroundColor: '#FFF',
    },
    registerLink: {
        alignItems: 'center',
        paddingTop: SPACING.m,
    },
    registerText: {
        color: COLORS.text.secondary,
        fontSize: 15,
    },
    registerHighlight: {
        color: COLORS.accent,
        fontWeight: 'bold',
    },
});

export default LoginScreen;
