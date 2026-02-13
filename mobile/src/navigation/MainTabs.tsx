import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import HomeStack from './HomeStack';
import SearchScreen from '../screens/main/SearchScreen';
import LibraryScreen from '../screens/main/LibraryScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import { COLORS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons'; // Assuming Expo

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * MainTabs Navigator
 * Bottom tab navigation for main app sections
 */
const MainTabs: React.FC = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: COLORS.accent, // Updated to Accent Teal
                tabBarInactiveTintColor: COLORS.text.secondary,
                tabBarStyle: {
                    backgroundColor: COLORS.card,
                    borderTopColor: COLORS.border,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontFamily: 'Roboto', // Or system font
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'home';

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Search') {
                        iconName = focused ? 'search' : 'search-outline';
                    } else if (route.name === 'Library') {
                        iconName = focused ? 'library' : 'library-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeStack}
                options={{
                    tabBarLabel: 'Dashboard',
                }}
            />
            <Tab.Screen
                name="Search"
                component={SearchScreen}
                options={{
                    tabBarLabel: 'Search',
                }}
            />
            <Tab.Screen
                name="Library"
                component={LibraryScreen}
                options={{
                    tabBarLabel: 'Library',
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                }}
            />
        </Tab.Navigator>
    );
};

export default MainTabs;
