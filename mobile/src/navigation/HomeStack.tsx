import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import DashboardScreen from '../screens/main/DashboardScreen';
import PDFReaderScreen from '../screens/main/PDFReaderScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

/**
 * HomeStack Navigator
 * Nested stack within Home tab for dashboard and PDF reader
 */
const HomeStack: React.FC = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{ title: 'Insight' }}
            />
            <Stack.Screen
                name="PDFReader"
                component={PDFReaderScreen}
                options={{ title: 'Reading' }}
            />
        </Stack.Navigator>
    );
};

export default HomeStack;
