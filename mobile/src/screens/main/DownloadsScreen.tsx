import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, StatusBar, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types';
import { scale, vs, ms } from '../../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import CustomAlert, { AlertButton } from '../../components/CustomAlert';

// ── Constants ──────────────────────────────────────────────────────────────────

export const DOWNLOADS_KEY  = '@insight_downloads';
const TOTAL_STORAGE_MB      = 100;

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DownloadItem {
    id:      string;
    title:   string;
    sizeMB:  number;
    date:    string;
    fileUrl: string;
    localUri?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatSize = (mb: number) =>
    mb >= 1 ? `${mb.toFixed(1)} MB` : `${(mb * 1024).toFixed(0)} KB`;

// ── Screen ─────────────────────────────────────────────────────────────────────

const DownloadsScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
    const [downloads, setDownloads] = useState<DownloadItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    
    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean; title: string; message: string; icon?: any; iconColor?: string; buttons?: AlertButton[];
    }>({ visible: false, title: '', message: '' });

    const showAlert = (title: string, message: string, buttons?: AlertButton[], icon?: any, iconColor?: string) => {
        setAlertConfig({ visible: true, title, message, buttons, icon, iconColor });
    };

    const loadDownloads = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
            setDownloads(raw ? JSON.parse(raw) : []);
        } catch {
            setDownloads([]);
        } finally {
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { loadDownloads(); }, [loadDownloads]));

    const usedMB   = downloads.reduce((sum, d) => sum + (d.sizeMB ?? 0), 0);
    const progress = Math.min(usedMB / TOTAL_STORAGE_MB, 1);

    const handleOpen = async (item: DownloadItem) => {
        let uriToOpen = item.fileUrl; // Fallback to online url temporarily 

        if (item.localUri) {
            try {
                const info = await FileSystem.getInfoAsync(item.localUri);
                if (info.exists) {
                    uriToOpen = item.localUri;
                    console.log('Opening locally from:', uriToOpen);
                } else {
                     showAlert('File Missing', 'The file could not be found locally. Please redownload.', undefined, 'alert-circle', '#EF4444');
                     return;
                }
            } catch (e) {
                console.error('Error checking file info:', e);
            }
        }

        navigation.navigate('PDFReader', { studyId: item.id, offlineUrl: uriToOpen });
    };

    const handleDelete = useCallback((item: DownloadItem) => {
        showAlert(
            'Remove Download',
            `Remove "${item.title.length > 50 ? item.title.slice(0, 50) + '...' : item.title}" from your downloads?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        const updated = downloads.filter(d => d.id !== item.id);
                        setDownloads(updated);
                        await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(updated));
                        if (item.localUri) {
                            try {
                                await FileSystem.deleteAsync(item.localUri, { idempotent: true });
                            } catch (e) {
                                console.log('Delete local file failed', e);
                            }
                        }
                    },
                },
            ],
            'trash-outline',
            '#EF4444'
        );
    }, [downloads]);

    const handleClearAll = () => {
        if (downloads.length === 0) return;
        showAlert(
            'Clear All Downloads',
            'Remove all downloaded files from this list? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                        // Delete files
                        for (const item of downloads) {
                            if (item.localUri) {
                                try {
                                    await FileSystem.deleteAsync(item.localUri, { idempotent: true });
                                } catch (e) {}
                            }
                        }
                        setDownloads([]);
                        await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify([]));
                    },
                },
            ],
            'trash-bin-outline',
            '#EF4444'
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
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadDownloads(true)}
                        colors={['#0E1F43']}
                        tintColor="#0E1F43"
                    />
                }
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
                        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
                    </View>
                </View>

                {/* List */}
                {downloads.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="cloud-download-outline" size={52} color="#C0CDE8" />
                        <Text style={styles.emptyTitle}>No downloads yet</Text>
                        <Text style={styles.emptySub}>
                            Tap "Download" on any study to save it here
                        </Text>
                    </View>
                ) : (
                    <View style={styles.listCard}>
                        {downloads.map((item, index) => (
                            <React.Fragment key={item.id}>
                                {index > 0 && <View style={styles.rowDivider} />}
                                <TouchableOpacity
                                    style={styles.row}
                                    activeOpacity={0.75}
                                    onPress={() => handleOpen(item)}
                                >
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
                                </TouchableOpacity>
                            </React.Fragment>
                        ))}
                    </View>
                )}
            </ScrollView>

            <CustomAlert 
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                icon={alertConfig.icon}
                iconColor={alertConfig.iconColor}
                buttons={alertConfig.buttons}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />
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
    clearBtn:    { paddingHorizontal: scale(4), paddingVertical: vs(4) },
    clearBtnText: { fontSize: ms(13), fontWeight: '600', color: '#E53935' },

    scroll: { padding: scale(16), paddingBottom: vs(40), gap: vs(14) },

    storageCard: {
        backgroundColor: '#0E1F43', borderRadius: ms(16), padding: scale(18), gap: vs(10),
    },
    storageRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    storageLabel: { fontSize: ms(13), fontWeight: '700', color: '#fff' },
    storageValue: { fontSize: ms(13), fontWeight: '700', color: '#F5A623' },
    progressTrack: {
        height: vs(8), backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: ms(4), overflow: 'hidden',
    },
    progressFill: {
        height: '100%', backgroundColor: '#F5A623', borderRadius: ms(4),
    },

    emptyState: {
        alignItems: 'center', paddingVertical: vs(60), gap: vs(10),
    },
    emptyTitle: { fontSize: ms(16), fontWeight: '700', color: '#1A2744', marginTop: vs(8) },
    emptySub:   { fontSize: ms(13), color: '#9AADCA', textAlign: 'center', paddingHorizontal: scale(32) },

    listCard: {
        backgroundColor: '#fff', borderRadius: ms(16),
        borderWidth: 1, borderColor: '#F0F2F8',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: 'hidden',
    },
    rowDivider: { height: 1, backgroundColor: '#F0F2F8' },
    row: { flexDirection: 'row', alignItems: 'center', padding: scale(14), gap: scale(12) },
    docIcon: {
        width: scale(40), height: vs(40), borderRadius: ms(10),
        backgroundColor: '#EEF3FD', justifyContent: 'center', alignItems: 'center',
        flexShrink: 0,
    },
    rowBody:    { flex: 1 },
    rowTitle:   { fontSize: ms(13), fontWeight: '600', color: '#1A2744', lineHeight: vs(19) },
    rowMeta:    { fontSize: ms(11), color: '#9AADCA', marginTop: vs(3) },
    rowActions: { alignItems: 'center', gap: vs(2), flexShrink: 0 },
});

export default DownloadsScreen;
