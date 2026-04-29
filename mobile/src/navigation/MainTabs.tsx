import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import HomeStack from './HomeStack';
import SearchStack from './SearchStack';
import LibraryScreen from '../screens/main/LibraryScreen';
import UploadScreen from '../screens/main/UploadScreen';
import UploadLockedScreen from '../screens/main/UploadLockedScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs: React.FC = () => {
    const { user } = useAuth();
    const isGuest = user?.role === UserRole.GUEST;
    const is4thYear = user?.role === UserRole.STUDENT_4TH;
    const isApproved = user?.registrationStatus === 'approved';
    // 4th year: show Upload tab always, route to locked screen until approved
    const UploadComponent = (is4thYear && !isGuest) ? (isApproved ? UploadScreen : UploadLockedScreen) : null;
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
            {!isGuest && (
                <Tab.Screen name="Library" component={LibraryScreen} options={{ tabBarLabel: 'Library' }} />
            )}
            {UploadComponent && (
                <Tab.Screen name="Upload" component={UploadComponent} options={{ tabBarLabel: 'Upload' }} />
            )}
            {!isGuest && (
                <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarLabel: 'Alerts' }} />
            )}
        </Tab.Navigator>
    );
};

export default MainTabs;
