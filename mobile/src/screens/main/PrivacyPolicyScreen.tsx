import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { scale, vs, ms } from '../../utils/responsive';

// ── Types ──────────────────────────────────────────────────────────────────────

type Subsection = { subtitle: string; body: string };
type Section = {
    title: string;
    body?: string;
    subsections?: Subsection[];
    contact?: boolean;
};

// ── Content ────────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
    {
        title: 'Introduction',
        body: 'Welcome to InsiQht, a mobile-based centralized repository for BSIT capstone projects and student research at Quezon City University. This Privacy Policy explains how we collect, use, store, and protect your information when you use the application.\nBy using the app, you agree to the collection and use of information in accordance with this policy.',
    },
    {
        title: 'Information We Collect',
        subsections: [
            {
                subtitle: 'Personal Information',
                body: 'When users create an account, we may collect:\n• Full name\n• University email address\n• Student ID number\n• Year level\n• Account password (encrypted)',
            },
            {
                subtitle: 'Academic Information',
                body: 'The system may collect information related to research activities, such as:\n• Uploaded research papers or capstone projects\n• Authors and project descriptions\n• Tags, keywords, and categories\n• Citations generated within the app',
            },
            {
                subtitle: 'Usage Data',
                body: 'We may automatically collect:\n• Login activity\n• Downloads and uploads\n• Saved or bookmarked research\n• Search queries\n• Reading history\n• App interaction statistics',
            },
            {
                subtitle: 'Device Information',
                body: '• Device type\n• Operating system\n• App version\n• IP address (for security and analytics)',
            },
        ],
    },
    {
        title: 'How We Use Your Information',
        body: 'The collected data is used to:\n• Create and manage user accounts\n• Provide access to research materials\n• Improve the search and recommendation system\n• Track usage statistics and analytics\n• Maintain system security\n• Allow administrators to review submissions\n• Generate citations for academic use',
    },
    {
        title: 'Data Protection',
        body: 'We take reasonable security measures to protect user data, including:\n• Encrypted passwords\n• Two-factor authentication\n• Secure login system\n• Restricted admin access\n• Monitoring of activity logs\n\nHowever, no system is completely secure, and we cannot guarantee absolute security.',
    },
    {
        title: 'Sharing of Information',
        body: 'We do not sell or trade personal information. Information may be shared only with:\n• System administrators\n• University academic reviewers\n• Authorized faculty members\n\nResearch submissions may become visible to other students once approved.',
    },
    {
        title: 'User Responsibilities',
        body: 'Users must:\n• Provide accurate account information\n• Keep login credentials confidential\n• Upload only original or properly cited research\n• Follow university academic integrity rules',
    },
    {
        title: 'Data Retention',
        body: 'User information and research submissions may be stored for academic, research, and system improvement purposes unless deletion is requested or required by university policy.',
    },
    {
        title: 'Third-Party Services',
        body: 'The application may use third-party tools for:\n• Analytics\n• Cloud storage\n• Authentication\n\nThese services follow their own privacy policies.',
    },
    {
        title: 'Changes to This Privacy Policy',
        body: 'We may update this Privacy Policy from time to time. Users will be notified of significant changes through the application.',
    },
];

// ── Screen ─────────────────────────────────────────────────────────────────────

const PrivacyPolicyScreen: React.FC = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#ECEEF8" />

            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <Ionicons name="chevron-back" size={ms(20)} color="#0E1F43" />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>Privacy Policy</Text>
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

                        {section.body ? (
                            <Text style={styles.bodyText}>{section.body}</Text>
                        ) : null}

                        {section.subsections ? section.subsections.map((sub, j) => (
                            <View key={j} style={styles.subsection}>
                                <Text style={styles.subsectionTitle}>{sub.subtitle}</Text>
                                <Text style={styles.bodyText}>{sub.body}</Text>
                            </View>
                        )) : null}
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
        marginBottom: vs(14),
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
    },

    subsection: {
        marginTop: vs(8),
    },
    subsectionTitle: {
        fontSize: ms(13),
        fontWeight: '400',
        color: '#333',
        marginBottom: vs(2),
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

export default PrivacyPolicyScreen;
