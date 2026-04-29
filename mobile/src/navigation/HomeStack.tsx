import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import DashboardScreen from '../screens/main/DashboardScreen';
import PDFReaderScreen from '../screens/main/PDFReaderScreen';
import StudyDetailScreen from '../screens/main/StudyDetailScreen';
import CiteGeneratorScreen from '../screens/main/CiteGeneratorScreen';
import AccountSettingsScreen from '../screens/main/AccountSettingsScreen';
import MyAccountScreen from '../screens/main/MyAccountScreen';
import ChangePasswordScreen from '../screens/main/ChangePasswordScreen';
import DownloadsScreen from '../screens/main/DownloadsScreen';
import PrivacyPolicyScreen from '../screens/main/PrivacyPolicyScreen';
import TermsOfUseScreen from '../screens/main/TermsOfUseScreen';
import TrendingAllScreen from '../screens/main/TrendingAllScreen';
import AppLockSetupScreen from '../screens/auth/AppLockSetupScreen';
import MyAnalyticsScreen from '../screens/main/MyAnalyticsScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

/**
 * HomeStack Navigator
 * Nested stack within Home tab for dashboard and PDF reader
 */
const HomeStack: React.FC = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="Dashboard"
                component={DashboardScreen}
            />
            <Stack.Screen
                name="StudyDetail"
                component={StudyDetailScreen}
            />
            <Stack.Screen name="CiteGenerator" component={CiteGeneratorScreen} />
            <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
            <Stack.Screen name="MyAccount" component={MyAccountScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="Downloads" component={DownloadsScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="TermsOfUse" component={TermsOfUseScreen} />
            <Stack.Screen name="TrendingAll" component={TrendingAllScreen} />
            <Stack.Screen name="AppLockSetup" component={AppLockSetupScreen as any} />
            <Stack.Screen name="MyAnalytics" component={MyAnalyticsScreen} />
            <Stack.Screen
                name="PDFReader"
                component={PDFReaderScreen}
                options={{ title: 'Reading' }}
            />
        </Stack.Navigator>
    );
};

export default HomeStack;
