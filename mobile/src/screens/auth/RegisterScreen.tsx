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
import * as ImagePicker from 'expo-image-picker';
import CustomAlert, { AlertButton } from '../../components/CustomAlert';
import api from '../../services/api.service';
import { Modal } from 'react-native';

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
    // Registration form photo (4th year only)
    const [regFormUri, setRegFormUri] = useState<string | null>(null);

    // UI State
    const [isSecure, setIsSecure] = useState(true);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [loading, setLoading] = useState(false);

    // Registration OTP State
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean; title: string; message: string; buttons?: AlertButton[]; icon?: any; iconColor?: string;
    }>({ visible: false, title: '', message: '' });

    const showAlert = (title: string, message: string, buttons?: AlertButton[], icon?: any, iconColor?: string) => {
        setAlertConfig({ visible: true, title, message, buttons, icon, iconColor });
    };

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
            showAlert('Missing Information', 'Please fill in all fields completely.', undefined, 'alert-circle', '#E97C3A');
            return;
        }

        if (!termsAccepted) {
            showAlert('Terms Required', 'Please accept the Terms and Conditions to continue.', undefined, 'alert-circle', '#E97C3A');
            return;
        }

        // 4th year must upload their registration form
        if (yearLevel === '4' && !regFormUri) {
            showAlert('Missing Form', '4th year students must upload their Student Registration Form.', undefined, 'document', '#E97C3A');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/send-register-otp', { email });
            setShowOtpModal(true);
        } catch (err: any) {
            showAlert('Verification Failed', err.response?.data?.message || 'Could not send verification code.', undefined, 'close-circle', '#EF4444');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndRegister = async () => {
        if (otpCode.length !== 6) {
            showAlert('Invalid Code', 'Please enter a 6-digit verification code.', undefined, 'alert-circle', '#E97C3A');
            return;
        }

        setOtpLoading(true);
        try {
            // Verify OTP first
            await api.post('/auth/verify-register-otp', { email, otp: otpCode });
            
            // If success, actually register the user
            setShowOtpModal(false);
            setLoading(true);
            const registrationFormLocalUri = regFormUri ?? undefined;
            await register(email, password, fullName, parseInt(yearLevel), program, studentNumber, '', registrationFormLocalUri);
        } catch (err: any) {
            showAlert('Registration Failed', err.response?.data?.message || err.message || 'Verification or registration failed.', undefined, 'close-circle', '#EF4444');
        } finally {
            setOtpLoading(false);
            setLoading(false);
        }
    };

    /* Pick photo from gallery */
    const pickPhoto = async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') {
            showAlert('Permission Denied', 'Permission to access photos is required.', undefined, 'alert-circle', '#E97C3A');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images' as any,
            allowsEditing: true,
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setRegFormUri(result.assets[0].uri);
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
                                    onChangeText={setFullName}
                                />
                            </View>

                            {/* Email */}
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Valid email"
                                    placeholderTextColor="#AABCD0"
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
                                    placeholderTextColor="#AABCD0"
                                    value={studentNumber}
                                    onChangeText={setStudentNumber}
                                />
                            </View>

                            {/* Year Level */}
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Year level (1–4)"
                                    placeholderTextColor="#AABCD0"
                                    value={yearLevel}
                                    onChangeText={t => {
                                        // Only allow a single digit between 1 and 4
                                        if (t === '' || /^[1-4]$/.test(t)) {
                                            setYearLevel(t);
                                            if (t !== '4') setRegFormUri(null);
                                        }
                                    }}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                />
                            </View>

                            {/* 4th Year: Student Registration Form Upload */}
                            {yearLevel === '4' && (
                                <View style={styles.uploadSection}>
                                    <View style={styles.uploadHeader}>
                                        <Ionicons name="document-attach-outline" size={ms(16)} color="#0E1F43" />
                                        <Text style={styles.uploadTitle}>Student Registration Form</Text>
                                        <View style={styles.uploadRequiredBadge}>
                                            <Text style={styles.uploadRequiredText}>Required</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.uploadSub}>
                                        4th year students must upload a photo of their official Student Registration Form for verification.
                                    </Text>

                                    {regFormUri ? (
                                        <View style={styles.previewBox}>
                                            <Image source={{ uri: regFormUri }} style={styles.previewImage} resizeMode="cover" />
                                            <TouchableOpacity style={styles.changePhotoBtn} onPress={pickPhoto} activeOpacity={0.8}>
                                                <Ionicons name="refresh-outline" size={ms(13)} color="#0E1F43" />
                                                <Text style={styles.changePhotoText}>Change Photo</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <TouchableOpacity style={styles.uploadBtn} onPress={pickPhoto} activeOpacity={0.8}>
                                            <Ionicons name="cloud-upload-outline" size={ms(22)} color="#9AADCA" />
                                            <Text style={styles.uploadBtnText}>Tap to upload photo</Text>
                                            <Text style={styles.uploadBtnSub}>JPG · PNG · max 10 MB</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}

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

                            {/* Password */}
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={[styles.input, styles.inputWithIcon]}
                                    placeholder="Strong password"
                                    placeholderTextColor="#AABCD0"
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
                                        name={isSecure ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color="#AABCD0"
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Terms Checkbox */}
                            <TouchableOpacity
                                style={styles.termsRow}
                                onPress={() => {
                                    if (!termsAccepted) {
                                        // Show T&C first — checkbox is ticked only after agreeing
                                        setShowTerms(true);
                                    } else {
                                        setTermsAccepted(false);
                                    }
                                }}
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

            <CustomAlert 
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                icon={alertConfig.icon}
                iconColor={alertConfig.iconColor}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />

            {/* OTP Modal */}
            <Modal visible={showOtpModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Ionicons name="mail-unread-outline" size={ms(48)} color="#4A90E2" style={{ marginBottom: vs(16) }} />
                        <Text style={styles.modalTitle}>Verify Your Email</Text>
                        <Text style={styles.modalSubtitle}>
                            We sent a 6-digit code to <Text style={{ fontWeight: 'bold' }}>{email}</Text>. Please enter it below.
                        </Text>

                        <TextInput
                            style={styles.otpInput}
                            placeholder="000000"
                            placeholderTextColor="#AABCD0"
                            keyboardType="number-pad"
                            maxLength={6}
                            value={otpCode}
                            onChangeText={setOtpCode}
                        />

                        <TouchableOpacity
                            style={[styles.button, otpLoading && styles.buttonDisabled, { marginTop: vs(24), width: '100%' }]}
                            onPress={handleVerifyAndRegister}
                            disabled={otpLoading}
                        >
                            {otpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify & Register</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setShowOtpModal(false)} style={{ marginTop: vs(16) }} disabled={otpLoading}>
                            <Text style={styles.footerLink}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </View>
    );
};

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

    // 4th year upload section
    uploadSection: {
        width: '100%',
        backgroundColor: '#F7F9FF',
        borderRadius: ms(12),
        borderWidth: 1.5,
        borderColor: '#D8DFEE',
        padding: scale(14),
        marginBottom: vs(14),
    },
    uploadHeader: {
        flexDirection: 'row', alignItems: 'center', gap: scale(6), marginBottom: vs(5),
    },
    uploadTitle: {
        fontSize: ms(13), fontWeight: '700', color: '#0E1F43', flex: 1,
    },
    uploadRequiredBadge: {
        backgroundColor: '#FEF3C7', borderRadius: ms(8),
        paddingHorizontal: scale(7), paddingVertical: vs(2),
    },
    uploadRequiredText: {
        fontSize: ms(10), fontWeight: '700', color: '#D97706',
    },
    uploadSub: {
        fontSize: ms(11), color: '#9AADCA', lineHeight: ms(16), marginBottom: vs(10),
    },
    uploadBtn: {
        borderWidth: 1.5, borderColor: '#D8DFEE', borderStyle: 'dashed',
        borderRadius: ms(10), paddingVertical: vs(18),
        alignItems: 'center', gap: vs(4),
        backgroundColor: '#fff',
    },
    uploadBtnText: {
        fontSize: ms(13), fontWeight: '600', color: '#9AADCA',
    },
    uploadBtnSub: {
        fontSize: ms(11), color: '#C0CDE8',
    },
    previewBox: {
        borderRadius: ms(10), overflow: 'hidden', borderWidth: 1, borderColor: '#D8DFEE',
    },
    previewImage: {
        width: '100%', height: vs(140),
    },
    changePhotoBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: scale(6), paddingVertical: vs(8), backgroundColor: '#F7F9FF',
        borderTopWidth: 1, borderTopColor: '#E8ECF4',
    },
    changePhotoText: {
        fontSize: ms(12), fontWeight: '600', color: '#0E1F43',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: scale(20),
    },
    modalContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: ms(20),
        padding: scale(24),
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: ms(22),
        fontWeight: '700',
        color: '#0E1F43',
        marginBottom: vs(8),
    },
    modalSubtitle: {
        fontSize: ms(14),
        color: '#5B6F96',
        textAlign: 'center',
        marginBottom: vs(24),
    },
    otpInput: {
        width: '100%',
        height: vs(55),
        borderWidth: 1.5,
        borderColor: '#D8DFEE',
        borderRadius: ms(12),
        backgroundColor: '#F8F9FF',
        fontSize: ms(24),
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#0E1F43',
        letterSpacing: 4,
    },
});

export default RegisterScreen;
