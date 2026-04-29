import axios from 'axios';
import Constants from 'expo-constants';
import { auth } from '../config/firebase';

/**
 * Axios API client instance
 * Base URL forced to Railway Production
 */
const baseURL = 'https://insight-production-77f2.up.railway.app/api';

console.log('[API] Connecting to:', baseURL);

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
            console.error('[API Error Response]', { status, data, url: error.config?.url });

            if (status === 401) {
                console.error('Unauthorized request');
            } else if (status === 403) {
                console.error('Forbidden access');
            } else if (status >= 500) {
                console.error('Server error:', data?.message);
            }
        } else if (error.request) {
            // Request made but no response received
            console.error('[API Network Error] No response received from:', baseURL + (error.config?.url || ''));
        } else {
            console.error('[API Error]', error.message);
        }

        return Promise.reject(error);
    }
);

export default api;
