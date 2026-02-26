import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { scale, vs, ms } from '../../utils/responsive';

// ── Types ──────────────────────────────────────────────────────────────────────

interface DownloadItem {
    id: string;
    title: string;
    sizeMB: number;
    date: string;
}

// ── Mock data (replace with AsyncStorage / FileSystem when backend is ready) ──

const INITIAL_DOWNLOADS: DownloadItem[] = [
    { id: '1', title: 'Machine Learning Approaches in Predicting Student Academic Performance', sizeMB: 3.4, date: 'Feb 12, 2026' },
    { id: '2', title: 'AI-Powered Plagiarism Detection for Filipino Language Academic Texts', sizeMB: 1.8, date: 'Feb 10, 2026' },
    { id: '3', title: 'InsiQht: A Mobile-Based Centralized Repository for CCS Research', sizeMB: 3.2, date: 'Feb 08, 2026' },
    { id: '4', title: 'GreenPulse: QCU Urban Farm Monitoring System', sizeMB: 0.9, date: 'Feb 06, 2026' },
];

const TOTAL_STORAGE_MB = 100;

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatSize = (mb: number) =>
    mb >= 1 ? `${mb.toFixed(1)} MB` : `${(mb * 1024).toFixed(0)} KB`;

// ── Screen ─────────────────────────────────────────────────────────────────────

const DownloadsScreen: React.FC = () => {
    const navigation = useNavigation();
    const [downloads, setDownloads] = useState<DownloadItem[]>(INITIAL_DOWNLOADS);

    const usedMB = downloads.reduce((sum, d) => sum + d.sizeMB, 0);
    const progress = Math.min(usedMB / TOTAL_STORAGE_MB, 1);

    const handleDelete = useCallback((item: DownloadItem) => {
        Alert.alert(
            'Remove Download',
            `Remove "${item.title.slice(0, 50)}..." from your downloads?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => setDownloads(prev => prev.filter(d => d.id !== item.id)),
                },
            ]
        );
    }, []);

    const handleClearAll = () => {
        if (downloads.length === 0) return;
        Alert.alert(
            'Clear All Downloads',
            'Remove all downloaded files? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear All', style: 'destructive', onPress: () => setDownloads([]) },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />

            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <Ionicons name="chevron-back" size={20} color="#0E1F43" />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>Downloads</Text>
                <TouchableOpacity onPress={handleClearAll} activeOpacity={0.7} style={styles.clearBtn}>
                    <Text style={[styles.clearBtnText, downloads.length === 0 && { opacity: 0.3 }]}>
                        Clear All
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >
                {/* Storage card */}
                <View style={styles.storageCard}>
                    <View style={styles.storageRow}>
                        <Text style={styles.storageLabel}>Storage Used</Text>
                        <Text style={styles.storageValue}>
                            {formatSize(usedMB)} / {TOTAL_STORAGE_MB} MB
                        </Text>
                    </View>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                    </View>
                </View>

                {/* List */}
                {downloads.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="cloud-download-outline" size={52} color="#C0CDE8" />
                        <Text style={styles.emptyTitle}>No downloads yet</Text>
                        <Text style={styles.emptySub}>Files you download will appear here</Text>
                    </View>
                ) : (
                    <View style={styles.listCard}>
                        {downloads.map((item, index) => (
                            <React.Fragment key={item.id}>
                                {index > 0 && <View style={styles.rowDivider} />}
                                <View style={styles.row}>
                                    {/* Doc icon */}
                                    <View style={styles.docIcon}>
                                        <Ionicons name="document-text-outline" size={20} color="#4A6FA5" />
                                    </View>

                                    {/* Title + meta */}
                                    <View style={styles.rowBody}>
                                        <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
                                        <Text style={styles.rowMeta}>{formatSize(item.sizeMB)} · {item.date}</Text>
                                    </View>

                                    {/* Actions */}
                                    <View style={styles.rowActions}>
                                        <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                                        <TouchableOpacity
                                            onPress={() => handleDelete(item)}
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="trash-outline" size={20} color="#EF4444" style={{ marginTop: vs(6) }} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </React.Fragment>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },

    topBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: scale(16), paddingVertical: vs(10), backgroundColor: '#F5F6FA',
    },
    backBtn: {
        width: scale(36), height: vs(36), borderRadius: ms(10),
        backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#E0E5F0',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
    },
    topBarTitle: { fontSize: ms(16), fontWeight: '800', color: '#0E1F43' },
    clearBtn: { paddingHorizontal: scale(4), paddingVertical: vs(4) },
    clearBtnText: { fontSize: ms(13), fontWeight: '600', color: '#E53935' },

    scroll: {
        padding: scale(16),
        paddingBottom: vs(40),
        gap: vs(14),
    },

    // Storage card
    storageCard: {
        backgroundColor: '#0E1F43',
        borderRadius: ms(16),
        padding: scale(18),
        gap: vs(10),
    },
    storageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    storageLabel: {
        fontSize: ms(13), fontWeight: '700', color: '#fff',
    },
    storageValue: {
        fontSize: ms(13), fontWeight: '700', color: '#F5A623',
    },
    progressTrack: {
        height: vs(8),
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: ms(4),
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#F5A623',
        borderRadius: ms(4),
    },

    // Empty state
    emptyState: {
        alignItems: 'center',
        paddingTop: vs(60),
        gap: vs(8),
    },
    emptyTitle: {
        fontSize: ms(16), fontWeight: '700', color: '#0E1F43',
        marginTop: vs(8),
    },
    emptySub: {
        fontSize: ms(13), color: '#9AADCA', textAlign: 'center',
    },

    // List card
    listCard: {
        backgroundColor: '#fff',
        borderRadius: ms(16),
        borderWidth: 1,
        borderColor: '#F0F2F8',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
        overflow: 'hidden',
    },
    rowDivider: {
        height: vs(1),
        backgroundColor: '#F5F6FA',
        marginHorizontal: scale(14),
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: scale(14),
        paddingVertical: vs(12),
        gap: scale(10),
    },
    docIcon: {
        width: scale(38), height: vs(38), borderRadius: ms(10),
        backgroundColor: '#EEF3FF',
        justifyContent: 'center', alignItems: 'center',
    },
    rowBody: {
        flex: 1,
        gap: vs(3),
    },
    rowTitle: {
        fontSize: ms(13), fontWeight: '600', color: '#0E1F43', lineHeight: vs(18),
    },
    rowMeta: {
        fontSize: ms(11), color: '#9AADCA',
    },
    rowActions: {
        alignItems: 'center',
        gap: vs(2),
    },
});

export default DownloadsScreen;
