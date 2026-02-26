import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ms } from '../../utils/responsive';

/**
 * BookmarksScreen Component
 * Displays user's saved bookmarks
 * (Placeholder for now)
 */
const BookmarksScreen: React.FC = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.placeholder}>Bookmarks coming soon...</Text>
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
        fontSize: ms(14),
        color: '#999',
    },
});

export default BookmarksScreen;
