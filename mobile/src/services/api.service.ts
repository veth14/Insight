import axios from 'axios';
import authService from './auth.service';

/**
 * Axios API client instance
 * Base URL loaded from environment variables
 */
const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
    timeout: 10000,
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
        const token = await authService.getIdToken();
        if (token) {
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
