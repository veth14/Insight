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
        paddingHorizontal: 28,
        paddingTop: 56,
        paddingBottom: 40,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#0E1F43',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 48,
    },
    title: {
        fontSize: 32, fontWeight: '700', color: '#0E1F43',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15, color: '#9AA5B8',
        lineHeight: 22, marginBottom: 40,
    },
    label: {
        fontSize: 14, fontWeight: '600', color: '#0E1F43',
        marginBottom: 10,
    },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: '#D8DCE8',
        borderRadius: 10,
        paddingHorizontal: 16,
        height: 56,
        marginBottom: 20,
    },
    inputWrapperError: { borderColor: '#E53935' },
    input: {
        flex: 1, fontSize: 15, color: '#0E1F43',
    },
    errorText: { fontSize: 13, color: '#E53935', marginBottom: 12 },
    button: {
        backgroundColor: '#0E1F43',
        height: 58, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
        marginTop: 16,
    },
    buttonDisabled: { backgroundColor: '#9AA5B8' },
    buttonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    successIconWrap: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 40,
    },
});

export default ResetPasswordScreen;
