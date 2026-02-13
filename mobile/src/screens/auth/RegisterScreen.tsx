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
    StatusBar,
    Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, AcademicProgram } from '../../types';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface Props {
    navigation: RegisterScreenNavigationProp;
}

const INTERESTS_LIST = [
    'Computer Science', 'Data Science', 'AI/ML', 'Education', 'Psychology',
    'Mobile Dev', 'Cybersecurity', 'IoT', 'Business', 'Mathematics'
];

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
            useNativeDriver: false,
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

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [yearLevel, setYearLevel] = useState('');
    const [program, setProgram] = useState<AcademicProgram | null>(null);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    
    // UI State
    const [isSecure, setIsSecure] = useState(true);
    const [isConfirmSecure, setIsConfirmSecure] = useState(true);
    const [loading, setLoading] = useState(false);
    
    const { register } = useAuth();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    const toggleInterest = (interest: string) => {
        if (selectedInterests.includes(interest)) {
            setSelectedInterests(selectedInterests.filter(i => i !== interest));
        } else {
            setSelectedInterests([...selectedInterests, interest]);
        }
    };

    const handleRegister = async () => {
        if (!email || !password || !confirmPassword || !displayName || !yearLevel || !program) {
            Alert.alert('Missing Fields', 'Please fill in all required fields including Program.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Mismatch', 'Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters.');
            return;
        }

        const yearNum = parseInt(yearLevel);
        if (isNaN(yearNum) || yearNum < 1 || yearNum > 5) {
            Alert.alert('Invalid Year', 'Please select a valid year level (1-5).');
            return;
        }

        setLoading(true);
        try {
            await register(email, password, displayName, yearNum, program);
        } catch (error: any) {
            Alert.alert('Registration Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrength = () => {
        if (password.length === 0) return 0;
        if (password.length < 6) return 1;
        if (password.length < 10) return 2;
        return 3;
    };

    const strength = getPasswordStrength();
    const strengthColor = ['#E2E8F0', '#EF4444', '#F59E0B', '#10B981'][strength];

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
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Join the academic community</Text>
                        </View>

                        <FloatingLabelInput
                            label="Full Name"
                            value={displayName}
                            onChangeText={setDisplayName}
                        />

                        <FloatingLabelInput
                            label="University Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                        />

                        {/* Program Selection */}
                        <Text style={styles.sectionLabel}>Program</Text>
                        <View style={styles.programRow}>
                            {Object.values(AcademicProgram).map((prog) => (
                                <TouchableOpacity
                                    key={prog}
                                    style={[
                                        styles.programOption,
                                        program === prog && styles.programOptionSelected
                                    ]}
                                    onPress={() => setProgram(prog)}
                                >
                                    <Text style={[
                                        styles.programText,
                                        program === prog && styles.programTextSelected
                                    ]}>{prog}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Year Level Selection */}
                        <Text style={styles.sectionLabel}>Year Level</Text>
                        <View style={styles.yearRow}>
                            {[1, 2, 3, 4, 5].map((y) => (
                                <TouchableOpacity
                                    key={y}
                                    style={[
                                        styles.yearOption,
                                        yearLevel === y.toString() && styles.yearOptionSelected
                                    ]}
                                    onPress={() => setYearLevel(y.toString())}
                                >
                                    <Text style={[
                                        styles.yearText,
                                        yearLevel === y.toString() && styles.yearTextSelected
                                    ]}>{y}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <FloatingLabelInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={isSecure}
                            onToggleSecure={() => setIsSecure(!isSecure)}
                            isPassword
                        />

                        {/* Password Strength Indicator */}
                        {password.length > 0 && (
                            <View style={styles.strengthContainer}>
                                <View style={[styles.strengthBar, { flex: strength >= 1 ? 1 : 0, backgroundColor: strength >= 1 ? strengthColor : '#E2E8F0' }]} />
                                <View style={[styles.strengthBar, { flex: strength >= 2 ? 1 : 0, backgroundColor: strength >= 2 ? strengthColor : '#E2E8F0' }]} />
                                <View style={[styles.strengthBar, { flex: strength >= 3 ? 1 : 0, backgroundColor: strength >= 3 ? strengthColor : '#E2E8F0' }]} />
                            </View>
                        )}

                        <FloatingLabelInput
                            label="Confirm Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={isConfirmSecure}
                            onToggleSecure={() => setIsConfirmSecure(!isConfirmSecure)}
                            isPassword
                        />

                        <Text style={styles.sectionLabel}>Academic Interests</Text>
                        <View style={styles.chipsContainer}>
                            {INTERESTS_LIST.map((interest) => (
                                <TouchableOpacity
                                    key={interest}
                                    style={[
                                        styles.chip,
                                        selectedInterests.includes(interest) && styles.chipSelected
                                    ]}
                                    onPress={() => toggleInterest(interest)}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        selectedInterests.includes(interest) && styles.chipTextSelected
                                    ]}>{interest}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.registerButton}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <Text style={styles.registerButtonText}>Creating Account...</Text>
                            ) : (
                                <Text style={styles.registerButtonText}>Register</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loginLink}>
                            <Text style={styles.loginLinkText}>
                                Already have an account? <Text style={styles.loginLinkHighlight}>Login</Text>
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
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
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: SPACING.l,
        paddingTop: 60,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: BORDER_RADIUS.l,
        padding: SPACING.l,
        ...SHADOWS.medium,
        marginBottom: SPACING.xl, // for scrolling buffer
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    title: {
        ...TYPOGRAPHY.h2,
        color: COLORS.primary,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.secondary,
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
        paddingTop: SPACING.s,
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
    },
    eyeIcon: {
        position: 'absolute',
        right: SPACING.m,
        top: 16,
    },
    sectionLabel: {
        ...TYPOGRAPHY.h3,
        fontSize: 14,
        color: COLORS.text.secondary,
        marginBottom: SPACING.s,
        marginTop: SPACING.s,
    },
    programRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.m,
    },
    programOption: {
        flex: 1,
        padding: SPACING.s,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.s,
        marginHorizontal: 4,
        backgroundColor: COLORS.card,
    },
    programOptionSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    programText: {
        fontWeight: '600',
        color: COLORS.text.primary,
        fontSize: 12,
    },
    programTextSelected: {
        color: COLORS.white,
    },
    yearRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.l,
    },
    yearOption: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
    },
    yearOptionSelected: {
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accent,
    },
    yearText: {
        color: COLORS.text.secondary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    yearTextSelected: {
        color: '#FFF',
    },
    strengthContainer: {
        flexDirection: 'row',
        height: 4,
        marginTop: -SPACING.m,
        marginBottom: SPACING.m,
        borderRadius: 2,
        overflow: 'hidden',
    },
    strengthBar: {
        flex: 1,
        marginHorizontal: 1,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: SPACING.xl,
    },
    chip: {
        paddingHorizontal: SPACING.m,
        paddingVertical: 8,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: SPACING.s,
        marginBottom: SPACING.s,
        backgroundColor: '#FAFAFA',
    },
    chipSelected: {
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accent,
    },
    chipText: {
        color: COLORS.text.secondary,
        fontSize: 12,
        fontWeight: '500',
    },
    chipTextSelected: {
        color: '#FFF',
    },
    registerButton: {
        backgroundColor: COLORS.accent,
        height: 56,
        borderRadius: BORDER_RADIUS.m,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.subtle,
        marginBottom: SPACING.l,
    },
    registerButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    loginLink: {
        alignItems: 'center',
    },
    loginLinkText: {
        color: COLORS.text.secondary,
    },
    loginLinkHighlight: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
});

export default RegisterScreen;
