import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, Dimensions } from 'react-native';
import { useSecurity } from '../../contexts/SecurityContext';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';

interface AppLockScreenProps {
    onUnlock: () => void;
}

const { width } = Dimensions.get('window');

const AppLockScreen: React.FC<AppLockScreenProps> = ({ onUnlock }) => {
    const { unlockApp, unlockWithBiometrics, biometricsEnabled } = useSecurity();
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        // Attempt biometrics automatically upon load if enabled
        if (biometricsEnabled) {
            handleBiometrics();
        }
    }, [biometricsEnabled]);

    const handleBiometrics = async () => {
        const success = await unlockWithBiometrics();
        if (success) {
            onUnlock();
        } else {
            setError(true);
        }
    };

    const handlePinInput = async (val: string) => {
        if (pin.length < 4) {
            const newPin = pin + val;
            setPin(newPin);
            setError(false);
            
            if (newPin.length === 4) {
                // Try unlocking
                const success = await unlockApp(newPin);
                if (success) {
                    onUnlock();
                } else {
                    setError(true);
                    setTimeout(() => setPin(''), 500); // Clear on fail
                }
            }
        }
    };

    const deletePin = () => {
        setPin(pin.slice(0, -1));
        setError(false);
    };

    const renderDialPad = () => {
        const buttons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'delete'];
        
        return buttons.map((btn, index) => {
            if (btn === 'bio') {
                return (
                    <TouchableOpacity key={index} style={styles.dialButton} onPress={handleBiometrics} disabled={!biometricsEnabled}>
                        {biometricsEnabled && <Ionicons name="finger-print" size={32} color="#4A90E2" />}
                    </TouchableOpacity>
                );
            }
            if (btn === 'delete') {
                return (
                    <TouchableOpacity key={index} style={styles.dialButton} onPress={deletePin}>
                        <Ionicons name="backspace-outline" size={32} color="#333" />
                    </TouchableOpacity>
                );
            }
            return (
                <TouchableOpacity key={index} style={styles.dialButton} onPress={() => handlePinInput(btn)}>
                    <Text style={styles.dialText}>{btn}</Text>
                </TouchableOpacity>
            );
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Enter PIN</Text>
            
            <View style={styles.pinContainer}>
                {[...Array(4)].map((_, i) => (
                    <View key={i} style={[styles.pinDot, { backgroundColor: i < pin.length ? '#4A90E2' : '#E0E0E0' }, error && styles.pinError]} />
                ))}
            </View>
            
            {error && <Text style={styles.errorText}>Incorrect PIN</Text>}

            <View style={styles.dialPadContainer}>
                {renderDialPad()}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 40,
    },
    pinContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: 150,
        marginBottom: 20,
    },
    pinDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    pinError: {
        backgroundColor: '#FF3B30',
    },
    errorText: {
        color: '#FF3B30',
        marginBottom: 20,
        fontSize: 16,
    },
    dialPadContainer: {
        width: width * 0.8,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    dialButton: {
        width: '30%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderRadius: 50,
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    dialText: {
        fontSize: 28,
        fontWeight: '500',
        color: '#333',
    },
});

export default AppLockScreen;