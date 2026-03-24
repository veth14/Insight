import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSecurity } from '../../contexts/SecurityContext';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const AppLockSetupScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { setupAppLock, removeAppLock, appLockEnabled } = useSecurity();

    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState<'PIN1' | 'PIN2' | 'BIO' | 'REMOVE'>(appLockEnabled ? 'REMOVE' : 'PIN1');
    const [useBio, setUseBio] = useState(false);
    const [error, setError] = useState(false);

    const handlePinInput = (val: string) => {
        let currentPin = step === 'PIN1' || step === 'REMOVE' ? pin : confirmPin;
        const setMethod = step === 'PIN1' || step === 'REMOVE' ? setPin : setConfirmPin;
        
        if (currentPin.length < 4) {
            const newPin = currentPin + val;
            setMethod(newPin);
            setError(false);
            
            if (newPin.length === 4) {
                if (step === 'PIN1') {
                    // Next step
                    setTimeout(() => setStep('PIN2'), 200);
                } else if (step === 'PIN2') {
                    // Verify match
                    if (newPin === pin) {
                        setTimeout(() => setStep('BIO'), 200);
                    } else {
                        setError(true);
                        setTimeout(() => {
                            setConfirmPin('');
                        }, 500);
                    }
                } else if (step === 'REMOVE') {
                    handleRemove(newPin);
                }
            }
        }
    };

    const handleRemove = async (enteredPin: string) => {
        const success = await removeAppLock(enteredPin);
        if (success) {
            navigation.goBack();
        } else {
            setError(true);
            setTimeout(() => setPin(''), 500);
        }
    };

    const handleSetupComplete = async () => {
        await setupAppLock(pin, useBio);
        navigation.goBack();
    };

    const deletePin = () => {
        if (step === 'PIN1' || step === 'REMOVE') {
            setPin(pin.slice(0, -1));
        } else {
            setConfirmPin(confirmPin.slice(0, -1));
        }
        setError(false);
    };

    const renderDialPad = () => {
        const buttons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'];
        
        return buttons.map((btn, index) => {
            if (btn === '') return <View key={index} style={styles.dialButtonEmpty} />;
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

    if (step === 'BIO') {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.title}>Enable Biometrics?</Text>
                <Text style={styles.subTitle}>You can also unlock the app using your Fingerprint or FaceID.</Text>
                
                <View style={styles.bioRow}>
                    <Text style={styles.bioLabel}>Use Biometrics</Text>
                    <Switch value={useBio} onValueChange={setUseBio} />
                </View>

                <TouchableOpacity style={styles.finishBtn} onPress={handleSetupComplete}>
                    <Text style={styles.finishBtnText}>Finish Setup</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const currentPinStr = step === 'PIN1' || step === 'REMOVE' ? pin : confirmPin;
    const titleText = step === 'REMOVE' ? 'Enter Current PIN' : (step === 'PIN1' ? 'Create PIN' : 'Confirm PIN');

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>

            <Text style={styles.title}>{titleText}</Text>
            
            <View style={styles.pinContainer}>
                {[...Array(4)].map((_, i) => (
                    <View key={i} style={[styles.pinDot, { backgroundColor: i < currentPinStr.length ? '#4A90E2' : '#E0E0E0' }, error && styles.pinError]} />
                ))}
            </View>
            
            {error && <Text style={styles.errorText}>
                {step === 'REMOVE' ? 'Incorrect PIN' : 'PINs do not match'}
            </Text>}

            <View style={styles.dialPadContainer}>
                {renderDialPad()}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        alignItems: 'center',
        paddingTop: 50,
    },
    backBtn: {
        position: 'absolute',
        top: 50,
        right: 20,
        padding: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subTitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 40,
        marginBottom: 40,
    },
    pinContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: 150,
        marginBottom: 20,
        marginTop: 30,
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
        marginTop: 'auto',
        marginBottom: 50,
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
    dialButtonEmpty: {
        width: '30%',
        aspectRatio: 1,
        marginBottom: 15,
    },
    dialText: {
        fontSize: 28,
        fontWeight: '500',
        color: '#333',
    },
    bioRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '80%',
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 12,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    bioLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    finishBtn: {
        backgroundColor: '#4A90E2',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
    },
    finishBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default AppLockSetupScreen;