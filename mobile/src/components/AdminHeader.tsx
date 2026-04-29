import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Modal, TouchableWithoutFeedback, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import AppHeader from './AppHeader';
import api from '../services/api.service';
import { scale, vs, ms } from '../utils/responsive';

const AdminHeader: React.FC = () => {
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [readIds, setReadIds] = useState<string[]>([]);
    const isFocused = useIsFocused();
    const navigation = useNavigation<any>();

    useEffect(() => {
        const fetchAdminAlerts = async () => {
            try {
                // Fetch stored read IDs first to ensure sync
                const stored = await AsyncStorage.getItem('admin_read_notif_ids');
                const currentReadIds = stored ? JSON.parse(stored) : [];
                setReadIds(currentReadIds);

                const [regRes, litRes] = await Promise.all([
                    api.get('/admin/registrations?status=pending'),
                    api.get('/admin/literature?status=pending&limit=10')
                ]);
                
                const pendingUsers = regRes.data.users || [];
                const pendingLit = litRes.data.studies || [];
                
                let notifs: any[] = [];
                
                pendingUsers.slice(0, 5).forEach((u: any) => {
                    const id = 'usr_' + u.uid;
                    notifs.push({
                        id,
                        icon: 'person-add-outline',
                        title: 'Pending Account',
                        body: `${u.displayName} requests access.`,
                        time: new Date(u.createdAt).toLocaleDateString(),
                        timestamp: new Date(u.createdAt).getTime(),
                        read: currentReadIds.includes(id)
                    });
                });
                
                pendingLit.slice(0, 5).forEach((l: any) => {
                    const id = 'lit_' + l._id;
                    notifs.push({
                        id,
                        icon: 'document-text-outline',
                        title: 'Pending Literature',
                        body: l.title,
                        time: new Date(l.createdAt).toLocaleDateString(),
                        timestamp: new Date(l.createdAt).getTime(),
                        read: currentReadIds.includes(id)
                    });
                });

                // Sort newest first
                notifs.sort((a, b) => b.timestamp - a.timestamp);
                setNotifications(notifs);
            } catch (e) {
                // Silently swallow background fetch errors
            }
        };
        
        if (isFocused) {
            fetchAdminAlerts();
        }
    }, [isFocused]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleNotificationPress = async (notif: any) => {
        setNotifOpen(false);
        
        // Mark as read and persist
        if (!readIds.includes(notif.id)) {
            const newReadIds = [...readIds, notif.id];
            setReadIds(newReadIds);
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
            try {
                await AsyncStorage.setItem('admin_read_notif_ids', JSON.stringify(newReadIds));
            } catch (e) { /* ignore */ }
        }

        if (notif.id.startsWith('usr_')) {
            navigation.navigate('AdminTabs', { screen: 'Accounts' });
        } else if (notif.id.startsWith('lit_')) {
            navigation.navigate('AdminTabs', { screen: 'Literature' });
        }
    };

    const markAllRead = async () => {
        const allIds = notifications.map(n => n.id);
        const newReadIds = Array.from(new Set([...readIds, ...allIds]));
        setReadIds(newReadIds);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        try {
            await AsyncStorage.setItem('admin_read_notif_ids', JSON.stringify(newReadIds));
        } catch (e) { /* ignore */ }
    };

    return (
        <>
            <AppHeader
                onNotificationPress={() => setNotifOpen(true)}
                notificationCount={unreadCount}
            />

            {/* Notification panel */}
            <Modal
                transparent
                visible={notifOpen}
                animationType="fade"
                onRequestClose={() => setNotifOpen(false)}
            >
                <TouchableWithoutFeedback onPress={() => setNotifOpen(false)}>
                    <View style={styles.overlay} />
                </TouchableWithoutFeedback>
                <View style={styles.panel}>
                    {/* Panel header */}
                    <View style={styles.panelHeader}>
                        <View>
                            <Text style={styles.panelTitle}>Notifications</Text>
                            <Text style={styles.panelSub}>{unreadCount} unread</Text>
                        </View>
                        <View style={styles.panelHeaderRight}>
                            <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
                                <Text style={styles.markAllRead}>Mark all read</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setNotifOpen(false)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons name="close" size={ms(18)} color="#333" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Notification items */}
                    <ScrollView style={{ maxHeight: vs(300) }} showsVerticalScrollIndicator={false}>
                        {notifications.length === 0 ? (
                            <Text style={{ textAlign: 'center', color: '#9AADCA', paddingVertical: vs(20) }}>No new alerts</Text>
                        ) : (
                            notifications.map(n => (
                                <TouchableOpacity 
                                    key={n.id} 
                                    style={styles.item}
                                    onPress={() => handleNotificationPress(n)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.iconBox, { backgroundColor: n.read ? '#F5F6FA' : '#EEF2FF' }]}>
                                        <Ionicons
                                            name={n.icon as any}
                                            size={ms(18)}
                                            color={n.read ? '#9AADCA' : '#5B8DEF'}
                                        />
                                    </View>
                                    <View style={styles.itemBody}>
                                        <Text style={styles.itemTitle}>{n.title}</Text>
                                        <Text style={styles.itemText} numberOfLines={1}>{n.body}</Text>
                                        <Text style={styles.itemTime}>{n.time}</Text>
                                    </View>
                                    {!n.read && <View style={styles.unreadDot} />}
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },

    panel: {
        position: 'absolute',
        top: vs(62),
        left: scale(16),
        right: scale(16),
        backgroundColor: '#fff',
        borderRadius: ms(14),
        paddingHorizontal: scale(16),
        paddingVertical: vs(14),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 10,
    },

    panelHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: vs(12),
    },
    panelTitle: { fontSize: ms(14), fontWeight: '700', color: '#0E1F43' },
    panelSub: { fontSize: ms(11), color: '#9AADCA', marginTop: vs(2) },
    panelHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: scale(12) },
    markAllRead: { fontSize: ms(11), color: '#5B8DEF', fontWeight: '600' },

    item: {
        flexDirection: 'row', alignItems: 'flex-start', gap: scale(10),
        paddingVertical: vs(10),
        borderBottomWidth: 1, borderBottomColor: '#F5F6FA',
    },
    iconBox: {
        width: scale(36), height: scale(36), borderRadius: ms(10),
        justifyContent: 'center', alignItems: 'center',
    },
    itemBody: { flex: 1 },
    itemTitle: { fontSize: ms(12), fontWeight: '700', color: '#0E1F43', marginBottom: vs(2) },
    itemText: { fontSize: ms(11), color: '#666' },
    itemTime: { fontSize: ms(10), color: '#9AADCA', marginTop: vs(2) },
    unreadDot: {
        width: scale(8), height: scale(8), borderRadius: scale(4),
        backgroundColor: '#5B8DEF', marginTop: vs(4),
    },
});

export default AdminHeader;
