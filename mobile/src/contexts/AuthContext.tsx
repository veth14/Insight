import React, { createContext, useState, useEffect, useContext } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '../types';
import authService from '../services/auth.service';
import api from '../services/api.service';

/**
 * Auth Context Type
 */
interface AuthContextType {
    user: User | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, displayName: string, yearLevel: number, program: string) => Promise<void>;
    logout: () => Promise<void>;
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

    useEffect(() => {
        // Listen to Firebase auth state changes
        const unsubscribe = authService.onAuthStateChanged(async (fbUser) => {
            setFirebaseUser(fbUser);

            if (fbUser) {
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
                             // Don't log error, don't logout. 
                             // The register() function will handle setting the user state.
                        } else {
                            console.error('Error fetching user data:', error);
                            Alert.alert(
                                "Account Error", 
                                "Your user profile was not found. Please contact support or try registering again with a different email."
                            );
                            // Sign out to prevent stuck state
                            authService.logout();
                        }
                    } else {
                        // For other errors, log them
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

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            await authService.login(email, password);
             // User state is updated via the onAuthStateChanged listener
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const register = async (
        email: string,
        password: string,
        displayName: string,
        yearLevel: number,
        program: string
    ) => {
        setLoading(true);
        try {
            const user = await authService.register(email, password, displayName, yearLevel, program); // Pass program
            setUser(user);
        } catch (error) {
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
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, firebaseUser, loading, login, register, logout }}>
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
