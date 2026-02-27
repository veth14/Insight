import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Modal, TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from './AppHeader';
import { scale, vs, ms } from '../utils/responsive';

/* ── Static mock notifications (replace with API call when ready) ── */
const DEFAULT_NOTIFICATIONS = [
    { id: '1', icon: 'person-add-outline',       title: 'New Account Registration',  body: 'Maria Santos has requested account access',         time: '3m ago',  read: false },
    { id: '2', icon: 'document-text-outline',    title: 'New Literature Submission', body: 'AI-based Student Performance Prediction System',    time: '11m ago', read: false },
    { id: '3', icon: 'checkmark-circle-outline', title: 'Account Approved',          body: 'You approved Juan Dela Cruz Registration',          time: '1h ago',  read: true  },
];

const AdminHeader: React.FC = () => {
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);

    const unreadCount = notifications.filter(n => !n.read).length;
    const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

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
                    {notifications.map(n => (
                        <View key={n.id} style={styles.item}>
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
                        </View>
                    ))}
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
