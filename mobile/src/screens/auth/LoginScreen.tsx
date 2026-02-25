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
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

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
    
    // Auth State
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    
    // Animation Values
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Missing Fields', 'Please enter both email and password.');
            return;
        }

        // Simple validation
        if (!email.includes('@')) {
             // In a real app we might want stricter validation
        }

        setLoading(true);
        try {
            await login(email, password);
        } catch (error: any) {
            Alert.alert('Login Failed', 'Invalid credentials or network error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {/* Illustration Area */}
                    <Animated.View style={[styles.illustrationContainer, { opacity: fadeAnim }]}>
                        <Image 
                            source={require('../../../assets/images/login-illustration.png')}
                            style={{ width: width * 0.85, height: width * 0.65, resizeMode: 'contain' }}
                        />
                    </Animated.View>

                    <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>

                        {/* Email Input */}
                        <View style={styles.inputWrapper}>
                             <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor="#999"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                        
                        {/* Password Input */}
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor="#999"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={isSecure}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity 
                                onPress={() => setIsSecure(!isSecure)} 
                                style={styles.eyeIcon}
                            >
                                <Ionicons 
                                    name={isSecure ? "eye-off-outline" : "eye-outline"} 
                                    size={20} 
                                    color="#999" 
                                />
                            </TouchableOpacity>
                        </View>

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
                            
                            <TouchableOpacity>
                                <Text style={styles.forgotText}>Forgot password ?</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text style={styles.loginButtonText}>Login</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Footer */}
                        <View style={styles.footerContainer}>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.footerText}>New Member? <Text style={styles.footerLink}>Register now</Text></Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    topHeader: {
        paddingTop: 50,
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.s,
        backgroundColor: '#FFF',
    },
    topHeaderText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.xl,
        paddingTop: SPACING.xl * 5,
    },
    illustrationContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    illustrationPlaceholder: {
        width: 200,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    formContainer: {
        flex: 1,
    },
    headerContainer: {
        marginBottom: SPACING.l,
        alignItems: 'center',
    },
    welcomeText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 4,
    },
    subtitleText: {
        fontSize: 13,
        color: COLORS.text.secondary,
    },
    inputWrapper: {
        marginBottom: SPACING.m,
        position: 'relative',
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: BORDER_RADIUS.s,
        paddingHorizontal: SPACING.m,
        paddingVertical: 14,
        fontSize: 14,
        color: COLORS.text.primary,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    eyeIcon: {
        position: 'absolute',
        right: SPACING.m,
        top: 16,
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xl * 2,
        paddingHorizontal: 4,
    },
    rememberRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 14,
        height: 14,
        borderRadius: 3,
        borderWidth: 1,
        borderColor: COLORS.text.secondary,
        marginRight: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#0E1F43',
        borderColor: '#0E1F43',
    },
    rememberText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    forgotText: {
        fontSize: 12,
        color: '#0E1F43',
        fontWeight: '600',
    },
    loginButton: {
        backgroundColor: '#0E1F43',
        height: 52,
        borderRadius: BORDER_RADIUS.s,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 2,
    },
    loginButtonText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    footerContainer: {
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    footerText: {
        fontSize: 14,
        color: COLORS.text.secondary,
    },
    footerLink: {
        color: '#0E1F43',
        fontWeight: 'bold',
    },
});

export default LoginScreen;
