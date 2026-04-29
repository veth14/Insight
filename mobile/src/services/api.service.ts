import axios from 'axios';
import Constants from 'expo-constants';
import { auth } from '../config/firebase';

/**
 * Axios API client instance
 * Base URL loaded from environment variables
 */
// Use the production Railway URL even in development
// Priority: Environment Variable -> Hardcoded Production Fallback
let baseURL = process.env.EXPO_PUBLIC_API_URL || 'https://insight-production-77f2.up.railway.app/api';

if (__DEV__) {
    console.log('[API] Connecting to:', baseURL);
}


const api = axios.create({
    baseURL,
    timeout: 60000, // 60s timeout for cloud hosting cold-starts
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request interceptor
 * Automatically adds Firebase ID token to requests
 */
api.interceptors.request.use(
    async (config) => {
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response interceptor
 * Handles common error responses
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;

            if (status === 401) {
                // Unauthorized - token expired or invalid
                // Could trigger logout here
                console.error('Unauthorized request');
            } else if (status === 403) {
                // Forbidden - user doesn't have permission
                console.error('Forbidden access');
            } else if (status >= 500) {
                // Server error
                console.error('Server error:', data.message);
            }
        } else if (error.request) {
            // Request made but no response received
            console.error('Network error - no response received');
        }

        return Promise.reject(error);
    }
);

export default api;
