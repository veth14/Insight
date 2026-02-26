import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { scale, vs, ms } from '../../utils/responsive';

// ── Types ──────────────────────────────────────────────────────────────────────

type Item = { text: string };
type Block =
    | { kind: 'para'; text: string }
    | { kind: 'bullets'; items: Item[] };

type Section = {
    title: string;
    blocks: Block[];
};

// ── Content ────────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
    {
        title: 'Acceptance of Terms',
        blocks: [
            { kind: 'para', text: 'By accessing or using the InsiQht application, you agree to comply with these Terms of Use.' },
            { kind: 'para', text: 'If you do not agree, you should not use the application.' },
        ],
    },
    {
        title: 'Purpose of the Application',
        blocks: [
            { kind: 'para', text: 'The platform is designed to:' },
            {
                kind: 'bullets', items: [
                    { text: 'Provide access to BSIT capstone projects' },
                    { text: 'Support academic research' },
                    { text: 'Allow students to upload scholarly work' },
                    { text: 'Help users discover learning materials' },
                ],
            },
        ],
    },
    {
        title: 'User Accounts',
        blocks: [
            { kind: 'para', text: 'Users must:' },
            {
                kind: 'bullets', items: [
                    { text: 'Register using valid university information' },
                    { text: 'Maintain the confidentiality of their accounts' },
                    { text: 'Use the platform for educational purposes only' },
                ],
            },
            { kind: 'para', text: 'The administration reserves the right to suspend accounts that violate policies.' },
        ],
    },
    {
        title: 'Content Submission',
        blocks: [
            { kind: 'para', text: 'When uploading projects or research:' },
            { kind: 'para', text: 'Users confirm that:' },
            {
                kind: 'bullets', items: [
                    { text: 'The work is their own' },
                    { text: 'Proper citations are included' },
                    { text: 'The content does not violate copyright or academic rules' },
                ],
            },
            { kind: 'para', text: 'Administrators may approve or reject submissions.' },
        ],
    },
    {
        title: 'Prohibited Activities',
        blocks: [
            { kind: 'para', text: 'Users are not allowed to:' },
            {
                kind: 'bullets', items: [
                    { text: 'Upload plagiarized work' },
                    { text: 'Attempt unauthorized access to accounts' },
                    { text: 'Manipulate analytics or system data' },
                    { text: 'Upload malicious files' },
                    { text: 'Harass or impersonate other users' },
                ],
            },
            { kind: 'para', text: 'Violations may result in account suspension.' },
        ],
    },
    {
        title: 'Intellectual Property',
        blocks: [
            { kind: 'para', text: 'All uploaded research remains the intellectual property of the original authors.' },
            { kind: 'para', text: 'By uploading content, users grant the platform permission to store, display, and distribute the material for academic purposes.' },
        ],
    },
    {
        title: 'System Availability',
        blocks: [
            { kind: 'para', text: 'We strive to maintain reliable access, but we do not guarantee that the application will always be available without interruption.' },
            { kind: 'para', text: 'Maintenance or updates may temporarily affect access.' },
        ],
    },
    {
        title: 'Termination of Access',
        blocks: [
            { kind: 'para', text: 'Administrators may suspend or terminate accounts if users:' },
            {
                kind: 'bullets', items: [
                    { text: 'Violate the Terms of Use' },
                    { text: 'Upload inappropriate content' },
                    { text: 'Abuse the system' },
                ],
            },
        ],
    },
    {
        title: 'Limitation of Liability',
        blocks: [
            { kind: 'para', text: 'The application and its developers are not responsible for:' },
            {
                kind: 'bullets', items: [
                    { text: 'misuse of research content' },
                    { text: 'academic misconduct by users' },
                    { text: 'loss of data due to technical issues' },
                ],
            },
        ],
    },
    {
        title: 'Updates to Terms',
        blocks: [
            { kind: 'para', text: 'These terms may be updated as the application evolves. Continued use of the platform means acceptance of the updated terms.' },
        ],
    },
];

// ── Screen ─────────────────────────────────────────────────────────────────────

const TermsOfUseScreen: React.FC = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#ECEEF8" />

            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <Ionicons name="chevron-back" size={ms(20)} color="#0E1F43" />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>Terms of Use</Text>
                <View style={{ width: scale(22) }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >
                {/* App meta header */}
                <Text style={styles.metaApp}>InsiQht Mobile Application</Text>
                <Text style={styles.metaDate}>Last Updated: February 2026</Text>

                <View style={{ height: vs(16) }} />

                {SECTIONS.map((section, i) => (
                    <View key={i} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        {section.blocks.map((block, j) => {
                            if (block.kind === 'para') {
                                return (
                                    <Text key={j} style={styles.bodyText}>{block.text}</Text>
                                );
                            }
                            return (
                                <View key={j} style={styles.bulletList}>
                                    {block.items.map((item, k) => (
                                        <View key={k} style={styles.bulletRow}>
                                            <Text style={styles.bulletDot}>{'\u2022'}</Text>
                                            <Text style={styles.bulletText}>{item.text}</Text>
                                        </View>
                                    ))}
                                </View>
                            );
                        })}
                    </View>
                ))}

                {/* Contact block */}
                <View style={styles.contactBlock}>
                    <Text style={styles.contactLabel}>Contact</Text>
                    <Text style={styles.contactBody}>
                        For questions regarding this Privacy Policy, contact:
                    </Text>
                    <Text style={styles.contactEmail}>InsiqhtMobileApp@qcu.ph</Text>
                </View>

                <View style={{ height: vs(32) }} />
            </ScrollView>
        </SafeAreaView>
    );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ECEEF8',
    },

    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: scale(16),
        paddingVertical: vs(12),
        backgroundColor: '#ECEEF8',
    },
    backBtn: {
        width: scale(36), height: vs(36), borderRadius: ms(10),
        backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#E0E5F0',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
    },
    topBarTitle: {
        fontSize: ms(15),
        fontWeight: '700',
        color: '#0E1F43',
    },
    divider: {
        height: 0,
        backgroundColor: 'transparent',
    },

    scroll: {
        paddingHorizontal: scale(20),
        paddingTop: vs(20),
        paddingBottom: vs(20),
    },

    metaApp: {
        fontSize: ms(15),
        fontWeight: '700',
        color: '#0E1F43',
        textAlign: 'center',
    },
    metaDate: {
        fontSize: ms(12),
        color: '#666',
        textAlign: 'center',
        marginTop: vs(3),
    },

    section: {
        marginBottom: vs(16),
    },
    sectionTitle: {
        fontSize: ms(13),
        fontWeight: '700',
        color: '#111',
        marginBottom: vs(4),
    },
    bodyText: {
        fontSize: ms(13),
        color: '#333',
        lineHeight: vs(21),
        marginBottom: vs(2),
    },

    bulletList: {
        marginBottom: vs(2),
        paddingLeft: scale(4),
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: vs(2),
    },
    bulletDot: {
        fontSize: ms(13),
        color: '#333',
        marginRight: scale(6),
        lineHeight: vs(21),
    },
    bulletText: {
        fontSize: ms(13),
        color: '#333',
        lineHeight: vs(21),
        flex: 1,
    },

    contactBlock: {
        marginTop: vs(24),
        paddingTop: vs(20),
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#D8DBEA',
    },
    contactLabel: {
        fontSize: ms(13),
        fontStyle: 'italic',
        color: '#555',
        marginBottom: vs(4),
    },
    contactBody: {
        fontSize: ms(13),
        fontStyle: 'italic',
        color: '#555',
        textAlign: 'center',
    },
    contactEmail: {
        fontSize: ms(13),
        fontStyle: 'italic',
        color: '#555',
        textAlign: 'center',
        marginTop: vs(2),
    },
});

export default TermsOfUseScreen;
