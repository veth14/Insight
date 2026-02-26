import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Clipboard, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

// ─── Citation style tabs ────────────────────────────────────────────────────
const STYLES = ['APA 7th', 'MLA 9th', 'Chicago', 'IEEE'] as const;
type CitationStyle = typeof STYLES[number];

// ─── Mock study (replace with fetched data via route.params.studyId) ────────
const MOCK = {
    title: 'InsiQht: A Mobile-Based Centralized Repository for BSIT Capstone Projects and Student Research at Quezon City University',
    authors: ['Abando, A. G.', 'Albiola, E. E.', 'Ceriola, M. N. L.', 'Gambalan, J. M. V.', 'Landar, J. R. C.', 'Modelo, H. C. G.', 'Valmores, I. A. O.'],
    year: 2026,
    publisher: 'Quezon City University',
};

const buildCitation = (style: CitationStyle): string => {
    const { title, authors, year, publisher } = MOCK;
    const shortAuthors = authors.join(', ');
    switch (style) {
        case 'APA 7th':
            return `${shortAuthors} (${year}). ${title}. ${publisher}.`;
        case 'MLA 9th':
            return `${authors[0]}, et al. "${title}." ${publisher}, ${year}.`;
        case 'Chicago':
            return `${shortAuthors}. "${title}." ${publisher} (${year}).`;
        case 'IEEE':
            return `${authors.map((a, i) => `${i + 1 === 1 ? a : a}`).join(', ')}, "${title}," ${publisher}, ${year}.`;
    }
};

const CiteGeneratorScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const [activeStyle, setActiveStyle] = useState<CitationStyle>('APA 7th');
    const [copied, setCopied] = useState(false);

    const citation = buildCitation(activeStyle);

    const handleCopy = () => {
        Clipboard.setString(citation);
        setCopied(true);
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

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                {/* Study preview card */}
                <View style={styles.previewCard}>
                    <View style={styles.quoteBox}>
                        <Text style={styles.quoteChar}>”</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.previewTitle}>{MOCK.title}</Text>
                        <Text style={styles.previewAuthors} numberOfLines={1}>{MOCK.authors.join(', ')} ({MOCK.year})</Text>
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
                        <Text style={styles.citationText}>{citation}</Text>
                    </View>
                </View>

                {/* How to use */}
                <View style={styles.howCard}>
                    <Text style={styles.howTitle}>How to Use</Text>
                    {[
                        'Select your preferred citation style from the tabs above',
                        'Review the generated citation',
                        'Click "Copy" to copy to your clipboard',
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
                            Always verify citations with your institution's style guide. This is an automated tool and may require manual adjustments.
                        </Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },

    topBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F5F6FA',
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#E0E5F0',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
    },
    topBarTitle: { fontSize: 16, fontWeight: '800', color: '#0E1F43' },

    scroll: { padding: 16, paddingBottom: 110, gap: 14 },

    // Study preview
    previewCard: {
        backgroundColor: '#0E1F43', borderRadius: 16,
        padding: 24, flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    },
    quoteBox: {
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: 'rgba(255, 204, 0, 0.67)',
        justifyContent: 'center', alignItems: 'center',
    },
    quoteChar: {
        fontSize: 62, fontWeight: '900', color: '#fff',
        lineHeight: 72, textAlign: 'center', includeFontPadding: false,
    },
    previewTitle: { fontSize: 13, fontWeight: '800', color: '#fff', lineHeight: 19, marginBottom: 6 },
    previewAuthors: { fontSize: 11, color: 'rgba(255,255,255,0.55)' },

    // Style tabs
    styleRow: { flexDirection: 'row', gap: 8 },
    styleTab: {
        flex: 1, paddingVertical: 9, borderRadius: 20,
        borderWidth: 1.5, borderColor: '#D0D8E8',
        backgroundColor: '#fff', alignItems: 'center',
    },
    styleTabActive: { backgroundColor: '#0E1F43', borderColor: '#0E1F43' },
    styleTabText: { fontSize: 11, fontWeight: '700', color: '#9AADCA' },
    styleTabTextActive: { color: '#fff' },

    // Citation card
    citationCard: {
        backgroundColor: '#fff', borderRadius: 14,
        borderWidth: 1, borderColor: '#F0F2F8',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
        overflow: 'hidden',
    },
    citationCardHead: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10,
    },
    citationCardTitle: { fontSize: 13, fontWeight: '700', color: '#0E1F43' },
    copyBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
        backgroundColor: '#F0F2F8', borderWidth: 1, borderColor: '#E0E5F0',
    },
    copyBtnDone: { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' },
    copyBtnText: { fontSize: 11, fontWeight: '700', color: '#5A6A8A' },
    copyBtnTextDone: { color: '#2E7D32' },
    citationBox: {
        backgroundColor: '#F5F6FA', marginHorizontal: 14, marginBottom: 14,
        borderRadius: 10, padding: 12,
    },
    citationText: { fontSize: 12, color: '#3B4F70', lineHeight: 19 },

    // How to use
    howCard: {
        backgroundColor: '#fff', borderRadius: 14,
        borderWidth: 1, borderColor: '#F0F2F8',
        padding: 16, gap: 10,
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    howTitle: { fontSize: 13, fontWeight: '800', color: '#0E1F43', marginBottom: 2 },
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    stepNum: {
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: '#EEF1F8', justifyContent: 'center', alignItems: 'center',
        marginTop: 1,
    },
    stepNumText: { fontSize: 11, fontWeight: '800', color: '#0E1F43' },
    stepText: { fontSize: 12, color: '#5A6A8A', flex: 1, lineHeight: 18 },

    noteBox: {
        backgroundColor: 'rgba(255,191,0,0.1)', borderRadius: 10,
        padding: 10, marginTop: 4,
        borderWidth: 1, borderColor: 'rgba(255,191,0,0.25)',
    },
    noteText: { fontSize: 11, color: '#7A5800', lineHeight: 17 },
    noteBold: { fontWeight: '800' },
});

export default CiteGeneratorScreen;
