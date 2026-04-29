import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, StatusBar, ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { scale, vs, ms } from '../../utils/responsive';
import api from '../../services/api.service';

// ─── Citation style tabs ──────────────────────────────────────────────────────
const STYLES = ['APA 7th', 'MLA 9th', 'Chicago', 'IEEE'] as const;
type CitationStyle = typeof STYLES[number];

interface StudyMeta {
    title: string;
    authors: string[];
    yearPublished: number;
    category?: string;
    keywords?: string[];
}

// ─── Citation builders ────────────────────────────────────────────────────────
const PUBLISHER = 'Quezon City University';

function formatApaAuthor(name: string): string {
    // If already "Last, F." format, keep it. If "Firstname Lastname", convert.
    if (name.includes(',')) return name.trim();
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const last   = parts[parts.length - 1];
    const firsts = parts.slice(0, -1).map(p => p[0] + '.').join(' ');
    return `${last}, ${firsts}`;
}

function buildCitation(style: CitationStyle, study: StudyMeta): string {
    const { title, authors, yearPublished } = study;
    const year = yearPublished ?? new Date().getFullYear();

    switch (style) {
        case 'APA 7th': {
            const formatted = authors.map(formatApaAuthor);
            let authorStr: string;
            if (formatted.length === 1) {
                authorStr = formatted[0];
            } else if (formatted.length === 2) {
                authorStr = `${formatted[0]}, & ${formatted[1]}`;
            } else if (formatted.length <= 20) {
                authorStr = formatted.slice(0, -1).join(', ') + ', & ' + formatted[formatted.length - 1];
            } else {
                authorStr = formatted.slice(0, 19).join(', ') + ', \u2026 ' + formatted[formatted.length - 1];
            }
            return `${authorStr} (${year}). ${title}. ${PUBLISHER}.`;
        }
        case 'MLA 9th': {
            const first  = formatApaAuthor(authors[0]);
            const et_al  = authors.length > 1 ? ', et al.' : '.';
            return `${first}${et_al} \u201C${title}.\u201D ${PUBLISHER}, ${year}.`;
        }
        case 'Chicago': {
            const formatted = authors.map(formatApaAuthor);
            const authorStr = formatted.join(', ');
            return `${authorStr}. \u201C${title}.\u201D ${PUBLISHER} (${year}).`;
        }
        case 'IEEE': {
            const abbreviated = authors.map((name, i) => {
                const parts  = name.trim().replace(',', '').split(/\s+/);
                const last   = parts[parts.length - 1];
                const initials = parts.slice(0, -1).map(p => p[0] + '.').join(' ');
                return initials ? `${initials} ${last}` : last;
            });
            const authorStr = abbreviated.join(', ');
            return `${authorStr}, \u201C${title},\u201D ${PUBLISHER}, ${year}.`;
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────

const CiteGeneratorScreen: React.FC = () => {
    const navigation = useNavigation();
    const route      = useRoute<any>();
    const studyId    = route.params?.studyId as string | undefined;

    const [study, setStudy]           = useState<StudyMeta | null>(null);
    const [loading, setLoading]       = useState(!!studyId);
    const [activeStyle, setActiveStyle] = useState<CitationStyle>('APA 7th');
    const [copied, setCopied]         = useState(false);

    useEffect(() => {
        if (!studyId) return;
        (async () => {
            try {
                const res = await api.get(`/studies/${studyId}`);
                setStudy({
                    title:         res.data.title,
                    authors:       res.data.authors ?? [],
                    yearPublished: res.data.yearPublished ?? res.data.year ?? new Date().getFullYear(),
                    category:      res.data.category,
                    keywords:      res.data.keywords,
                });
            } catch (e) {
                console.error('CiteGenerator fetch error:', e);
            } finally {
                setLoading(false);
            }
        })();
    }, [studyId]);

    const citation = study ? buildCitation(activeStyle, study) : '';

    const handleCopy = async () => {
        await Clipboard.setStringAsync(citation);
        setCopied(true);
        
        // Track citation in backend
        if (studyId) {
            api.post(`/studies/${studyId}/cite`).catch(err => {
                console.error('Failed to track citation:', err);
            });
        }

        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <Ionicons name="chevron-back" size={20} color="#0E1F43" />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>Cite Generator</Text>
                <View style={{ width: 36 }} />
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#0E1F43" />
                </View>
            ) : !study ? (
                <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={48} color="#C0CDE8" />
                    <Text style={styles.emptyText}>Study data could not be loaded.</Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                    {/* Study preview card */}
                    <View style={styles.previewCard}>
                        <View style={styles.quoteBox}>
                            <Text style={styles.quoteChar}>&quot;</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.previewTitle}>{study.title}</Text>
                            <Text style={styles.previewAuthors} numberOfLines={1}>
                                {study.authors.join(', ')}{study.yearPublished ? ` (${study.yearPublished})` : ''}
                            </Text>
                        </View>
                    </View>

                    {/* Style selector */}
                    <View style={styles.styleRow}>
                        {STYLES.map(s => (
                            <TouchableOpacity
                                key={s}
                                style={[styles.styleTab, activeStyle === s && styles.styleTabActive]}
                                onPress={() => { setActiveStyle(s); setCopied(false); }}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.styleTabText, activeStyle === s && styles.styleTabTextActive]}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Citation output */}
                    <View style={styles.citationCard}>
                        <View style={styles.citationCardHead}>
                            <Text style={styles.citationCardTitle}>{activeStyle} Format</Text>
                            <TouchableOpacity
                                style={[styles.copyBtn, copied && styles.copyBtnDone]}
                                onPress={handleCopy}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name={copied ? 'checkmark' : 'copy-outline'}
                                    size={13}
                                    color={copied ? '#2E7D32' : '#5A6A8A'}
                                />
                                <Text style={[styles.copyBtnText, copied && styles.copyBtnTextDone]}>
                                    {copied ? 'Copied!' : 'Copy'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.citationBox}>
                            <Text style={styles.citationText} selectable>{citation}</Text>
                        </View>
                    </View>

                    {/* Study metadata chips */}
                    {(study.keywords?.length ?? 0) > 0 && (
                        <View style={styles.metaCard}>
                            <Text style={styles.metaCardTitle}>Keywords</Text>
                            <View style={styles.chipRow}>
                                {(study.keywords ?? []).map(kw => (
                                    <View key={kw} style={styles.chip}>
                                        <Text style={styles.chipText}>{kw}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* How to use */}
                    <View style={styles.howCard}>
                        <Text style={styles.howTitle}>How to Use</Text>
                        {[
                            'Select your preferred citation style from the tabs above',
                            'Review the generated citation',
                            'Tap \u201CCopy\u201D to copy it to your clipboard',
                            'Paste into your reference list or bibliography',
                        ].map((step, i) => (
                            <View key={i} style={styles.stepRow}>
                                <View style={styles.stepNum}>
                                    <Text style={styles.stepNumText}>{i + 1}</Text>
                                </View>
                                <Text style={styles.stepText}>{step}</Text>
                            </View>
                        ))}

                        <View style={styles.noteBox}>
                            <Text style={styles.noteText}>
                                <Text style={styles.noteBold}>Note: </Text>
                                Always verify citations with your institution&apos;s style guide. This is an automated tool and may require manual adjustments.
                            </Text>
                        </View>
                    </View>

                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: vs(10) },
    emptyText: { fontSize: ms(14), color: '#9AADCA', textAlign: 'center' },

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

    scroll: { padding: scale(16), paddingBottom: vs(110), gap: vs(14) },

    // Study preview
    previewCard: {
        backgroundColor: '#0E1F43', borderRadius: ms(16),
        padding: scale(24), flexDirection: 'row', gap: scale(12), alignItems: 'flex-start',
    },
    quoteBox: {
        width: scale(40), height: vs(40), borderRadius: ms(10),
        backgroundColor: 'rgba(255,204,0,0.67)',
        justifyContent: 'center', alignItems: 'center',
    },
    quoteChar: {
        fontSize: ms(62), fontWeight: '900', color: '#fff',
        lineHeight: vs(72), textAlign: 'center', includeFontPadding: false,
    },
    previewTitle:   { fontSize: ms(13), fontWeight: '800', color: '#fff', lineHeight: vs(19), marginBottom: vs(6) },
    previewAuthors: { fontSize: ms(11), color: 'rgba(255,255,255,0.55)' },

    // Style tabs
    styleRow:     { flexDirection: 'row', gap: scale(8) },
    styleTab:     {
        flex: 1, paddingVertical: vs(9), borderRadius: ms(20),
        borderWidth: 1.5, borderColor: '#D0D8E8',
        backgroundColor: '#fff', alignItems: 'center',
    },
    styleTabActive:     { backgroundColor: '#0E1F43', borderColor: '#0E1F43' },
    styleTabText:       { fontSize: ms(11), fontWeight: '700', color: '#9AADCA' },
    styleTabTextActive: { color: '#fff' },

    // Citation card
    citationCard: {
        backgroundColor: '#fff', borderRadius: ms(14),
        borderWidth: 1, borderColor: '#F0F2F8',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, overflow: 'hidden',
    },
    citationCardHead: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: scale(14), paddingTop: vs(14), paddingBottom: vs(10),
    },
    citationCardTitle: { fontSize: ms(13), fontWeight: '700', color: '#0E1F43' },
    copyBtn: {
        flexDirection: 'row', alignItems: 'center', gap: scale(4),
        paddingHorizontal: scale(10), paddingVertical: vs(5), borderRadius: ms(20),
        backgroundColor: '#F0F2F8', borderWidth: 1, borderColor: '#E0E5F0',
    },
    copyBtnDone:     { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' },
    copyBtnText:     { fontSize: ms(11), fontWeight: '700', color: '#5A6A8A' },
    copyBtnTextDone: { color: '#2E7D32' },
    citationBox: {
        backgroundColor: '#F5F6FA', marginHorizontal: scale(14), marginBottom: vs(14),
        borderRadius: ms(10), padding: scale(12),
    },
    citationText: { fontSize: ms(12), color: '#3B4F70', lineHeight: vs(19) },

    // Keywords chip row
    metaCard: {
        backgroundColor: '#fff', borderRadius: ms(14),
        borderWidth: 1, borderColor: '#F0F2F8', padding: scale(14), gap: vs(8),
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    metaCardTitle: { fontSize: ms(12), fontWeight: '700', color: '#0E1F43' },
    chipRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: scale(7) },
    chip:          { backgroundColor: '#EEF1F8', borderRadius: ms(20), paddingHorizontal: scale(11), paddingVertical: vs(4) },
    chipText:      { fontSize: ms(11), fontWeight: '600', color: '#3B4F70' },

    // How to use
    howCard: {
        backgroundColor: '#fff', borderRadius: ms(14),
        borderWidth: 1, borderColor: '#F0F2F8',
        padding: scale(16), gap: vs(10),
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    howTitle: { fontSize: ms(13), fontWeight: '800', color: '#0E1F43', marginBottom: vs(2) },
    stepRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: scale(10) },
    stepNum:  {
        width: scale(20), height: vs(20), borderRadius: ms(10),
        backgroundColor: '#EEF1F8', justifyContent: 'center', alignItems: 'center', marginTop: vs(1),
    },
    stepNumText: { fontSize: ms(11), fontWeight: '800', color: '#0E1F43' },
    stepText:    { fontSize: ms(12), color: '#5A6A8A', flex: 1, lineHeight: vs(18) },

    noteBox: {
        backgroundColor: 'rgba(255,191,0,0.1)', borderRadius: ms(10), padding: scale(10), marginTop: vs(4),
        borderWidth: 1, borderColor: 'rgba(255,191,0,0.25)',
    },
    noteText: { fontSize: ms(11), color: '#7A5800', lineHeight: vs(17) },
    noteBold: { fontWeight: '800' },
});

export default CiteGeneratorScreen;
