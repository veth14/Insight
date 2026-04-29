import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity,
    Modal, TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api.service';

const IMG_LOGO = require('../../assets/images/insightlogox128.png');

interface AppHeaderProps {
    onNotificationPress?: () => void;
    notificationCount?: number;
    onAvatarPress?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
    onNotificationPress,
    notificationCount: propsNotificationCount = 0,
    onAvatarPress,
}) => {
    const { user, logout } = useAuth();
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();
    const [menuVisible, setMenuVisible] = useState(false);
    const [localCount, setLocalCount] = useState(0);

    const isStudent = user?.role !== 'admin' && user?.role !== 'faculty';

    useEffect(() => {
        if (!onNotificationPress && isStudent && isFocused) {
            const fetchCount = async () => {
                try {
                    const res = await api.get('/studies/my');
                    const studies = res.data.studies ?? [];
                    const count = studies.filter((s: any) => s.approvalStatus === 'pending' || s.approvalStatus === 'rejected').length;
                    setLocalCount(count);
                } catch {
                    // Ignore background silently
                }
            };
            fetchCount();
        }
    }, [isStudent, onNotificationPress, isFocused]);

    const activeCount = onNotificationPress ? propsNotificationCount : localCount;

    const handleNotifPress = () => {
        if (onNotificationPress) {
            onNotificationPress();
        } else {
            navigation.navigate('Notifications');
        }
    };

    const initials = user?.displayName
        ? user.displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    const handleAvatarPress = () => {
        if (onAvatarPress) onAvatarPress();
        else setMenuVisible(true);
    };

    return (
        <>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.logoContainer}>
                        <Image source={IMG_LOGO} style={styles.logoImg} resizeMode="contain" />
                    </View>
                </View>
                <View style={styles.headerRight}>
                    {user?.role !== 'guest' && (
                        <TouchableOpacity style={styles.notifBtn} onPress={handleNotifPress} activeOpacity={0.8}>
                            <Ionicons name="notifications-outline" size={22} color="#0E1F43" />
                            {activeCount > 0 && (
                                <View style={styles.notifBadge}>
                                    <Text style={styles.notifBadgeText}>
                                        {activeCount > 9 ? '9+' : activeCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.avatar} onPress={handleAvatarPress} activeOpacity={0.8}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Modal transparent animationType="fade" visible={menuVisible} onRequestClose={() => setMenuVisible(false)}>
                <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
                    <View style={styles.menuOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.menuCard}>
                                <View style={styles.menuUserRow}>
                                    <View style={styles.menuAvatar}>
                                        <Text style={styles.menuAvatarText}>{initials}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.menuUserName}>{user?.displayName ?? 'Student'}</Text>
                                        <Text style={styles.menuUserEmail} numberOfLines={1}>{user?.email ?? ''}</Text>
                                    </View>
                                </View>
                                {user?.role !== 'guest' && (
                                    <>
                                        <View style={styles.menuDivider} />
                                        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => { setMenuVisible(false); navigation.navigate('AccountSettings'); }}>
                                            <Ionicons name="settings-outline" size={18} color="#0E1F43" />
                                            <Text style={styles.menuItemText}>Account Settings</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                                <View style={styles.menuDivider} />
                                <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={async () => { setMenuVisible(false); await logout(); }}>
                                    <Ionicons name="log-out-outline" size={18} color="#E53935" />
                                    <Text style={[styles.menuItemText, { color: '#E53935' }]}>Sign Out</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 6,
        backgroundColor: '#fff',
        borderBottomWidth: 1.5,
        borderBottomColor: '#E0E5F0',
        elevation: 6,
        zIndex: 10,
    },
    headerLeft: { flex: 1, justifyContent: 'center' },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    notifBtn: {
        width: 42, height: 42, borderRadius: 21,
        justifyContent: 'center', alignItems: 'center',
    },
    notifBadge: {
        position: 'absolute', top: 7, right: 7,
        minWidth: 15, height: 15, borderRadius: 8,
        backgroundColor: '#E53E3E',
        justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 3,
    },
    notifBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
    logoContainer: {
        width: 160,
        height: 48,
        marginLeft: -24,
        marginTop: 2,
        justifyContent: 'center',
        alignItems: 'flex-start',
        overflow: 'hidden',
    },
    logoImg: { width: 160, height: 160 },
    avatar: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: '#E97C3A',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#E97C3A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 4,
    },
    avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
    menuCard: {
        position: 'absolute',
        top: 60,
        right: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        width: 230,
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 12,
        overflow: 'hidden',
    },
    menuUserRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    menuAvatar: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: '#E97C3A',
        justifyContent: 'center', alignItems: 'center',
    },
    menuAvatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    menuUserName: { fontSize: 14, fontWeight: '700', color: '#0E1F43' },
    menuUserEmail: { fontSize: 11, color: '#8A97B0', marginTop: 2 },
    menuDivider: { height: 1, backgroundColor: '#F0F2F8' },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    menuItemText: { fontSize: 14, fontWeight: '600', color: '#0E1F43' },
});

export default AppHeader;
