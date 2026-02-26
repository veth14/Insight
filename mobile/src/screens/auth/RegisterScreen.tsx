import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Animated,
    StatusBar,
    Image,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { scale, vs, ms, wp } from '../../utils/responsive';
import { useAuth } from '../../contexts/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, AcademicProgram } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import TermsAndConditionsModal from './TermsAndConditionsModal';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface Props {
    navigation: RegisterScreenNavigationProp;
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
    // Form State
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [studentNumber, setStudentNumber] = useState('');
    const [yearLevel, setYearLevel] = useState('');
    const [program, setProgram] = useState<AcademicProgram | ''>('');
    const [password, setPassword] = useState('');

    // UI State
    const [isSecure, setIsSecure] = useState(true);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const { register } = useAuth();

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleRegister = async () => {
        if (!fullName || !email || !studentNumber || !yearLevel || !program || !password) {
            setError('Please fill in all fields completely.');
            return;
        }

        if (!termsAccepted) {
            setError('Please accept the Terms and Conditions to continue.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await register(email, password, fullName, parseInt(yearLevel), program, studentNumber, '');
        } catch (err: any) {
            setError(err.message || 'An error occurred during registration.');
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
                                <Ionicons name="person-add-outline" size={30} color="#5A6A8A" />
                            </View>

                            {/* Titles */}
                            <Text style={styles.title}>Create account</Text>
                            <Text style={styles.subtitle}>Join Insight to start your research journey</Text>

                            {/* Full Name */}
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full name"
                                    placeholderTextColor="#AABCD0"
                                    value={fullName}
                                    onChangeText={t => { setFullName(t); setError(null); }}
                                />
                            </View>

                            {/* Email */}
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Valid email"
                                    placeholderTextColor="#AABCD0"
                                    value={email}
                                    onChangeText={t => { setEmail(t); setError(null); }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* Student Number */}
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Student number"
                                    placeholderTextColor="#AABCD0"
                                    value={studentNumber}
                                    onChangeText={t => { setStudentNumber(t); setError(null); }}
                                />
                            </View>

                            {/* Year Level */}
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Year level (1–4)"
                                    placeholderTextColor="#AABCD0"
                                    value={yearLevel}
                                    onChangeText={t => { setYearLevel(t); setError(null); }}
                                    keyboardType="numeric"
                                />
                            </View>

                            {/* Program Selector */}
                            <View style={styles.programContainer}>
                                <Text style={styles.label}>Program</Text>
                                <View style={styles.programRow}>
                                    {[AcademicProgram.BSIS, AcademicProgram.BSIT, AcademicProgram.BSCS].map((p) => (
                                        <TouchableOpacity
                                            key={p}
                                            style={[styles.programChip, program === p && styles.programChipSelected]}
                                            onPress={() => { setProgram(p); setError(null); }}
                                        >
                                            <Text style={[styles.programChipText, program === p && styles.programChipTextSelected]}>{p}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Password */}
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={[styles.input, styles.inputWithIcon]}
                                    placeholder="Strong password"
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

                            {/* Terms Checkbox */}
                            <TouchableOpacity
                                style={styles.termsRow}
                                onPress={() => setTermsAccepted(!termsAccepted)}
                            >
                                <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                                    {termsAccepted && <Ionicons name="checkmark" size={12} color="white" />}
                                </View>
                                <Text style={styles.termsText}>
                                    By checking this box you agree to our{' '}
                                    <Text style={styles.linkText} onPress={() => setShowTerms(true)}>
                                        Terms and Conditions
                                    </Text>
                                </Text>
                            </TouchableOpacity>

                            <TermsAndConditionsModal
                                visible={showTerms}
                                onClose={() => setShowTerms(false)}
                                onAgree={() => {
                                    setTermsAccepted(true);
                                    setShowTerms(false);
                                }}
                            />

                            {/* Register Button */}
                            <TouchableOpacity
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={handleRegister}
                                disabled={loading}
                                activeOpacity={0.85}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Register</Text>
                                )}
                            </TouchableOpacity>

                            {/* Footer */}
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.footerText}>
                                    Already a member?{' '}
                                    <Text style={styles.footerLink}>Log in</Text>
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
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: scale(24),
        paddingTop: vs(48),
        paddingBottom: vs(32),
    },
    inner: {
        width: '100%',
        alignItems: 'center',
    },

    // Logo — sits above the card
    logo: {
        width: wp(55),
        height: wp(35),
        marginBottom: vs(8),
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
        width: '100%',
    },

    // Program selector
    label: {
        fontSize: ms(13),
        color: '#888',
        marginBottom: vs(8),
        fontWeight: '500',
    },
    programContainer: {
        width: '100%',
        marginBottom: vs(14),
    },
    programRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: scale(8),
    },
    programChip: {
        flex: 1,
        height: vs(38),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: ms(10),
        borderWidth: 1.5,
        borderColor: '#D8DFEE',
        backgroundColor: '#F8F9FF',
    },
    programChipSelected: {
        backgroundColor: '#0E1F43',
        borderColor: '#0E1F43',
    },
    programChipText: {
        fontSize: ms(13),
        fontWeight: '600',
        color: '#5A6A8A',
    },
    programChipTextSelected: {
        color: '#fff',
    },

    // Terms
    termsRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: vs(16),
        marginTop: vs(4),
    },
    checkbox: {
        width: scale(18),
        height: vs(18),
        borderRadius: ms(4),
        borderWidth: 1.5,
        borderColor: '#A0AFCC',
        marginRight: scale(10),
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 1,
    },
    checkboxChecked: {
        backgroundColor: '#0E1F43',
        borderColor: '#0E1F43',
    },
    termsText: {
        fontSize: ms(13),
        color: '#888',
        flex: 1,
        lineHeight: vs(20),
    },
    linkText: {
        color: '#0E1F43',
        fontWeight: '700',
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

export default RegisterScreen;
