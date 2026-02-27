import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminTabs from './AdminTabs';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import AdminMyAccountScreen from '../screens/admin/AdminMyAccountScreen';
import AdminAuditScreen from '../screens/admin/AdminAuditScreen';
import ManageUsersScreen from '../screens/admin/ManageUsersScreen';
import ChangePasswordScreen from '../screens/main/ChangePasswordScreen';
import PrivacyPolicyScreen from '../screens/main/PrivacyPolicyScreen';
import TermsOfUseScreen from '../screens/main/TermsOfUseScreen';

type AdminStackParamList = {
    AdminTabs: { screen?: string } | undefined;
    AccountSettings: undefined;
    MyAccount: undefined;
    ChangePassword: undefined;
    AdminAudit: undefined;
    ManageUsers: undefined;
    PrivacyPolicy: undefined;
    TermsOfUse: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

const AdminStack: React.FC = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AdminTabs" component={AdminTabs} />
            <Stack.Screen name="AccountSettings" component={AdminSettingsScreen} />
            <Stack.Screen name="MyAccount" component={AdminMyAccountScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="AdminAudit" component={AdminAuditScreen} />
            <Stack.Screen name="ManageUsers" component={ManageUsersScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="TermsOfUse" component={TermsOfUseScreen} />
        </Stack.Navigator>
    );
};

export default AdminStack;
