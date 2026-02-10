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
     */
    async register(
        email: string,
        password: string,
        displayName: string,
        yearLevel: number
    ): Promise<User> {
        try {
            // Create Firebase user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            // Get Firebase ID token for backend authentication
            const idToken = await firebaseUser.getIdToken();

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
                yearLevel
            }, {
                headers: {
                    Authorization: `Bearer ${idToken}`
                }
            });

            return response.data.user;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || error.message);
        }
    }

    /**
     * Sign in with email and password
     */
    async login(email: string, password: string): Promise<User> {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;
            const idToken = await firebaseUser.getIdToken();

            // Fetch user data from backend
            const response = await api.get('/auth/me', {
                headers: {
                    Authorization: `Bearer ${idToken}`
                }
            });

            return response.data.user;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || error.message);
        }
    }

    /**
     * Sign out current user
     */
    async logout(): Promise<void> {
        try {
            await signOut(auth);
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    /**
     * Get current Firebase user
     */
    getCurrentFirebaseUser(): FirebaseUser | null {
        return auth.currentUser;
    }

    /**
     * Get Firebase ID token for API requests
     */
    async getIdToken(): Promise<string | null> {
        const user = this.getCurrentFirebaseUser();
        if (!user) return null;
        return await user.getIdToken();
    }

    /**
     * Listen to authentication state changes
     */
    onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
        return onAuthStateChanged(auth, callback);
    }
}

export default new AuthService();
