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
    Image,
    Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
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


const RegisterScreen: React.FC<Props> = ({ navigation }) => {
    // Form State
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [studentNumber, setStudentNumber] = useState('');
    const [yearLevel, setYearLevel] = useState('');
    const [program, setProgram] = useState<AcademicProgram | ''>('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    
    // UI State
    const [isSecure, setIsSecure] = useState(true);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const { register } = useAuth();

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleRegister = async () => {
        if (!fullName || !email || !studentNumber || !yearLevel || !program || !phoneNumber || !password) {
            Alert.alert('Missing Fields', 'Please fill in all fields completely.');
            return;
        }
        
        if (!termsAccepted) {
            Alert.alert('Terms & Conditions', 'Please accept the terms and conditions to continue.');
            return;
        }

        setLoading(true);
        try {
            await register(email, password, fullName, parseInt(yearLevel), program, studentNumber, phoneNumber);
        } catch (error: any) {
             Alert.alert('Registration Failed', error.message || 'An error occurred during registration.');
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
                    <Animated.View style={[styles.illustrationContainer, { opacity: fadeAnim, alignItems: 'center' }]}>
                        <Image 
                            source={require('../../../assets/images/register-illustration.png')}
                            style={{ width: width * 0.85, height: width * 0.55, resizeMode: 'contain' }}
                        />
                    </Animated.View>

                    <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
                        
                        {/* Full Name */}
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Full name"
                                placeholderTextColor="#999"
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </View>

                         {/* Email */}
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Valid email"
                                placeholderTextColor="#999"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                         {/* Student Number */}
                         <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Student number"
                                placeholderTextColor="#999"
                                value={studentNumber}
                                onChangeText={setStudentNumber}
                            />
                        </View>

                         {/* Year Level */}
                         <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Year Level (1-4)"
                                placeholderTextColor="#999"
                                value={yearLevel}
                                onChangeText={setYearLevel}
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
                                        onPress={() => setProgram(p)}
                                    >
                                        <Text style={[styles.programChipText, program === p && styles.programChipTextSelected]}>{p}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                         {/* Phone Number */}
                         <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Phone number"
                                placeholderTextColor="#999"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
                            />
                        </View>

                        {/* Password */}
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Strong Password"
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
                                    name={isSecure ? "lock-closed-outline" : "lock-open-outline"} 
                                    size={20} 
                                    color={COLORS.text.secondary} 
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Terms Checkbox */}
                        <TouchableOpacity 
                            style={styles.termsRow} 
                            onPress={() => setTermsAccepted(!termsAccepted)}
                        >
                            <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                                {termsAccepted && <Ionicons name="checkmark" size={12} color="white" />}
                            </View>
                            <Text style={styles.termsText}>
                                By checking the box you agree to our <Text style={styles.linkText}>Terms and Conditions</Text>
                            </Text>
                        </TouchableOpacity>

                        {/* Register Button */}
                        <TouchableOpacity
                            style={styles.registerButton}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <Text style={styles.registerButtonText}>Creating Account...</Text>
                            ) : (
                                <Text style={styles.registerButtonText}>Next &gt;</Text>
                            )}
                        </TouchableOpacity>

                        {/* Footer */}
                        <View style={styles.footerContainer}>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.footerText}>Already a member? <Text style={styles.linkText}>Log in</Text></Text>
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
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center', // Centers vertically if form fits screen
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.xl,
        paddingTop: SPACING.xl, // Start lower down
    },
    illustrationContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.l, // Space below image
    },
    illustrationPlaceholder: {
        width: 100,
        height: 80,
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
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.text.secondary,
        textAlign: 'center',
    },
    inputWrapper: {
        marginBottom: SPACING.s + 4,
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
        top: 14,
    },
    label: {
        fontSize: 12,
        color: COLORS.text.secondary,
        marginBottom: 4,
        marginLeft: 4
    },
    programContainer: {
        marginBottom: SPACING.m,
    },
    programRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    programChip: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.s,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    programChipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    programChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.text.secondary,
    },
    programChipTextSelected: {
        color: 'white',
    },
    termsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: SPACING.l,
        marginTop: SPACING.s,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.text.secondary,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    checkboxChecked: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    termsText: {
        fontSize: 12,
        color: COLORS.text.secondary,
        flex: 1,
        lineHeight: 18,
    },
    linkText: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    registerButton: {
        backgroundColor: COLORS.primary, // Dark Blue
        height: 52,
        borderRadius: BORDER_RADIUS.s,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.l,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 2,
    },
    registerButtonText: {
        color: '#FFF',
        fontSize: 16,
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
    }
});

export default RegisterScreen;
