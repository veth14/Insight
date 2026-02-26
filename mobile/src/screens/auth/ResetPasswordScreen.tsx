import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
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

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type RouteP = RouteProp<AuthStackParamList, 'ResetPassword'>;
interface Props { navigation: Nav; route: RouteP; }

const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
    const { email, resetToken } = route.params;
    const { resetPassword } = useAuth();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    const canSubmit = password.length >= 6 && confirmPassword.length > 0 && !loading;

    const handleReset = async () => {
        if (!password) { setError('Please enter a new password.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

        setLoading(true);
        setError(null);
        try {
            await resetPassword(email, resetToken, password);
            setDone(true);
        } catch (err: any) {
            const code = err.response?.data?.code;
            if (code === 'TOKEN_EXPIRED' || code === 'INVALID_TOKEN') {
                setError('Your reset session has expired. Please start over.');
            } else {
                setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                <View style={styles.scroll}>
                    <View style={styles.successIconWrap}>
                        <Ionicons name="checkmark-circle" size={80} color="#0E1F43" />
                    </View>
                    <Text style={styles.title}>Password updated!</Text>
                    <Text style={styles.subtitle}>
                        Your password has been changed successfully. Use your new password to log in.
                    </Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate('Login')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.buttonText}>Back to Login</Text>
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

                    <Text style={styles.title}>Set a new password</Text>
                    <Text style={styles.subtitle}>
                        Create a new password. Ensure it differs from previous ones for security.
                    </Text>

                    {/* Password */}
                    <Text style={styles.label}>Password</Text>
                    <View style={[styles.inputWrapper, password.length > 0 && password.length < 6 && styles.inputWrapperError]}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your new password"
                            placeholderTextColor="#C0C8D8"
                            value={password}
                            onChangeText={t => { setPassword(t); setError(null); }}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            returnKeyType="next"
                        />
                        <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color="#C0C8D8" />
                        </TouchableOpacity>
                    </View>

                    {/* Confirm Password */}
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={[
                        styles.inputWrapper,
                        confirmPassword.length > 0 && password !== confirmPassword && styles.inputWrapperError,
                    ]}>
                        <TextInput
                            style={styles.input}
                            placeholder="Re-enter password"
                            placeholderTextColor="#C0C8D8"
                            value={confirmPassword}
                            onChangeText={t => { setConfirmPassword(t); setError(null); }}
                            secureTextEntry={!showConfirm}
                            autoCapitalize="none"
                            returnKeyType="done"
                            onSubmitEditing={handleReset}
                        />
                        <TouchableOpacity onPress={() => setShowConfirm(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name={showConfirm ? 'eye-outline' : 'eye-off-outline'} size={18} color="#C0C8D8" />
                        </TouchableOpacity>
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity
                        style={[styles.button, !canSubmit && styles.buttonDisabled]}
                        onPress={handleReset}
                        disabled={!canSubmit}
                        activeOpacity={0.85}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.buttonText}>Update Password</Text>
                        }
                    </TouchableOpacity>
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
    label: {
        fontSize: ms(13), fontWeight: '600', color: '#0E1F43',
        marginBottom: vs(8),
    },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: '#D8DCE8',
        borderRadius: ms(10),
        paddingHorizontal: scale(16),
        height: vs(46),
        marginBottom: vs(14),
    },
    inputWrapperError: { borderColor: '#E53935' },
    input: {
        flex: 1, fontSize: ms(14), color: '#0E1F43',
    },
    errorText: { fontSize: ms(12), color: '#E53935', marginBottom: vs(10) },
    button: {
        backgroundColor: '#0E1F43',
        height: vs(48), borderRadius: ms(12),
        alignItems: 'center', justifyContent: 'center',
        marginTop: vs(12),
    },
    buttonDisabled: { backgroundColor: '#9AA5B8' },
    buttonText: { fontSize: ms(15), fontWeight: '700', color: '#fff' },
    successIconWrap: {
        alignItems: 'center',
        marginBottom: vs(20),
        marginTop: vs(24),
    },
});

export default ResetPasswordScreen;
