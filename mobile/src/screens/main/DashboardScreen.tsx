import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

/**
 * DashboardScreen Component
 * Main home screen - will display recent papers and recommendations
 * (Placeholder for now)
 */
const DashboardScreen: React.FC = () => {
    const { user } = useAuth();

    return (
        <View style={styles.container}>
            <Text style={styles.welcome}>Welcome, {user?.displayName}!</Text>
            <Text style={styles.subtitle}>Role: {user?.role}</Text>
            <Text style={styles.placeholder}>
                Dashboard content coming soon...
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    welcome: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    placeholder: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 40,
    },
});

export default DashboardScreen;
