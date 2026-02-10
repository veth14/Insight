import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * SearchScreen Component
 * Search interface for academic papers
 * (Placeholder for now)
 */
const SearchScreen: React.FC = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.placeholder}>Search functionality coming soon...</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    placeholder: {
        fontSize: 14,
        color: '#999',
    },
});

export default SearchScreen;
