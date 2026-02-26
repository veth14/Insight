import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import HomeStack from './HomeStack';
import SearchStack from './SearchStack';
import LibraryScreen from '../screens/main/LibraryScreen';
import UploadScreen from '../screens/main/UploadScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs: React.FC = () => {
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
                    fontSize: 11,
                    fontWeight: '600',
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'home';

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Search') {
                        iconName = focused ? 'search' : 'search-outline';
                    } else if (route.name === 'Library') {
                        iconName = focused ? 'book' : 'book-outline';
                    } else if (route.name === 'Upload') {
                        iconName = focused ? 'create' : 'create-outline';
                    } else if (route.name === 'Notifications') {
                        iconName = focused ? 'notifications' : 'notifications-outline';
                    }

                    return <Ionicons name={iconName} size={22} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeStack} options={{ tabBarLabel: 'Dashboard' }} />
            <Tab.Screen name="Search" component={SearchStack} options={{ tabBarLabel: 'Search' }} />
            <Tab.Screen name="Library" component={LibraryScreen} options={{ tabBarLabel: 'Library' }} />
            <Tab.Screen name="Upload" component={UploadScreen} options={{ tabBarLabel: 'Upload' }} />
            <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarLabel: 'Alerts' }} />
        </Tab.Navigator>
    );
};

export default MainTabs;
