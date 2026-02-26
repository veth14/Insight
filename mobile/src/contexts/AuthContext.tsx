import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '../types';
import authService from '../services/auth.service';
import api from '../services/api.service';
import { auth } from '../config/firebase';

// Public axios instance (no auth token)
const publicApi = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

/**
 * Auth Context Type
 */
interface AuthContextType {
    user: User | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    twoFactorPending: boolean;
    pendingOTPEmail: string | null;
    login: (email: string, password: string) => Promise<void>;
    verifyOTP: (email: string, otp: string) => Promise<void>;
    resendOTP: (email: string) => Promise<void>;
    sendResetOTP: (email: string) => Promise<void>;
    verifyResetOTP: (email: string, otp: string) => Promise<string>;
    resetPassword: (email: string, resetToken: string, newPassword: string) => Promise<void>;
    register: (email: string, password: string, displayName: string, yearLevel: number, program: string, studentNumber: string, phoneNumber: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
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
                    setUser(response.data.user);
                } catch (error: any) {
                    // Handle 404 Not Found (User exists in Firebase but not Backend)
                    if (error.response && error.response.status === 404) {
                        // Check if user was just created (Race condition handling)
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
                    } else {
                        console.error('Error fetching user data:', error);
                    }
                    setUser(null);
                }
            } else {
                // User is signed out
                setUser(null);
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
    const login = async (email: string, password: string) => {
        // Set ref BEFORE Firebase call to block onAuthStateChanged from auto-completing login
        twoFactorPendingRef.current = true;
        setTwoFactorPending(true);
        setPendingOTPEmail(email);

        try {
            await authService.login(email, password);

            // Firebase login succeeded — get the token and send OTP
            const token = await auth.currentUser?.getIdToken();

            await api.post(
                '/auth/send-otp',
                { email },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (error) {
            // Reset 2FA state on error so the listener resumes normally
            twoFactorPendingRef.current = false;
            setTwoFactorPending(false);
            setPendingOTPEmail(null);
            // Also sign out from Firebase so there's no dangling auth state
            try { await authService.logout(); } catch (_) {}
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
        setUser(response.data.user);
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
        await publicApi.post('/auth/forgot-password', { email });
    };

    const verifyResetOTP = async (email: string, otp: string): Promise<string> => {
        const res = await publicApi.post('/auth/verify-reset-otp', { email, otp });
        return res.data.resetToken as string;
    };

    const resetPassword = async (email: string, resetToken: string, newPassword: string): Promise<void> => {
        await publicApi.post('/auth/reset-password', { email, resetToken, newPassword });
    };

    const register = async (
        email: string,
        password: string,
        displayName: string,
        yearLevel: number,
        program: string,
        studentNumber: string,
        phoneNumber: string
    ) => {
        // Do not set global loading here to prevent navigation reset
        try {
            const user = await authService.register(email, password, displayName, yearLevel, program, studentNumber, phoneNumber);
            setUser(user);
        } catch (error) {
            throw error;
        }
    };

    const refreshUser = async () => {
        const fbUser = auth.currentUser;
        if (!fbUser) return;
        const idToken = await fbUser.getIdToken();
        const response = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${idToken}` },
        });
        setUser(response.data.user);
    };

    const logout = async () => {
        setLoading(true);
        try {
            await authService.logout();
            setUser(null);
            setFirebaseUser(null);
            twoFactorPendingRef.current = false;
            setTwoFactorPending(false);
            setPendingOTPEmail(null);
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, firebaseUser, loading, twoFactorPending, pendingOTPEmail, login, verifyOTP, resendOTP, sendResetOTP, verifyResetOTP, resetPassword, register, logout, refreshUser }}>
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
