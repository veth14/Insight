import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Dimensions, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSecurity } from '../../contexts/SecurityContext';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { scale, vs, ms } from '../../utils/responsive';

const { width } = Dimensions.get('window');

const AppLockSetupScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { setupAppLock, removeAppLock, enableAppLock, appLockEnabled, biometricsEnabled, toggleBiometrics, unlockApp, hasPin } = useSecurity();

    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState<'SETTINGS' | 'PIN1' | 'PIN2' | 'BIO' | 'REMOVE' | 'VERIFY_TO_CHANGE'>(hasPin ? 'SETTINGS' : 'PIN1');
    const [useBio, setUseBio] = useState(false);
    const [error, setError] = useState(false);

    usePreventScreenCapture();

    const handlePinInput = async (val: string) => {
        let currentPin = (step === 'PIN1' || step === 'REMOVE' || step === 'VERIFY_TO_CHANGE') ? pin : confirmPin;
        const setMethod = (step === 'PIN1' || step === 'REMOVE' || step === 'VERIFY_TO_CHANGE') ? setPin : setConfirmPin;
        
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
                        // If we already have hasPin, we are just changing PIN, we can skip BIO step or ask again
                        if (hasPin) {
                            await setupAppLock(newPin, biometricsEnabled);
                            navigation.goBack();
                        } else {
                            setTimeout(() => setStep('BIO'), 200);
                        }
                    } else {
                        setError(true);
                        setTimeout(() => {
                            setConfirmPin('');
                        }, 500);
                    }
                } else if (step === 'REMOVE') {
                    handleRemove(newPin);
                } else if (step === 'VERIFY_TO_CHANGE') {
                    const isValid = await unlockApp(newPin);
                    if (isValid) {
                        setPin('');
                        setConfirmPin('');
                        setTimeout(() => setStep('PIN1'), 200);
                    } else {
                        setError(true);
                        setTimeout(() => setPin(''), 500);
                    }
                }
            }
        }
    };

    const handleRemove = async (enteredPin: string) => {
        const success = await removeAppLock(enteredPin);
        if (success) {
            setStep('SETTINGS');
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
        if (step === 'PIN1' || step === 'REMOVE' || step === 'VERIFY_TO_CHANGE') {
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

    if (step === 'SETTINGS') {
        return (
            <SafeAreaView style={[styles.container, { alignItems: 'stretch' }]} edges={['top']}>
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.backBtnSettings} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                        <Ionicons name="chevron-back" size={20} color="#0E1F43" />
                    </TouchableOpacity>
                    <Text style={styles.topBarTitle}>App Lock Settings</Text>
                    <View style={{ width: 36 }} />
                </View>
                
                <View style={styles.settingsContainer}>
                    {appLockEnabled ? (
                        <TouchableOpacity style={styles.settingRow} onPress={() => { setPin(''); setStep('REMOVE'); }}>
                            <View style={styles.settingRowLeft}>
                                <Ionicons name="lock-open-outline" size={24} color="#0E1F43" />
                                <View style={styles.settingTextCont}>
                                    <Text style={styles.settingTitle}>Turn Off App Lock</Text>
                                    <Text style={styles.settingSubtitle}>Disable PIN at startup</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.settingRow} onPress={async () => { await enableAppLock(); }}>
                            <View style={styles.settingRowLeft}>
                                <Ionicons name="lock-closed-outline" size={24} color="#0E1F43" />
                                <View style={styles.settingTextCont}>
                                    <Text style={styles.settingTitle}>Turn On App Lock</Text>
                                    <Text style={styles.settingSubtitle}>Enable PIN at startup</Text>
                                </View>
                            </View>
                            <Switch value={true} onValueChange={async () => { await enableAppLock(); }} />
                        </TouchableOpacity>
                    )}
                    
                    <View style={styles.divider} />
                    
                    <TouchableOpacity style={styles.settingRow} onPress={() => { setPin(''); setStep('VERIFY_TO_CHANGE'); }}>
                        <View style={styles.settingRowLeft}>
                            <Ionicons name="keypad-outline" size={24} color="#0E1F43" />
                            <View style={styles.settingTextCont}>
                                <Text style={styles.settingTitle}>Change PIN</Text>
                                <Text style={styles.settingSubtitle}>Set a new 4-digit PIN</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.settingRow}>
                        <View style={styles.settingRowLeft}>
                            <Ionicons name="finger-print-outline" size={24} color="#0E1F43" />
                            <View style={styles.settingTextCont}>
                                <Text style={styles.settingTitle}>Biometrics</Text>
                                <Text style={styles.settingSubtitle}>Use fingerprint / Face ID to unlock</Text>
                            </View>
                        </View>
                        <Switch
                            value={biometricsEnabled}
                            onValueChange={async (val) => {
                                const ok = await toggleBiometrics(val);
                                if (!ok && val) {
                                    Alert.alert('Failed', 'Could not enable biometrics. Make sure your device has an enrolled fingerprint/Face ID and try again.');
                                }
                            }}
                            trackColor={{ false: '#D0D8E8', true: '#0E1F43' }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>
            </SafeAreaView>
        );
    }

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

    const currentPinStr = (step === 'PIN1' || step === 'REMOVE' || step === 'VERIFY_TO_CHANGE') ? pin : confirmPin;
    const titleText = step === 'REMOVE' ? 'Enter Current PIN' : 
                      step === 'VERIFY_TO_CHANGE' ? 'Enter Current PIN to Change' :
                      (step === 'PIN1' ? 'Create PIN' : 'Confirm PIN');

    return (
        <SafeAreaView style={[styles.container, { paddingTop: 50 }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => {
                if (appLockEnabled) {
                    setStep('SETTINGS');
                } else {
                    navigation.goBack();
                }
            }}>
                <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>

            <Text style={styles.title}>{titleText}</Text>
            
            <View style={styles.pinContainer}>
                {[...Array(4)].map((_, i) => (
                    <View key={i} style={[styles.pinDot, { backgroundColor: i < currentPinStr.length ? '#4A90E2' : '#E0E0E0' }, error && styles.pinError]} />
                ))}
            </View>
            
            {error && <Text style={styles.errorText}>
                {step === 'REMOVE' || step === 'VERIFY_TO_CHANGE' ? 'Incorrect PIN' : 'PINs do not match'}
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
    },
    topBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: scale(16), paddingVertical: vs(10), backgroundColor: '#F5F7FA',
    },
    backBtnSettings: {
        width: scale(36), height: vs(36), borderRadius: ms(10),
        backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#E0E5F0',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
    },
    topBarTitle: { fontSize: ms(16), fontWeight: '800', color: '#0E1F43' },
    settingsContainer: {
        backgroundColor: '#fff',
        marginHorizontal: scale(16),
        marginTop: vs(24),
        borderRadius: ms(16),
        padding: scale(8),
        borderWidth: 1, borderColor: '#F0F2F8',
    },
    settingRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: vs(12), paddingHorizontal: scale(8),
    },
    settingRowLeft: {
        flexDirection: 'row', alignItems: 'center', flex: 1,
    },
    settingTextCont: {
        marginLeft: scale(12), flex: 1,
    },
    settingTitle: {
        fontSize: ms(14), fontWeight: '700', color: '#1A2744',
    },
    settingSubtitle: {
        fontSize: ms(11), color: '#888', marginTop: vs(2),
    },
    divider: {
        height: 1, backgroundColor: '#F0F2F8', marginHorizontal: scale(8),
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