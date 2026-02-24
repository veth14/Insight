import React from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    ScrollView, 
    Platform, 
    StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

/**
 * ProfileScreen Component
 * User profile, stats, and settings
 */
const ProfileScreen: React.FC = () => {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        }
                    },
                },
            ]
        );
    };

    const renderStat = (label: string, value: string, icon: keyof typeof Ionicons.glyphMap) => (
        <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
                <Ionicons name={icon} size={20} color={COLORS.accent} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );

    const renderMenuItem = (label: string, icon: keyof typeof Ionicons.glyphMap, onPress?: () => void, isDestructive = false) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuContent}>
                <Ionicons 
                    name={icon} 
                    size={22} 
                    color={isDestructive ? '#EF4444' : COLORS.text.primary} 
                />
                <Text style={[
                    styles.menuText, 
                    isDestructive && { color: '#EF4444' }
                ]}>
                    {label}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                        </Text>
                    </View>
                    <Text style={styles.name}>{user?.displayName || 'User'}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                    <View style={styles.roleTag}>
                        <Text style={styles.roleText}>{user?.role || 'Student'}</Text>
                    </View>
                </View>

                {/* Stats Section (Gamification) */}
                <View style={styles.statsContainer}>
                    {renderStat('Papers', '12', 'document-text')}
                    {renderStat('Hours', '4.5', 'time')}
                    {renderStat('Level', 'Scholar', 'school')}
                </View>

                {/* Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <View style={styles.menuGroup}>
                        {renderMenuItem('Edit Profile', 'person-outline')}
                        {renderMenuItem('Notifications', 'notifications-outline')}
                        {renderMenuItem('Privacy', 'lock-closed-outline')}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Support</Text>
                    <View style={styles.menuGroup}>
                        {renderMenuItem('Help Center', 'help-circle-outline')}
                        {renderMenuItem('Report a Bug', 'bug-outline')}
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.menuGroup}>
                        {renderMenuItem('Logout', 'log-out-outline', handleLogout, true)}
                    </View>
                </View>

                <Text style={styles.versionText}>INSIGHT v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    scrollContent: {
        paddingBottom: SPACING.xl,
    },
    header: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        marginBottom: SPACING.m,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.m,
        borderWidth: 3,
        borderColor: COLORS.accent,
        ...SHADOWS.medium,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
    },
    name: {
        ...TYPOGRAPHY.h2,
        marginBottom: SPACING.xs,
        color: COLORS.text.primary,
    },
    email: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.secondary,
        marginBottom: SPACING.m,
    },
    roleTag: {
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.xs,
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    roleText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 12,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.m,
        marginBottom: SPACING.l,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.card,
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        alignItems: 'center',
        marginHorizontal: SPACING.xs,
        ...SHADOWS.subtle,
    },
    statIconContainer: {
        marginBottom: SPACING.s,
    },
    statValue: {
        ...TYPOGRAPHY.h3,
        color: COLORS.primary,
    },
    statLabel: {
        ...TYPOGRAPHY.caption,
        color: COLORS.text.secondary,
        textTransform: 'uppercase',
        fontSize: 10,
    },
    section: {
        marginBottom: SPACING.m,
        paddingHorizontal: SPACING.m,
    },
    sectionTitle: {
        ...TYPOGRAPHY.h3,
        fontSize: 14,
        color: COLORS.text.secondary,
        marginBottom: SPACING.s,
        marginLeft: SPACING.s,
    },
    menuGroup: {
        backgroundColor: COLORS.card,
        borderRadius: BORDER_RADIUS.m,
        overflow: 'hidden',
        ...SHADOWS.subtle,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    menuContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuText: {
        ...TYPOGRAPHY.body,
        marginLeft: SPACING.m,
    },
    logoutButton: {
    },
    logoutText: {
    },
    year: {
    },
    profileSection: {
    },
    role: {
    },
    versionText: {
        textAlign: 'center',
        color: COLORS.text.secondary,
        fontSize: 12,
        marginTop: SPACING.m,
    }
});

export default ProfileScreen;
