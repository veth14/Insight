import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SearchStackParamList } from '../types';
import SearchScreen from '../screens/main/SearchScreen';
import StudyDetailScreen from '../screens/main/StudyDetailScreen';
import CiteGeneratorScreen from '../screens/main/CiteGeneratorScreen';
import AccountSettingsScreen from '../screens/main/AccountSettingsScreen';
import MyAccountScreen from '../screens/main/MyAccountScreen';
import ChangePasswordScreen from '../screens/main/ChangePasswordScreen';
import DownloadsScreen from '../screens/main/DownloadsScreen';
import PrivacyPolicyScreen from '../screens/main/PrivacyPolicyScreen';
import TermsOfUseScreen from '../screens/main/TermsOfUseScreen';
import MyAnalyticsScreen from '../screens/main/MyAnalyticsScreen';

const Stack = createNativeStackNavigator<SearchStackParamList>();

const SearchStack: React.FC = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="SearchMain" component={SearchScreen} />
            <Stack.Screen name="StudyDetail" component={StudyDetailScreen} />
            <Stack.Screen name="CiteGenerator" component={CiteGeneratorScreen} />
            <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
            <Stack.Screen name="MyAccount" component={MyAccountScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="Downloads" component={DownloadsScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="TermsOfUse" component={TermsOfUseScreen} />
            <Stack.Screen name="MyAnalytics" component={MyAnalyticsScreen} />
        </Stack.Navigator>
    );
};

export default SearchStack;
