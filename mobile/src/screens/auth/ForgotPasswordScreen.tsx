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
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
interface Props { navigation: Nav; }

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
    const { sendResetOTP } = useAuth();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSend = async () => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) { setError('Please enter your email address.'); return; }
        if (!/\S+@\S+\.\S+/.test(trimmed)) { setError('Please enter a valid email address.'); return; }

        setLoading(true);
        setError(null);
        try {
            await sendResetOTP(trimmed);
            navigation.navigate('ForgotPasswordOTP', { email: trimmed });
        } catch (err: any) {
            const status = err.response?.status;
            if (status === 429) {
                setError(err.response?.data?.message || 'Too many requests. Please wait before trying again.');
            } else {
                setError('Failed to send reset code. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const canSubmit = email.trim().length > 0 && !loading;

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
                        <Ionicons name="chevron-back" size={26} color="#fff" />
                    </TouchableOpacity>

                    <Text style={styles.title}>Forgot password</Text>
                    <Text style={styles.subtitle}>Please enter your email to reset the password</Text>

                    <Text style={styles.label}>Email or phone number</Text>
                    <TextInput
                        style={[styles.input, !!error && styles.inputError]}
                        placeholder="Enter your email or phone number"
                        placeholderTextColor="#C0C8D8"
                        value={email}
                        onChangeText={t => { setEmail(t); setError(null); }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="send"
                        onSubmitEditing={handleSend}
                    />
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity
                        style={[styles.button, !canSubmit && styles.buttonDisabled]}
                        onPress={handleSend}
                        disabled={!canSubmit}
                        activeOpacity={0.85}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.buttonText}>Reset Password</Text>
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
        lineHeight: 22, marginBottom: 48,
    },
    label: {
        fontSize: 14, fontWeight: '600', color: '#0E1F43',
        marginBottom: 10,
    },
    input: {
        borderWidth: 1.5, borderColor: '#D8DCE8',
        borderRadius: 10,
        paddingHorizontal: 16, paddingVertical: 16,
        fontSize: 15, color: '#0E1F43',
        marginBottom: 8,
    },
    inputError: { borderColor: '#E53935' },
    errorText: { fontSize: 13, color: '#E53935', marginBottom: 12 },
    button: {
        backgroundColor: '#0E1F43',
        height: 58, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
        marginTop: 28,
    },
    buttonDisabled: { backgroundColor: '#9AA5B8' },
    buttonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default ForgotPasswordScreen;
