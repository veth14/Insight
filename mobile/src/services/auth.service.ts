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
        yearLevel: number
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
                const response = await api.post('/auth/register', {
                    uid: firebaseUser.uid,
                    email,
                    displayName,
                    role,
                    yearLevel,
                });

                console.log('Backend registration successful');
                return response.data.user;

            } catch (backendError: any) {
                // 3. Rollback: Delete Firebase user if backend fails
                console.error('Backend registration failed. Rolling back Firebase user.', backendError);
                console.error('Error details:', backendError.response?.data || backendError.message);
                
                try {
                    await firebaseUser.delete();
                    console.log('Rollback successful: Firebase user deleted.');
                } catch (deleteError) {
                    console.error('CRITICAL: Failed to rollback Firebase user.', deleteError);
                }

                // Throw a user-friendly error
                if (backendError.response) {
                    throw new Error(`Server Error: ${backendError.response.data.message || 'Registration failed'}`);
                } else if (backendError.request) {
                    throw new Error('Network Error: Could not connect to the server. Please check your internet connection.');
                } else {
                    throw new Error('Registration failed. Please try again.');
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
