import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { SecurityProvider } from './src/contexts/SecurityContext';
import RootNavigator from './src/navigation/RootNavigator';

/**
 * Main App Component
 * Root component that sets up providers and navigation
 */
export default function App() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <SecurityProvider>
                    <RootNavigator />
                    <StatusBar style="auto" />
                </SecurityProvider>
            </AuthProvider>
        </SafeAreaProvider>
    );
}
