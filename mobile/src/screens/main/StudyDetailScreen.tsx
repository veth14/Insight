import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types';
import { scale, vs, ms } from '../../utils/responsive';
import api from '../../services/api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import CustomAlert, { AlertButton } from '../../components/CustomAlert';

type Nav   = NativeStackNavigationProp<HomeStackParamList>;
type Route = RouteProp<HomeStackParamList, 'StudyDetail'>;

// ─────────────────────────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
    'Education':                  { bg: 'rgba(255,191,0,0.18)',   text: '#FFBF00' },
    'Mobile App':                 { bg: 'rgba(47,128,237,0.18)',  text: '#2F80ED' },
    'Cloud-Based API':            { bg: 'rgba(233,124,58,0.18)',  text: '#E97C3A' },
    'Artificial Intelligence':    { bg: 'rgba(139,92,246,0.18)',  text: '#8B5CF6' },
    'Information Technology':     { bg: 'rgba(16,185,129,0.18)', text: '#10B981' },
};
const DEFAULT_TAG = { bg: '#ECEEF5', text: '#5A6A8A' };

interface SectionProps { icon: string; title: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; }
const Section: React.FC<SectionProps> = ({ icon, title, children, defaultOpen = true }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <View style={styles.section}>
            <TouchableOpacity style={styles.sectionHead} onPress={() => setOpen(o => !o)} activeOpacity={0.8}>
                <View style={styles.sectionIconBox}>
                    <Ionicons name={icon as any} size={14} color="#0E1F43" />
                </View>
                <Text style={styles.sectionTitle}>{title}</Text>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#9AADCA" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            {open && <View style={styles.sectionBody}>{children}</View>}
        </View>
    );
};

// ─────────────────────────────────────────────────────────────────────────────

const DOWNLOADS_KEY = '@insight_downloads';

const StudyDetailScreen: React.FC = () => {
    const navigation = useNavigation<Nav>();
    const route      = useRoute<Route>();
    const { studyId } = route.params;

    const [study, setStudy]       = useState<any | null>(null);
    const [loading, setLoading]   = useState(true);
    const [saved, setSaved]       = useState(false);
    const [saving, setSaving]     = useState(false);
    const [downloading, setDownloading] = useState(false);
    
    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean; title: string; message: string; buttons?: AlertButton[]; icon?: any; iconColor?: string;
    }>({ visible: false, title: '', message: '' });

    const showAlert = (title: string, message: string, buttons?: AlertButton[], icon?: any, iconColor?: string) => {
        setAlertConfig({ visible: true, title, message, buttons, icon, iconColor });
    };

    const showAiInfo = () => {
        showAlert('AI Summary', 'The Abstract, Methodology and Key Findings may be AI-assisted.\n\nWhen available, the server extracts text from the uploaded PDF and calls the Google Gemini generative AI to produce a structured JSON summary (abstract, methodology, key findings). If the AI call fails the original user-provided fields are used.',
            [{ text: 'OK', style: 'cancel' }], 'information-circle', '#3B82F6');
    };

    const fetchStudy = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/studies/${studyId}`);
            setStudy(res.data);
            setSaved(!!res.data.isBookmarked);
        } catch (err: any) {
            showAlert('Error', 'Failed to load study details.', undefined, 'alert-circle', '#EF4444');
            // We can delay goBack or just let user tap ok, but for now just showing the error
        } finally {
            setLoading(false);
        }
    }, [studyId]);

    useEffect(() => { fetchStudy(); }, [fetchStudy]);

    const handleToggleSave = async () => {
        if (!study || saving) return;
        setSaving(true);
        try {
            await api.post(`/studies/${studyId}/bookmark`);
            const nextSaved = !saved;
            setSaved(nextSaved);
            if (nextSaved) {
                showAlert('Saved', 'Study added to your library.', undefined, 'bookmark', '#E97C3A');
            } else {
                showAlert('Removed', 'Study removed from your library.', undefined, 'bookmark-outline', '#9AADCA');
            }
        } catch (err) {
            showAlert('Error', 'Could not update bookmark.', undefined, 'alert-circle', '#EF4444');
        } finally {
            setSaving(false);
        }
    };

    const handleDownload = async () => {
        if (!study || downloading || !study.fileUrl) {
            showAlert('No Document', 'There is no document to download.', undefined, 'document-text-outline', '#9AADCA');
            return;
        }
        setDownloading(true);
        try {
            const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
            const current: any[] = raw ? JSON.parse(raw) : [];
            const alreadyExists = current.some((d: any) => d.id === studyId);
            
            if (!alreadyExists) {
                // Download file locally using expo-file-system
                const fileName = `study_${studyId}.pdf`;
                const fileUri = `${FileSystem.documentDirectory}${fileName}`;
                
                const downloadResult = await FileSystem.downloadAsync(study.fileUrl, fileUri);
                
                if (downloadResult.status !== 200) throw new Error('Download failed');

                // Record download count on backend
                try {
                    await api.post(`/studies/${studyId}/download`);
                } catch (be) {
                    console.log('Failed to increment download count:', be);
                }

                const fileInfo = await FileSystem.getInfoAsync(fileUri);
                const sizeMB = fileInfo.exists && !fileInfo.isDirectory && fileInfo.size ? fileInfo.size / (1024 * 1024) : 0;

                const entry = {
                    id:     studyId,
                    title:  study.title,
                    sizeMB: sizeMB,
                    date:   new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    fileUrl: study.fileUrl,
                    localUri: fileUri, // Save the path for offline use
                };
                await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify([entry, ...current]));
                showAlert(
                    'Downloaded',
                    'Study saved to your Downloads for offline reading.',
                    [
                        { text: 'OK', style: 'cancel' },
                        { text: 'Go to Downloads', style: 'default', onPress: () => navigation.navigate('Downloads') }
                    ],
                    'checkmark-circle',
                    '#10B981'
                );
            } else {
                showAlert('Already Downloaded', 'This study is already in your Downloads.', undefined, 'information-circle', '#3B82F6');
            }
        } catch (err: any) {
            console.error('Download error:', err);
            showAlert('Error', 'Could not save download.', undefined, 'alert-circle', '#EF4444');
        } finally {
            setDownloading(false);
        }
    };

    const tagColor = (tag: string) => TAG_COLORS[tag] ?? DEFAULT_TAG;

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                        <Ionicons name="chevron-back" size={20} color="#0E1F43" />
                    </TouchableOpacity>
                    <Text style={styles.topBarTitle}>Study Details</Text>
                    <View style={{ width: 36 }} />
                </View>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#0E1F43" />
                </View>
            </SafeAreaView>
        );
    }

    if (!study) return null;

    const tags     = study.keywords ?? [];
    const authors  = Array.isArray(study.authors) ? study.authors.join(', ') : study.authors;
    const year     = study.yearPublished ?? study.year ?? '';
    const category = study.category ?? study.studyType ?? '';
    const department = study.department ?? '';
    const tools    = study.toolsUsed ?? [];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />

            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <Ionicons name="chevron-back" size={20} color="#0E1F43" />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>Study Details</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                {/* Hero card */}
                <View style={styles.heroCard}>
                    {/* Tags / keywords */}
                    {tags.length > 0 && (
                        <View style={styles.tagRow}>
                            {tags.slice(0, 4).map((tag: string) => (
                                <View key={tag} style={[styles.tag, { backgroundColor: tagColor(tag).bg }]}>
                                    <Text style={[styles.tagText, { color: tagColor(tag).text }]}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Title */}
                    <Text style={styles.heroTitle}>{study.title}</Text>

                    {/* Authors */}
                    <View style={styles.metaRow}>
                        <Ionicons name="people-outline" size={13} color="rgba(255,255,255,0.55)" />
                        <Text style={styles.metaText} numberOfLines={2}>{authors}</Text>
                    </View>

                    {/* Year + Category */}
                    <View style={styles.metaRow}>
                        <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.55)" />
                        <Text style={styles.metaText}>{year}</Text>
                        {!!department && (
                            <View style={styles.programBadge}>
                                <Text style={styles.programText}>{department}</Text>
                            </View>
                        )}
                        {!!category && (
                            <View style={styles.programBadge}>
                                <Text style={styles.programText}>{category}</Text>
                            </View>
                        )}
                    </View>

                    {/* Action buttons */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionBtn} onPress={handleToggleSave} activeOpacity={0.8} disabled={saving}>
                            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={15} color={saved ? '#E97C3A' : '#fff'} />
                            <Text style={styles.actionBtnText}>{saved ? 'Saved' : 'Save'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtn} onPress={handleDownload} activeOpacity={0.8} disabled={downloading}>
                            {downloading
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Ionicons name="download-outline" size={15} color="#fff" />
                            }
                            <Text style={styles.actionBtnText}>Download</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, styles.actionBtnAccent]}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('CiteGenerator', { studyId })}
                        >
                            <Ionicons name="copy-outline" size={15} color="#0E1F43" />
                            <Text style={[styles.actionBtnText, { color: '#0E1F43' }]}>Cite</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Read PDF button */}
                    {!!study.fileUrl && (
                        <TouchableOpacity
                            style={styles.readBtn}
                            activeOpacity={0.85}
                            onPress={() => navigation.navigate('PDFReader', { studyId })}
                        >
                            <Ionicons name="reader-outline" size={16} color="#0E1F43" />
                            <Text style={styles.readBtnText}>Read Full Document</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Sections */}
                {!!study.abstract && (
                    <Section icon="document-text-outline" title={
                        <>
                            Abstract
                            <TouchableOpacity onPress={showAiInfo} style={{ marginLeft: 8 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Ionicons name="information-circle" size={14} color="#9AADCA" />
                            </TouchableOpacity>
                        </>
                    }>
                        <Text style={styles.bodyText}>{study.abstract}</Text>
                    </Section>
                )}

                {!!study.methodology && (
                    <Section icon="flask-outline" title={
                        <>
                            Methodology
                            <TouchableOpacity onPress={showAiInfo} style={{ marginLeft: 8 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Ionicons name="information-circle" size={14} color="#9AADCA" />
                            </TouchableOpacity>
                        </>
                    }>
                        <Text style={styles.bodyText}>{study.methodology}</Text>
                    </Section>
                )}

                {!!study.keyFindings && (
                    <Section icon="checkmark-done-outline" title={
                        <>
                            Key Findings
                            <TouchableOpacity onPress={showAiInfo} style={{ marginLeft: 8 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Ionicons name="information-circle" size={14} color="#9AADCA" />
                            </TouchableOpacity>
                        </>
                    }>
                        {typeof study.keyFindings === 'string' ? (
                            study.keyFindings.split(/\r?\n|\u2022|\u2023|\u25E6|\-|\u2023/).map((line: string, idx: number) => {
                                const text = line.trim();
                                if (!text) return null;
                                return (
                                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: vs(6) }}>
                                        <Text style={[styles.bodyText, { marginRight: scale(8) }]}>•</Text>
                                        <Text style={[styles.bodyText, { flex: 1 }]}>{text}</Text>
                                    </View>
                                );
                            })
                        ) : (
                            <Text style={styles.bodyText}>{JSON.stringify(study.keyFindings)}</Text>
                        )}
                    </Section>
                )}

                {tools.length > 0 && (
                    <Section icon="construct-outline" title="Tools and Technology">
                        <View style={styles.chipWrap}>
                            {tools.map((tool: string) => (
                                <View key={tool} style={styles.toolChip}>
                                    <Text style={styles.toolChipText}>{tool}</Text>
                                </View>
                            ))}
                        </View>
                    </Section>
                )}

            </ScrollView>

            <CustomAlert 
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                icon={alertConfig.icon}
                iconColor={alertConfig.iconColor}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    centered:  { flex: 1, justifyContent: 'center', alignItems: 'center' },

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

    scroll: { paddingHorizontal: scale(16), paddingBottom: vs(110), gap: vs(12) },

    heroCard: {
        backgroundColor: '#0E1F43', borderRadius: ms(18), padding: scale(18), gap: vs(10),
    },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(6) },
    tag:    { paddingHorizontal: scale(10), paddingVertical: vs(4), borderRadius: ms(20) },
    tagText: { fontSize: ms(11), fontWeight: '700' },

    heroTitle: { fontSize: ms(15), fontWeight: '800', color: '#fff', lineHeight: vs(22) },
    metaRow:   { flexDirection: 'row', alignItems: 'center', gap: scale(6) },
    metaText:  { fontSize: ms(12), color: 'rgba(255,255,255,0.65)', flex: 1 },
    programBadge: {
        backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: ms(20),
        paddingHorizontal: scale(9), paddingVertical: vs(3),
    },
    programText: { fontSize: ms(11), fontWeight: '700', color: '#fff' },

    actionRow: { flexDirection: 'row', gap: scale(8), marginTop: vs(4) },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', gap: scale(5),
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: ms(20), paddingHorizontal: scale(14), paddingVertical: vs(7),
    },
    actionBtnAccent: { backgroundColor: '#E97C3A', borderColor: '#E97C3A' },
    actionBtnText:   { fontSize: ms(12), fontWeight: '700', color: '#fff' },

    readBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(8),
        backgroundColor: '#fff', borderRadius: ms(12), paddingVertical: vs(10),
        marginTop: vs(4),
    },
    readBtnText: { fontSize: ms(14), fontWeight: '700', color: '#0E1F43' },

    section: {
        backgroundColor: '#fff', borderRadius: ms(14),
        borderWidth: 1, borderColor: '#F0F2F8',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, overflow: 'hidden',
    },
    sectionHead: {
        flexDirection: 'row', alignItems: 'center',
        gap: scale(8), padding: scale(14),
    },
    sectionIconBox: {
        width: scale(26), height: vs(26), borderRadius: ms(7),
        backgroundColor: '#F0F2F8', justifyContent: 'center', alignItems: 'center',
    },
    sectionTitle: { fontSize: ms(13), fontWeight: '700', color: '#0E1F43' },
    sectionBody:  {
        paddingHorizontal: scale(14), paddingBottom: vs(14), paddingTop: 0,
        borderTopWidth: 1, borderTopColor: '#F5F6FA',
    },
    bodyText: { fontSize: ms(13), color: '#5A6A8A', lineHeight: vs(20) },

    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(7) },
    toolChip: {
        backgroundColor: '#EEF1F8', borderRadius: ms(20),
        paddingHorizontal: scale(11), paddingVertical: vs(5),
    },
    toolChipText: { fontSize: ms(11), fontWeight: '600', color: '#3B4F70' },
});

export default StudyDetailScreen;
