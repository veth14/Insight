import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ms, vs } from '../../utils/responsive';
import AdminHeader from '../../components/AdminHeader';

const AdminActivityLogsScreen: React.FC = () => {
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#ECEEF8" />
            <AdminHeader />
            <View style={styles.center}>
                <Ionicons name="pulse-outline" size={ms(48)} color="#9AADCA" />
                <Text style={styles.title}>Activity Logs</Text>
                <Text style={styles.sub}>Activity tracking coming soon</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ECEEF8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: vs(8) },
    title: { fontSize: ms(16), fontWeight: '700', color: '#0E1F43' },
    sub: { fontSize: ms(13), color: '#9AADCA' },
});

export default AdminActivityLogsScreen;
