import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ms } from '../utils/responsive';
import AdminAccountsScreen from '../screens/admin/AdminAccountsScreen';
import AdminLiteratureScreen from '../screens/admin/AdminLiteratureScreen';

type AdminTabParamList = {
    Accounts: undefined;
    Literature: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

const AdminTabs: React.FC = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: '#0E1F43',
                tabBarInactiveTintColor: '#9AADCA',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#EEF1F8',
                    height: 62,
                    paddingBottom: 10,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: ms(10),
                    fontWeight: '600',
                },
                tabBarIcon: ({ focused, color }) => {
                    const icons: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
                        Accounts:   { active: 'people',  inactive: 'people-outline' },
                        Literature: { active: 'library', inactive: 'library-outline' },
                    };
                    const icon = icons[route.name] ?? icons['Accounts'];
                    return <Ionicons name={focused ? icon.active : icon.inactive} size={ms(22)} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Accounts" component={AdminAccountsScreen} />
            <Tab.Screen name="Literature" component={AdminLiteratureScreen} />
        </Tab.Navigator>
    );
};

export default AdminTabs;
