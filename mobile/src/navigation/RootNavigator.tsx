import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useSecurity } from '../contexts/SecurityContext'; // Added useSecurity
import { useOffline } from '../contexts/OfflineContext';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import AdminStack from './AdminStack';
import AppLockScreen from '../screens/auth/AppLockScreen'; // Added AppLockScreen
import DownloadsScreen from '../screens/main/DownloadsScreen';
import { UserRole } from '../types';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const OfflineStackNavigator = createNativeStackNavigator<{ Downloads: undefined }>();

const OfflineStack = () => (
    <OfflineStackNavigator.Navigator>
        <OfflineStackNavigator.Screen name="Downloads" component={DownloadsScreen} options={{ headerShown: false }} />
    </OfflineStackNavigator.Navigator>
);

/**
 * RootNavigator Component
 * Main navigation container that switches between Auth and Main flows
 */
const RootNavigator: React.FC = () => {
    const { user, loading } = useAuth();
    const { isLocked, isLoadingSecurity } = useSecurity(); // Get isLocked state
    const { isOffline } = useOffline();
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

    useEffect(() => {
        const checkOnboarding = async () => {
            try {
                const val = await AsyncStorage.getItem('hasSeenOnboarding');    
                setHasSeenOnboarding(val === 'true');
            } catch (e) {
                setHasSeenOnboarding(false);
            }
        };
        checkOnboarding();
    }, []);

    // Show loading spinner while checking auth state, security state, or onboarding flag        
    if (loading || isLoadingSecurity || hasSeenOnboarding === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (user && isLocked) {
        return <AppLockScreen onUnlock={() => {}} />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {isOffline && !user ? (
                    <Stack.Screen name="Offline" component={OfflineStack} />
                ) : user ? (
                    user.role === UserRole.ADMIN || user.role === UserRole.FACULTY ? (
                        // Admin/Faculty — show admin dashboard
                        <Stack.Screen name="Admin" component={AdminStack} />
                    ) : (
                        // All students — show main app
                        // Upload tab is hidden for non-approved 4th year students (see MainTabs)
                        <Stack.Screen name="Main" component={MainTabs} />
                    )
                ) : !hasSeenOnboarding ? (
                    // Not authenticated, first launch — show onboarding
                    <Stack.Screen name="Auth" component={AuthStack} />
                ) : (
                    // Not authenticated, returning user — go straight to login
                    <Stack.Screen name="Auth">
                        {() => <AuthStack initialRouteName="Login" />}
                    </Stack.Screen>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default RootNavigator;
