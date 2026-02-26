import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import DashboardScreen from '../screens/main/DashboardScreen';
import PDFReaderScreen from '../screens/main/PDFReaderScreen';
import StudyDetailScreen from '../screens/main/StudyDetailScreen';
import CiteGeneratorScreen from '../screens/main/CiteGeneratorScreen';

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
            <Stack.Screen
                name="PDFReader"
                component={PDFReaderScreen}
                options={{ title: 'Reading' }}
            />
        </Stack.Navigator>
    );
};

export default HomeStack;
