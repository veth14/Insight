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
import { scale, vs, ms } from '../../utils/responsive';

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
            console.error('Forgot password click error:', err);
            const status = err.response?.status;
            if (status === 429) {
                setError(err.response?.data?.message || 'Too many requests. Please wait before trying again.');
            } else if (err.message === 'Network Error') {
                setError('Network Error: Cannot reach the server. Please check your connection.');
            } else {
                setError(err.response?.data?.message || 'Failed to send reset code. Please try again.');
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

                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                        style={[styles.input, !!error && styles.inputError]}
                        placeholder="Enter your email address"
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
        lineHeight: vs(18), marginBottom: vs(28),
    },
    label: {
        fontSize: ms(13), fontWeight: '600', color: '#0E1F43',
        marginBottom: vs(8),
    },
    input: {
        borderWidth: 1.5, borderColor: '#D8DCE8',
        borderRadius: ms(10),
        paddingHorizontal: scale(16), paddingVertical: vs(12),
        fontSize: ms(14), color: '#0E1F43',
        marginBottom: vs(8),
    },
    inputError: { borderColor: '#E53935' },
    errorText: { fontSize: ms(12), color: '#E53935', marginBottom: vs(10) },
    button: {
        backgroundColor: '#0E1F43',
        height: vs(48), borderRadius: ms(12),
        alignItems: 'center', justifyContent: 'center',
        marginTop: vs(16),
    },
    buttonDisabled: { backgroundColor: '#9AA5B8' },
    buttonText: { fontSize: ms(15), fontWeight: '700', color: '#fff' },
});

export default ForgotPasswordScreen;
