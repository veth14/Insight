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
        AsyncStorage.getItem('hasSeenOnboarding').then(val => {
            setHasSeenOnboarding(val === 'true');
        });
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
                {!hasSeenOnboarding ? (
                    // First launch — show onboarding
                    <Stack.Screen name="Auth" component={AuthStack} />
                ) : user ? (
                    // Returning user, authenticated — show main app
                    <Stack.Screen name="Main" component={MainTabs} />
                ) : (
                    // Returning user, not authenticated — go straight to login
                    <Stack.Screen name="Auth">
                        {() => <AuthStack initialRouteName="Login" />}
                    </Stack.Screen>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default RootNavigator;
