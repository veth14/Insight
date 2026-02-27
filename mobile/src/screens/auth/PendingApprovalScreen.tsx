import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Image,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, vs, ms } from '../../utils/responsive';
import { useAuth } from '../../contexts/AuthContext';

const PendingApprovalScreen: React.FC = () => {
    const { user, logout } = useAuth();

    const isRejected = user?.registrationStatus === 'rejected';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <Image
                    source={require('../../../assets/images/logobgr.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <View style={styles.card}>
                    {/* Icon */}
                    <View style={[styles.iconCircle, isRejected && styles.iconCircleRejected]}>
                        <Ionicons
                            name={isRejected ? 'close-circle-outline' : 'time-outline'}
                            size={ms(36)}
                            color={isRejected ? '#DC2626' : '#F59E0B'}
                        />
                    </View>

                    <Text style={styles.title}>
                        {isRejected ? 'Registration Rejected' : 'Awaiting Approval'}
                    </Text>

                    <Text style={styles.subtitle}>
                        {isRejected
                            ? 'Your registration was not approved by the administrator.'
                            : 'Your account is currently under review.'}
                    </Text>

                    <View style={styles.divider} />

                    {/* Details */}
                    <View style={styles.detailBox}>
                        <View style={styles.detailRow}>
                            <Ionicons name="person-outline" size={ms(15)} color="#5B6F96" />
                            <Text style={styles.detailText}>{user?.displayName}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Ionicons name="mail-outline" size={ms(15)} color="#5B6F96" />
                            <Text style={styles.detailText}>{user?.email}</Text>
                        </View>
                        {user?.studentNumber ? (
                            <View style={styles.detailRow}>
                                <Ionicons name="id-card-outline" size={ms(15)} color="#5B6F96" />
                                <Text style={styles.detailText}>{user.studentNumber}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Status badge */}
                    <View style={[styles.statusBadge, isRejected ? styles.statusBadgeRejected : styles.statusBadgePending]}>
                        <View style={[styles.statusDot, isRejected ? styles.statusDotRejected : styles.statusDotPending]} />
                        <Text style={[styles.statusText, isRejected ? styles.statusTextRejected : styles.statusTextPending]}>
                            {isRejected ? 'Rejected' : 'Pending Review'}
                        </Text>
                    </View>

                    {isRejected ? (
                        <Text style={styles.note}>
                            Please contact your administrator or try re-registering with the correct information.
                        </Text>
                    ) : (
                        <Text style={styles.note}>
                            An administrator will review your Student Registration Form shortly. You will gain full access once approved.
                        </Text>
                    )}
                </View>

                {/* Sign out */}
                <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
                    <Ionicons name="log-out-outline" size={ms(17)} color="#9AADCA" />
                    <Text style={styles.logoutText}>Sign out</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    scroll: {
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: scale(24),
        paddingTop: vs(40),
        paddingBottom: vs(40),
    },
    logo: { width: scale(120), height: vs(50), marginBottom: vs(16) },

    card: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: ms(20),
        paddingHorizontal: scale(24),
        paddingVertical: vs(28),
        alignItems: 'center',
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 4,
    },

    iconCircle: {
        width: scale(72),
        height: scale(72),
        borderRadius: ms(36),
        backgroundColor: '#FFFBEB',
        borderWidth: 2,
        borderColor: '#FDE68A',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vs(16),
    },
    iconCircleRejected: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA',
    },

    title: {
        fontSize: ms(18),
        fontWeight: '800',
        color: '#0E1F43',
        marginBottom: vs(6),
        textAlign: 'center',
    },
    subtitle: {
        fontSize: ms(13),
        color: '#9AADCA',
        textAlign: 'center',
        lineHeight: ms(19),
        marginBottom: vs(16),
    },

    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#F0F2F8',
        marginBottom: vs(16),
    },

    detailBox: {
        width: '100%',
        backgroundColor: '#F7F9FF',
        borderRadius: ms(12),
        paddingHorizontal: scale(14),
        paddingVertical: vs(12),
        gap: vs(8),
        marginBottom: vs(16),
    },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: scale(8) },
    detailText: { fontSize: ms(13), color: '#5B6F96', fontWeight: '500', flex: 1 },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(6),
        paddingHorizontal: scale(14),
        paddingVertical: vs(6),
        borderRadius: ms(20),
        marginBottom: vs(14),
    },
    statusBadgePending: { backgroundColor: '#FFFBEB' },
    statusBadgeRejected: { backgroundColor: '#FEF2F2' },
    statusDot: { width: scale(7), height: scale(7), borderRadius: ms(4) },
    statusDotPending: { backgroundColor: '#F59E0B' },
    statusDotRejected: { backgroundColor: '#DC2626' },
    statusText: { fontSize: ms(12), fontWeight: '700' },
    statusTextPending: { color: '#B45309' },
    statusTextRejected: { color: '#DC2626' },

    note: {
        fontSize: ms(12),
        color: '#9AADCA',
        textAlign: 'center',
        lineHeight: ms(18),
    },

    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(6),
        marginTop: vs(24),
        paddingVertical: vs(10),
    },
    logoutText: { fontSize: ms(13), color: '#9AADCA', fontWeight: '600' },
});

export default PendingApprovalScreen;
