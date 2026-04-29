import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from './AuthContext';
import { AppState, AppStateStatus, Alert } from 'react-native';

interface SecurityContextType {
    isLocked: boolean;
    isLoadingSecurity: boolean;
    appLockEnabled: boolean;
    biometricsEnabled: boolean;
    hasPin: boolean;
    unlockApp: (pin: string) => Promise<boolean>;
    unlockWithBiometrics: () => Promise<boolean>;
    setupAppLock: (pin: string, useBiometrics: boolean) => Promise<void>;
    removeAppLock: (pin: string) => Promise<boolean>;
    toggleBiometrics: (enabled: boolean) => Promise<boolean>;
    enableAppLock: () => Promise<void>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading: isAuthLoading } = useAuth();
    const [isLocked, setIsLocked] = useState(false);
    const [isLoadingSecurity, setIsLoadingSecurity] = useState(true);
    const [appLockEnabled, setAppLockEnabled] = useState(false);
    const [biometricsEnabled, setBiometricsEnabled] = useState(false);
    const [hasPin, setHasPin] = useState(false);

    const getPinKey = () => `app_pin_${user?.uid}`;
    const getPinEnabledKey = () => `app_lock_enabled_${user?.uid}`;
    const getBioKey = () => `app_bio_${user?.uid}`;

    // Load initial lock state when user changes
    useEffect(() => {
        const loadSecuritySettings = async () => {
            if (isAuthLoading) {
                setIsLoadingSecurity(true);
                return;
            }

            setIsLoadingSecurity(true); // Always set to true when re-evaluating

            if (!user) {
                setIsLocked(false);
                setAppLockEnabled(false);
                setBiometricsEnabled(false);
                setHasPin(false);
                setIsLoadingSecurity(false);
                return;
            }

            try {
                const savedPin = await SecureStore.getItemAsync(getPinKey());
                const isEnabled = await SecureStore.getItemAsync(getPinEnabledKey());
                const savedBio = await SecureStore.getItemAsync(getBioKey());

                if (savedPin) {
                    setHasPin(true);
                    
                    // If previously not explicitly set, let's treat existing savedPin as enabled to migrate old users
                    if (isEnabled === 'true' || isEnabled === null) {
                        setAppLockEnabled(true);
                        setIsLocked(true); // Lock the app when first loaded and PIN exists and enabled
                    } else {
                        setAppLockEnabled(false);
                        setIsLocked(false);
                    }
                } else {
                    setHasPin(false);
                    setAppLockEnabled(false);
                    setIsLocked(false);
                }
                
                if (savedBio === 'true') {
                    setBiometricsEnabled(true);
                }
            } catch (e) {
                console.error("Failed to load security settings", e);
            } finally {
                setIsLoadingSecurity(false);
            }
        };
        loadSecuritySettings();
    }, [user, isAuthLoading]);

    // Handle App Background/Foreground state to re-lock
    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (appLockEnabled && nextAppState === 'background') {
                // Instantly lock when going to background
                setIsLocked(true);
            }
        };
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, [appLockEnabled]);

    const unlockApp = async (pinInput: string): Promise<boolean> => {
        const savedPin = await SecureStore.getItemAsync(getPinKey());
        if (savedPin === pinInput) {
            setIsLocked(false);
            return true;
        }
        return false;
    };

    const unlockWithBiometrics = async (): Promise<boolean> => {
        if (!biometricsEnabled) return false;
        
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            
            if (!hasHardware) {
                Alert.alert("Hardware Not Found", "This device does not support biometric authentication.");
                return false;
            }

            if (!isEnrolled) {
                Alert.alert("Biometrics Not Enrolled", "Please enroll a fingerprint or Face ID in your device settings (or Emulator extended controls) to use this feature.");
                return false;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Unlock Insight App',
                cancelLabel: 'Cancel',
                disableDeviceFallback: true,
            });

            if (result.success) {
                setIsLocked(false);
                return true;
            }
        } catch (e) {
            console.error("Biometrics failed", e);
        }
        return false;
    };

    const setupAppLock = async (pin: string, useBiometrics: boolean) => {
        if (!user) return;
        
        await SecureStore.setItemAsync(getPinKey(), pin);
        await SecureStore.setItemAsync(getPinEnabledKey(), 'true');
        await SecureStore.setItemAsync(getBioKey(), useBiometrics ? 'true' : 'false');
        
        setAppLockEnabled(true);
        setBiometricsEnabled(useBiometrics);
        setHasPin(true);
        setIsLocked(false); // Automatically unlocked upon setup
    };

    const removeAppLock = async (pin: string): Promise<boolean> => {
        if (!user) return false;
        
        // Verify PIN first before allowing removal
        const savedPin = await SecureStore.getItemAsync(getPinKey());
        if (savedPin === pin) {
            // We only disable the lock, we do NOT delete the PIN!
            await SecureStore.setItemAsync(getPinEnabledKey(), 'false');
            
            setAppLockEnabled(false);
            // We keep biometrics enabled state so if they turn it back on, it remembers? 
            // Or maybe biometrics should only work when app lock is on.
            // But we don't delete the bio key.
            setIsLocked(false);
            return true;
        }
        return false;
    };

    const enableAppLock = async () => {
        if (!user) return;
        await SecureStore.setItemAsync(getPinEnabledKey(), 'true');
        setAppLockEnabled(true);
    };

    const toggleBiometrics = async (enabled: boolean): Promise<boolean> => {
        if (!user) return false;

        const pin = await SecureStore.getItemAsync(getPinKey());
        if (!pin) {
            // Cannot enable biometrics without a PIN set
            return false;
        }

        try {
            await SecureStore.setItemAsync(getBioKey(), enabled ? 'true' : 'false');
            setBiometricsEnabled(enabled);
            return true;
        } catch (e) {
            console.error('Failed to toggle biometrics', e);
            return false;
        }
    };

    return (
        <SecurityContext.Provider value={{
            isLocked,
            isLoadingSecurity,
            appLockEnabled,
            biometricsEnabled,
            hasPin,
            unlockApp,
            unlockWithBiometrics,
            setupAppLock,
            removeAppLock,
            toggleBiometrics,
            enableAppLock
        }}>
            {children}
        </SecurityContext.Provider>
    );
};

export const useSecurity = () => {
    const context = useContext(SecurityContext);
    if (context === undefined) {
        throw new Error('useSecurity must be used within a SecurityProvider');
    }
    return context;
};
