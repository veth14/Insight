import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types';
import { scale, vs, ms } from '../../utils/responsive';

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type Route = RouteProp<HomeStackParamList, 'StudyDetail'>;

// ─── Mock study data (replace with API call using route.params.studyId) ────────
const MOCK_STUDY = {
    id: '1',
    title: 'InsiQht: A Mobile-Based Centralized Repository for BSIT Capstone Projects and Student Research at Quezon City University',
    authors: ['Abella', 'Alboro', 'Omas', 'San Juan', 'Lazaro', 'Vicente', 'Geli Saber', 'Lopez, Vicente, and Nathaniel'],
    year: 2025,
    program: 'BSIT',
    tags: ['Education', 'Mobile App', 'Cloud-Based API'],
    abstract: 'A secure mobile application serving as the official Quezon City University repository for digitized academic theses, literatures, and capstone projects. It restricts access to institutional members and provides a structured environment for navigating past research to identify future study opportunities.',
    methodology: 'The Project follows the Agile Methodology, an iterative process that allows for continuous feedback, easy customization, and feature refinement to ensure all user requirements are met.',
    conclusion: 'This project will enhance students\' and faculty members\' ability to access, manage, and utilize academic research through a centralized mobile platform while applying emerging technologies in application development. It is expected to improve research visibility, reduce duplication of studies, and strengthen students\' practical skills in designing and developing modern mobile-based systems.',
    tools: ['Artificial Intelligence (AI)', 'Internet of Things (IoT)', 'Augmented Reality (AR)', 'Dart', 'Blockchain', 'Cloud-Based API Services', 'Cross-Platform Mobile', 'Flutter', 'Visual Studio Code', 'Android SDK', 'Firebase Authentication', 'Backend REST API', 'Mongo DB'],
    limitations: 'The app will only be accessible to Quezon City University users and will not support public or external access. The app cannot guarantee 100% accuracy in its AI-based features since its responses heavily rely on the quality of available data and user inputs. The app will not replace official university systems for thesis submission, grading, or document approval. The app cannot prevent plagiarism entirely, but only helps reduce duplication through organization and search features. The app\'s performance may depend on internet connectivity, device compatibility, and server stability. This project is limited to mobile platforms only and does not include a full desktop or web-based version. The content availability depends on the number of uploaded studies, which may initially be limited.',
    futureRecommendation: 'In the future, the system may be enhanced by integrating Artificial Intelligence (AI) to improve research gap detection, automate abstract summarization, and provide smarter study recommendations based on user behavior and preferences.\nA web-based version of the platform may also be developed to support desktop users and provide wider accessibility across devices.',
};

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
    'Education':        { bg: 'rgba(255, 191,  0, 0.18)', text: '#FFBF00' },
    'Mobile App':       { bg: 'rgba( 47, 128, 237, 0.18)', text: '#2F80ED' },
    'Cloud-Based API':  { bg: 'rgba(233, 124,  58, 0.18)', text: '#E97C3A' },
    'Cloud-based API':  { bg: 'rgba(233, 124,  58, 0.18)', text: '#E97C3A' },
};

const DEFAULT_TAG = { bg: '#ECEEF5', text: '#5A6A8A' };

interface SectionProps { icon: string; title: string; children: React.ReactNode; defaultOpen?: boolean; }

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

const StudyDetailScreen: React.FC = () => {
    const navigation = useNavigation<Nav>();
    const study = MOCK_STUDY;
    const [saved, setSaved] = useState(false);

    const tagColor = (tag: string) => TAG_COLORS[tag] ?? DEFAULT_TAG;

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
                    {/* Tags */}
                    <View style={styles.tagRow}>
                        {study.tags.map(tag => (
                            <View key={tag} style={[styles.tag, { backgroundColor: tagColor(tag).bg }]}>
                                <Text style={[styles.tagText, { color: tagColor(tag).text }]}>{tag}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Title */}
                    <Text style={styles.heroTitle}>{study.title}</Text>

                    {/* Authors */}
                    <View style={styles.metaRow}>
                        <Ionicons name="people-outline" size={13} color="rgba(255,255,255,0.55)" />
                        <Text style={styles.metaText} numberOfLines={2}>{study.authors.join(', ')}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.55)" />
                        <Text style={styles.metaText}>{study.year}</Text>
                        <View style={styles.programBadge}>
                            <Text style={styles.programText}>{study.program}</Text>
                        </View>
                    </View>

                    {/* Action buttons */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => setSaved(s => !s)} activeOpacity={0.8}>
                            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={15} color={saved ? '#E97C3A' : '#fff'} />
                            <Text style={styles.actionBtnText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
                            <Ionicons name="download-outline" size={15} color="#fff" />
                            <Text style={styles.actionBtnText}>Download</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnAccent]} activeOpacity={0.8} onPress={() => navigation.navigate('CiteGenerator', { studyId: study.id })}>
                            <Ionicons name="copy-outline" size={15} color="#0E1F43" />
                            <Text style={[styles.actionBtnText, { color: '#0E1F43' }]}>Cite</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Sections */}
                <Section icon="document-text-outline" title="Abstract">
                    <Text style={styles.bodyText}>{study.abstract}</Text>
                </Section>

                <Section icon="flask-outline" title="Methodology">
                    <Text style={styles.bodyText}>{study.methodology}</Text>
                </Section>

                <Section icon="checkmark-done-outline" title="Conclusion">
                    <Text style={styles.bodyText}>{study.conclusion}</Text>
                </Section>

                <Section icon="construct-outline" title="Tools and Technology">
                    <View style={styles.chipWrap}>
                        {study.tools.map(tool => (
                            <View key={tool} style={styles.toolChip}>
                                <Text style={styles.toolChipText}>{tool}</Text>
                            </View>
                        ))}
                    </View>
                </Section>

                <Section icon="warning-outline" title="Limitations" defaultOpen={false}>
                    <Text style={styles.bodyText}>{study.limitations}</Text>
                </Section>

                <Section icon="bulb-outline" title="Future Recommendation" defaultOpen={false}>
                    <Text style={styles.bodyText}>{study.futureRecommendation}</Text>
                </Section>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },

    topBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: scale(16), paddingVertical: vs(10),
        backgroundColor: '#F5F6FA',
    },
    backBtn: {
        width: scale(36), height: vs(36), borderRadius: ms(10),
        backgroundColor: '#fff',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#E0E5F0',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
    },
    topBarTitle: { fontSize: ms(16), fontWeight: '800', color: '#0E1F43' },

    scroll: { paddingHorizontal: scale(16), paddingBottom: vs(110), gap: vs(12) },

    // Hero card
    heroCard: {
        backgroundColor: '#0E1F43',
        borderRadius: ms(18),
        padding: scale(18),
        gap: vs(10),
    },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(6) },
    tag: { paddingHorizontal: scale(10), paddingVertical: vs(4), borderRadius: ms(20) },
    tagText: { fontSize: ms(11), fontWeight: '700' },
    heroTitle: { fontSize: ms(15), fontWeight: '800', color: '#fff', lineHeight: vs(22) },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: scale(6) },
    metaText: { fontSize: ms(12), color: 'rgba(255,255,255,0.65)', flex: 1 },
    programBadge: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: ms(20), paddingHorizontal: scale(9), paddingVertical: vs(3),
    },
    programText: { fontSize: ms(11), fontWeight: '700', color: '#fff' },

    actionRow: { flexDirection: 'row', gap: scale(8), marginTop: vs(4) },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', gap: scale(5),
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: ms(20), paddingHorizontal: scale(14), paddingVertical: vs(7),
    },
    actionBtnAccent: {
        backgroundColor: '#E97C3A', borderColor: '#E97C3A',
    },
    actionBtnText: { fontSize: ms(12), fontWeight: '700', color: '#fff' },

    // Section
    section: {
        backgroundColor: '#fff',
        borderRadius: ms(14),
        borderWidth: 1, borderColor: '#F0F2F8',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
        overflow: 'hidden',
    },
    sectionHead: {
        flexDirection: 'row', alignItems: 'center',
        gap: scale(8), padding: scale(14),
    },
    sectionIconBox: {
        width: scale(26), height: vs(26), borderRadius: ms(7),
        backgroundColor: '#F0F2F8',
        justifyContent: 'center', alignItems: 'center',
    },
    sectionTitle: { fontSize: ms(13), fontWeight: '700', color: '#0E1F43' },
    sectionBody: {
        paddingHorizontal: scale(14), paddingBottom: vs(14), paddingTop: 0,
        borderTopWidth: 1, borderTopColor: '#F5F6FA',
    },
    bodyText: { fontSize: ms(13), color: '#5A6A8A', lineHeight: vs(20) },

    // Tool chips
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(7) },
    toolChip: {
        backgroundColor: '#EEF1F8',
        borderRadius: ms(20), paddingHorizontal: scale(11), paddingVertical: vs(5),
    },
    toolChipText: { fontSize: ms(11), fontWeight: '600', color: '#3B4F70' },
});

export default StudyDetailScreen;
