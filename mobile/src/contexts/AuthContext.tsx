import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { User as FirebaseUser, signInAnonymously } from 'firebase/auth';
import { User, UserRole } from '../types';
import authService from '../services/auth.service';
import api from '../services/api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';

// Public axios instance (no auth token)
const PUBLIC_API_BASE_URL = 'https://insight-production-77f2.up.railway.app/api';

console.log('[AuthContext] Public API URL:', PUBLIC_API_BASE_URL);

const publicApi = axios.create({
    baseURL: PUBLIC_API_BASE_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

const USER_STORAGE_KEY = '@insight_user_data';

/**
 * Auth Context Type
 */
interface AuthContextType {
    user: User | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    isOffline: boolean;
    twoFactorPending: boolean;
    pendingOTPEmail: string | null;
    login: (email: string, password: string) => Promise<boolean>;
    verifyOTP: (email: string, otp: string) => Promise<void>;
    resendOTP: (email: string) => Promise<void>;
    sendResetOTP: (email: string) => Promise<void>;
    verifyResetOTP: (email: string, otp: string) => Promise<string>;
    resetPassword: (email: string, resetToken: string, newPassword: string) => Promise<void>;
    register: (email: string, password: string, displayName: string, yearLevel: number, program: string, studentNumber: string, phoneNumber: string, registrationFormUrl?: string) => Promise<void>;
    continueAsGuest: () => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<User | undefined>;
}

import { Alert } from 'react-native';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Component
 * Manages authentication state across the app
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOffline, setIsOffline] = useState(false);
    const [twoFactorPending, setTwoFactorPending] = useState(false);
    const [pendingOTPEmail, setPendingOTPEmail] = useState<string | null>(null);

    /**
     * Ref used to block onAuthStateChanged from setting user state
     * during the 2FA window (avoids race condition with async setState)
     */
    const twoFactorPendingRef = useRef(false);

    useEffect(() => {
        // Listen to Firebase auth state changes
        const unsubscribe = authService.onAuthStateChanged(async (fbUser) => {
            setFirebaseUser(fbUser);

            if (fbUser) {
                // Handle Guest Login explicitly
                if (fbUser.isAnonymous) {
                    const guestUser: User = {
                        uid: fbUser.uid,
                        email: 'guest@local.insight',
                        studentNumber: 'N/A',
                        displayName: 'Guest',
                        phoneNumber: 'N/A',
                        role: UserRole.GUEST,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                    setUser(guestUser);
                    setLoading(false);
                    return;
                }

                // If 2FA is pending, hold off — verifyOTP() will complete the login
                if (twoFactorPendingRef.current) {
                    setLoading(false);
                    return;
                }

                // User is signed in, fetch full user data from backend
                try {
                    const idToken = await fbUser.getIdToken();
                    const response = await api.get('/auth/me', {
                        headers: {
                            Authorization: `Bearer ${idToken}`
                        }
                    });
                    
                    const userData = response.data.user;
                    setUser(userData);
                    setIsOffline(false);
                    
                    // Cache user data for offline access
                    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
                    
                } catch (error: any) {
                    // Check if error is network related (offline)
                    const isNetworkError = !error.response || error.message === 'Network Error' || error.code === 'ECONNABORTED';
                    
                    if (isNetworkError) {
                        setIsOffline(true);
                        console.log('[AuthContext] Network error, attempting to load cached user data...');
                        
                        // Try to load cached user
                        const cachedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
                        if (cachedUser) {
                            try {
                                const parsedUser = JSON.parse(cachedUser);
                                // Verify it's the same user as the Firebase one
                                if (parsedUser.uid === fbUser.uid) {
                                    console.log('[AuthContext] Restored user from cache for offline access');
                                    setUser(parsedUser);
                                } else {
                                    setUser(null);
                                }
                            } catch (e) {
                                setUser(null);
                            }
                        } else {
                            setUser(null);
                        }
                    } else if (error.response && error.response.status === 404) {
                        // Handle 404 Not Found (User exists in Firebase but not Backend)
                        const creationTime = fbUser.metadata.creationTime 
                            ? new Date(fbUser.metadata.creationTime).getTime() 
                            : 0;
                        const isNewUser = (Date.now() - creationTime) < 10000; // 10s buffer

                        if (isNewUser) {
                             console.log('User is new, waiting for backend registration to complete...');
                        } else {
                            console.error('Error fetching user data:', error);
                            Alert.alert(
                                "Account Error", 
                                "Your user profile was not found. Please contact support or try registering again with a different email."
                            );
                            authService.logout();
                        }
                        setUser(null);
                    } else {
                        console.error('Error fetching user data:', error);
                        setUser(null);
                    }
                }
            } else {
                // User is signed out
                setUser(null);
                setIsOffline(false);
                // We keep the cache so they can log back in offline? 
                // No, for security if they logout we should probably clear it.
                await AsyncStorage.removeItem(USER_STORAGE_KEY);
            }

            setLoading(false);
        });

        // Cleanup subscription
        return () => unsubscribe();
    }, []);

    /**
     * Login: Firebase sign-in → send OTP → set 2FA pending
     * Does NOT set user state — that happens after OTP verification.
     */
    const login = async (email: string, password: string): Promise<boolean> => {
        // Set ref BEFORE Firebase call to block onAuthStateChanged from auto-completing login
        twoFactorPendingRef.current = true;
        setTwoFactorPending(true);
        setPendingOTPEmail(email);

        try {
            await authService.login(email, password);

            // Firebase login succeeded — get the token and send OTP
            const token = await auth.currentUser?.getIdToken();

            const response = await api.post(
                '/auth/send-otp',
                { email },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log(`[AuthContext] OTP check response:`, response.data);

            if (response.data.skipped) {
                console.log('[AuthContext] OTP skipped by server, completing login...');
                // OTP was skipped — complete login immediately
                twoFactorPendingRef.current = false;
                setTwoFactorPending(false);
                setPendingOTPEmail(null);

                const profileRes = await api.get('/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('[AuthContext] Profile fetched after skip:', profileRes.data.user.email);
                const userData = profileRes.data.user;
                setUser(userData);
                await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
                return false; // 2FA NOT required
            }

            console.log('[AuthContext] 2FA required by server');
            return true; // 2FA required
        } catch (error: any) {
            console.error('[AuthContext] Login error details:', error.response?.data || error.message);
            // Log full error details for debugging
            console.error('[Login Error]', error.response?.data || error.message);
            
            // Reset 2FA state on error so the listener resumes normally
            twoFactorPendingRef.current = false;
            setTwoFactorPending(false);
            setPendingOTPEmail(null);
            
            // Also sign out from Firebase so there's no dangling auth state
            try { await authService.logout(); } catch (_) {}
            
            // Customize the error message to be more helpful
            if (!error.response) {
                error.message = 'Network Error: Cannot reach server. Please check your internet connection or Railway server status.';
            } else if (error.response.data?.message) {
                error.message = error.response.data.message;
            }
            
            throw error;
        }
    };

    /**
     * Verify OTP: validates code with backend, then completes login by fetching user profile.
     */
    const verifyOTP = async (email: string, otp: string) => {
        const token = await auth.currentUser?.getIdToken();

        // This throws on invalid OTP — let the screen handle the error
        await api.post(
            '/auth/verify-otp',
            { email, otp },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        // OTP verified — clear 2FA pending state first so navigator can proceed
        twoFactorPendingRef.current = false;
        setTwoFactorPending(false);
        setPendingOTPEmail(null);

        // Then fetch and set user to complete login
        const response = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const userData = response.data.user;
        setUser(userData);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    };

    /**
     * Resend OTP: sends a fresh OTP to the given email.
     */
    const resendOTP = async (email: string) => {
        const token = await auth.currentUser?.getIdToken();

        await api.post(
            '/auth/send-otp',
            { email },
            { headers: { Authorization: `Bearer ${token}` } }
        );
    };

    // ── Forgot Password ───────────────────────────────────────────────────────
    const sendResetOTP = async (email: string): Promise<void> => {
        console.log(`[AuthContext] Sending Reset OTP to: ${email}`);
        console.log(`[AuthContext] Using Base URL: ${publicApi.defaults.baseURL}`);
        try {
            const response = await publicApi.post('/auth/forgot-password', { email });
            console.log(`[AuthContext] Reset OTP Success:`, response.data);
        } catch (error: any) {
            console.error(`[AuthContext] Reset OTP Error:`, error.message);
            if (error.response) {
                console.error(`[AuthContext] Error Data:`, error.response.data);
                console.error(`[AuthContext] Error Status:`, error.response.status);
            }
            throw error;
        }
    };

    const verifyResetOTP = async (email: string, otp: string): Promise<string> => {
        const res = await publicApi.post('/auth/verify-reset-otp', { email, otp });
        return res.data.resetToken as string;
    };

    const resetPassword = async (email: string, resetToken: string, newPassword: string): Promise<void> => {
        await publicApi.post('/auth/reset-password', { email, resetToken, newPassword });
    };

    const register = async (
        email: string, password: string, displayName: string,
        yearLevel: number, program: string, studentNumber: string,
        phoneNumber: string, registrationFormUrl?: string,
    ) => {
        // Do not set global loading here to prevent navigation reset
        try {
            const registeredUser = await authService.register(email, password, displayName, yearLevel, program, studentNumber, phoneNumber, registrationFormUrl);
            setUser(registeredUser);
            await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(registeredUser));
        } catch (error) {
            throw error;
        }
    };

    const refreshUser = async () => {
        const fbUser = auth.currentUser;
        if (!fbUser) return undefined;
        
        if (fbUser.isAnonymous) {
            return user ?? undefined; // Just return current guest state
        }
        
        const idToken = await fbUser.getIdToken();
        const response = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        const userData = response.data.user;
        setUser(userData);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        return userData;
    };

    /**
     * Continue as Guest: signs in anonymously to allow browsing capabilities.
     */
    const continueAsGuest = async () => {
        setLoading(true);
        try {
            await signInAnonymously(auth);
            // setFirebaseUser and setUser will be triggered by onAuthStateChanged
        } catch (error) {
            console.error('Guest login failed:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await authService.logout();
            setUser(null);
            setFirebaseUser(null);
            setIsOffline(false);
            twoFactorPendingRef.current = false;
            setTwoFactorPending(false);
            setPendingOTPEmail(null);
            await AsyncStorage.removeItem(USER_STORAGE_KEY);
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, firebaseUser, loading, isOffline, twoFactorPending, pendingOTPEmail, login, verifyOTP, resendOTP, sendResetOTP, verifyResetOTP, resetPassword, register, continueAsGuest, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * useAuth Hook
 * Access authentication context
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
