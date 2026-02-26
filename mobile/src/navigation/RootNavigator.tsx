import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * RootNavigator Component
 * Main navigation container that switches between Auth and Main flows
 */
const RootNavigator: React.FC = () => {
    const { user, loading } = useAuth();
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

    useEffect(() => {
        const checkOnboarding = async () => {
            // In development, always show onboarding so the full flow can be tested.
            // Remove the __DEV__ block before releasing to production.
            if (__DEV__) {
                await AsyncStorage.removeItem('hasSeenOnboarding');
                setHasSeenOnboarding(false);
                return;
            }
            const val = await AsyncStorage.getItem('hasSeenOnboarding');
            setHasSeenOnboarding(val === 'true');
        };
        checkOnboarding();
    }, []);

    // Show loading spinner while checking auth state or onboarding flag
    if (loading || hasSeenOnboarding === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    // Authenticated — always show main app
                    <Stack.Screen name="Main" component={MainTabs} />
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
