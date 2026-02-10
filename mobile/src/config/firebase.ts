import { initializeApp } from 'firebase/app';
import {
    getAuth,
    initializeAuth
} from 'firebase/auth';
// @ts-ignore
import { getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Firebase Configuration
 * QCU Research App Project
 */
const firebaseConfig = {
    apiKey: "AIzaSyDnhM2aC3LyCdaMni9beyhBWNt0lTLvKOA",
    authDomain: "qcuresearchapp.firebaseapp.com",
    projectId: "qcuresearchapp",
    storageBucket: "qcuresearchapp.appspot.com",
    messagingSenderId: "261576043973",
    appId: "1:261576043973:web:92fc27979e034cb3c42fac"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for React Native
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

export { auth };
export default app;
