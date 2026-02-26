import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SearchStackParamList } from '../types';
import SearchScreen from '../screens/main/SearchScreen';
import StudyDetailScreen from '../screens/main/StudyDetailScreen';
import CiteGeneratorScreen from '../screens/main/CiteGeneratorScreen';

const Stack = createNativeStackNavigator<SearchStackParamList>();

const SearchStack: React.FC = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="SearchMain" component={SearchScreen} />
            <Stack.Screen name="StudyDetail" component={StudyDetailScreen} />
            <Stack.Screen name="CiteGenerator" component={CiteGeneratorScreen} />
        </Stack.Navigator>
    );
};

export default SearchStack;
