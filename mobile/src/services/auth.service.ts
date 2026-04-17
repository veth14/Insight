import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { User, UserRole } from '../types';
import api from './api.service';

/**
 * AuthService
 * Handles Firebase Authentication and syncs with backend
 */
class AuthService {
    /**
     * Register new user with email and password
     * Creates Firebase account and syncs user data with backend
     * Includes ROLLBACK mechanism: Deletes Firebase user if Backend sync fails.
     */
    async register(
        email: string,
        password: string,
        displayName: string,
        yearLevel: number,
        program: string,
        studentNumber: string,
        phoneNumber: string,
        registrationFormUrl?: string,
    ): Promise<User> {
        let userCredential;
        try {
            // 1. Create Firebase User
            console.log('Creating Firebase user...');
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;
            console.log('Firebase user created:', firebaseUser.uid);

            try {
                // 2. Sync with Backend
                console.log('Getting ID token...');
                const idToken = await firebaseUser.getIdToken();
                console.log('Token retrieved. Calling backend...');

                // Determine role based on year level
                let role: UserRole;
                if (yearLevel >= 1 && yearLevel <= 3) {
                    role = UserRole.STUDENT_1ST_TO_3RD;
                } else if (yearLevel === 4) {
                    role = UserRole.STUDENT_4TH;
                } else {
                    role = UserRole.ADMIN;
                }

                // Create user in backend database
                let response;
                const isLocalFile = registrationFormUrl && (registrationFormUrl.startsWith('file:') || registrationFormUrl.startsWith('content:') || registrationFormUrl.startsWith('/'));

                if (isLocalFile) {
                    // Use native fetch for multipart/form-data — axios + Content-Type: undefined
                    // causes ERR_NETWORK in React Native's XHR layer. fetch handles
                    // FormData boundaries natively and reliably on Android/iOS.
                    const form = new FormData();
                    form.append('uid', firebaseUser.uid as any);
                    form.append('email', email as any);
                    form.append('displayName', displayName as any);
                    form.append('role', role as any);
                    form.append('yearLevel', yearLevel as any);
                    form.append('program', program as any);
                    form.append('studentNumber', studentNumber as any);
                    form.append('phoneNumber', phoneNumber as any);

                    const fileName = `${studentNumber.trim()}_${Date.now()}.jpg`;
                    form.append('registrationForm', {
                        uri: registrationFormUrl as any,
                        name: fileName,
                        type: 'image/jpeg',
                    } as any);

                    const fetchRes = await fetch(
                        `${process.env.EXPO_PUBLIC_API_URL}/auth/register`,
                        {
                            method: 'POST',
                            body: form as any,
                            headers: {
                                // Authorization only — DO NOT set Content-Type,
                                // fetch sets multipart/form-data with boundary automatically
                                Authorization: `Bearer ${idToken}`,
                            },
                        }
                    );

                    const fetchData = await fetchRes.json();
                    if (!fetchRes.ok) {
                        throw new Error(fetchData.message || `Server error ${fetchRes.status}`);
                    }
                    return fetchData.user;
                } else {
                    response = await api.post('/auth/register', {
                        uid: firebaseUser.uid,
                        email,
                        displayName,
                        role,
                        yearLevel,
                        program,
                        studentNumber,
                        phoneNumber,
                        registrationFormUrl: registrationFormUrl ?? null,
                    }, {
                        headers: { Authorization: `Bearer ${idToken}` },
                    });
                }

                console.log('Backend registration successful');
                return response.data.user;

            } catch (backendError: any) {
                // 3. Rollback: Delete Firebase user if backend fails
                console.error('Backend registration failed. Rolling back Firebase user.', backendError);
                console.error('Error details:', backendError.response?.data || backendError.message);
                console.error('Error code:', backendError.code, '| Status:', backendError.response?.status);
                
                try {
                    await firebaseUser.delete();
                    console.log('Rollback successful: Firebase user deleted.');
                } catch (deleteError) {
                    console.error('CRITICAL: Failed to rollback Firebase user.', deleteError);
                }

                // Throw a user-friendly error
                if (backendError.response) {
                    // Surface server-provided message so UI can show friendly alerts
                    throw new Error(backendError.response.data.message || 'Registration failed');
                } else if (backendError.code === 'ECONNABORTED' || backendError.message?.includes('timeout')) {
                    throw new Error('Network Error: Request timed out. The server is taking too long to respond.');
                } else if (backendError.request || backendError.message === 'Network request failed') {
                    throw new Error('Network Error: Could not connect to the server. Please check your internet connection.');
                } else {
                    throw new Error(backendError.message || 'Registration failed. Please try again.');
                }
            }

        } catch (error: any) {
            console.error('Registration error:', error.message);
            throw error;
        }
    }

    /**
     * Login with email and password
     */
    async login(email: string, password: string): Promise<void> {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Logout
     */
    async logout(): Promise<void> {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }

    /**
     * Auth state change listener
     */
    onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
        return onAuthStateChanged(auth, callback);
    }
}

export default new AuthService();
