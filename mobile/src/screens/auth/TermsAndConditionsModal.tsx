import React, { useRef, useState } from 'react';
import {
    Modal,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    NativeScrollEvent,
    NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { scale, vs, ms } from '../../utils/responsive';

interface Props {
    visible: boolean;
    onClose: () => void;
    onAgree: () => void;
}

const SECTIONS: { title: string; body: string; centered?: boolean }[] = [
    {
        title: '1. Acceptance of Terms',
        body: 'By creating an account and using the InsiQht mobile application, you agree to comply with these Terms and Conditions. If you do not agree, please do not register or use the application.',
    },
    {
        title: '2. Purpose of the Application',
        body: 'InsiQht is a mobile-based centralized repository designed to:\n\n• Provide access to BSIT capstone projects and student research\n• Support academic learning and collaboration\n• Allow users to upload scholarly works\n• Generate citations for academic use\n\nThe app is strictly for educational and academic purposes.',
    },
    {
        title: '3. User Registration',
        body: 'To access certain features, you must register and provide accurate information including:\n\n• Full Name\n• Valid University Email\n• Student Number\n• Year Level and Program\n• Contact Information\n\nYou are responsible for maintaining the confidentiality of your account credentials.',
    },
    {
        title: '4. Account Security',
        body: 'Two-Factor Authentication (2FA) may be required. You are responsible for all activities under your account. Notify the administrator immediately if you suspect unauthorized access.',
    },
    {
        title: '5. Content Submission',
        body: 'By uploading research, projects, or other materials, you confirm that:\n\n• The work is original or properly cited.\n• It does not violate copyright laws.\n• It follows university academic integrity policies.\n\nAdministrators reserve the right to approve, reject, or remove submissions.',
    },
    {
        title: '6. Acceptable Use',
        body: 'Users agree NOT to:\n\n• Upload plagiarized or malicious content\n• Attempt unauthorized access to other accounts\n• Disrupt system operations\n• Manipulate analytics or academic records\n• Harass or impersonate other users\n\nViolations may result in suspension or permanent account termination.',
    },
    {
        title: '7. Intellectual Property',
        body: 'All research remains the intellectual property of the original author. By submitting content, you grant InsiQht permission to store, display, and distribute the material within the platform for academic purposes.',
    },
    {
        title: '8. Privacy',
        body: 'Your personal data is handled in accordance with the InsiQht Privacy Policy. By using the app, you consent to data collection necessary for system functionality and security.',
    },
    {
        title: '9. Account Termination',
        body: 'Users may request account deletion at any time. Upon deletion:\n\n• All saved data and reading history will be permanently removed.\n• Access to the platform will be terminated.\n• The account cannot be recovered.\n\nAdministrators may also suspend or terminate accounts that violate these terms.',
    },
    {
        title: '10. System Availability',
        body: 'We aim to provide uninterrupted access; however, maintenance, updates, or technical issues may temporarily limit availability.',
    },
    {
        title: '11. Limitation of Liability',
        body: 'InsiQht and its developers are not liable for:\n\n• Misuse of uploaded research\n• Academic misconduct by users\n• Loss of data due to technical failures beyond reasonable control',
    },
    {
        title: '12. Changes to Terms',
        body: 'These Terms and Conditions may be updated periodically. Continued use of the app indicates acceptance of any revisions.',
    },
    {
        title: 'Contact',
        body: 'For questions regarding this Privacy Policy, contact:\n\nInsiqhtMobileApp@qcu.ph',
        centered: true,
    },
];

const TermsAndConditionsModal: React.FC<Props> = ({ visible, onClose, onAgree }) => {
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const scrollRef = useRef<ScrollView>(null);

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (hasScrolledToBottom) return;
        const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
        const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 32;
        if (isAtBottom) setHasScrolledToBottom(true);
    };

    const handleClose = () => {
        setHasScrolledToBottom(false);
        onClose();
    };

    const handleAgree = () => {
        setHasScrolledToBottom(false);
        onAgree();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft} />
                    <Text style={styles.headerTitle}>Terms & Conditions</Text>
                    <TouchableOpacity style={styles.closeBtn} onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="close" size={22} color="#0E1F43" />
                    </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {/* Meta */}
                <View style={styles.meta}>
                    <Text style={styles.metaApp}>InsiQht Mobile Application</Text>
                    <Text style={styles.metaDate}>Last Updated: February 2026</Text>
                </View>

                {/* Scroll hint */}
                {!hasScrolledToBottom && (
                    <View style={styles.scrollHint}>
                        <Ionicons name="arrow-down" size={12} color="#888" />
                        <Text style={styles.scrollHintText}>Please scroll to read all terms before agreeing</Text>
                    </View>
                )}

                {/* Content */}
                <ScrollView
                    ref={scrollRef}
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    showsVerticalScrollIndicator={true}
                >
                    {SECTIONS.map((section, i) => (
                        <View key={i} style={[styles.section, section.centered && styles.sectionCentered]}>
                            <Text style={[styles.sectionTitle, section.centered && styles.sectionTitleCentered]}>{section.title}</Text>
                            <Text style={[styles.sectionBody, section.centered && styles.sectionBodyCentered]}>{section.body}</Text>
                        </View>
                    ))}

                    {/* Bottom padding so last section clears the button */}
                    <View style={{ height: 16 }} />
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    {!hasScrolledToBottom && (
                        <Text style={styles.footerHint}>Scroll to the bottom to enable agreement</Text>
                    )}
                    <TouchableOpacity
                        style={[styles.agreeBtn, !hasScrolledToBottom && styles.agreeBtnDisabled]}
                        onPress={handleAgree}
                        disabled={!hasScrolledToBottom}
                        activeOpacity={0.85}
                    >
                        <Ionicons
                            name="checkmark-circle-outline"
                            size={18}
                            color={hasScrolledToBottom ? '#fff' : '#A0AFCC'}
                            style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.agreeBtnText, !hasScrolledToBottom && styles.agreeBtnTextDisabled]}>
                            I Have Read and Agree
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.declineBtn} onPress={handleClose}>
                        <Text style={styles.declineBtnText}>Decline</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: scale(20),
        paddingVertical: vs(12),
    },
    headerLeft: {
        width: scale(32),
    },
    headerTitle: {
        fontSize: ms(15),
        fontWeight: '700',
        color: '#0E1F43',
        textAlign: 'center',
        flex: 1,
    },
    closeBtn: {
        width: scale(32),
        alignItems: 'flex-end',
    },
    divider: {
        height: 1,
        backgroundColor: '#EAEDF3',
        marginHorizontal: 0,
    },

    // Meta
    meta: {
        paddingHorizontal: scale(24),
        paddingTop: vs(10),
        paddingBottom: vs(6),
    },
    metaApp: {
        fontSize: ms(14),
        fontWeight: '700',
        color: '#0E1F43',
    },
    metaDate: {
        fontSize: ms(12),
        color: '#999',
        marginTop: vs(2),
    },

    // Scroll hint
    scrollHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: scale(4),
        paddingBottom: vs(6),
        paddingHorizontal: scale(24),
    },
    scrollHintText: {
        fontSize: ms(11),
        color: '#AAA',
        fontStyle: 'italic',
    },

    // Content
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: scale(24),
        paddingTop: vs(8),
        paddingBottom: vs(8),
    },
    section: {
        marginBottom: vs(20),
    },
    sectionTitle: {
        fontSize: ms(13),
        fontWeight: '700',
        color: '#0E1F43',
        marginBottom: vs(6),
        letterSpacing: 0.2,
    },
    sectionBody: {
        fontSize: ms(13),
        color: '#444',
        lineHeight: vs(20),
    },
    sectionCentered: {
        alignItems: 'center',
    },
    sectionTitleCentered: {
        textAlign: 'center',
    },
    sectionBodyCentered: {
        textAlign: 'center',
        color: '#666',
    },

    // Footer
    footer: {
        paddingHorizontal: scale(24),
        paddingTop: vs(10),
        paddingBottom: vs(14),
        borderTopWidth: 1,
        borderTopColor: '#EAEDF3',
        backgroundColor: '#fff',
    },
    footerHint: {
        fontSize: ms(11),
        color: '#AAA',
        textAlign: 'center',
        marginBottom: vs(8),
    },
    agreeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0E1F43',
        height: vs(46),
        borderRadius: ms(12),
        marginBottom: vs(8),
    },
    agreeBtnDisabled: {
        backgroundColor: '#E8ECF4',
    },
    agreeBtnText: {
        fontSize: ms(14),
        fontWeight: '700',
        color: '#fff',
    },
    agreeBtnTextDisabled: {
        color: '#A0AFCC',
    },
    declineBtn: {
        alignItems: 'center',
        paddingVertical: vs(8),
    },
    declineBtnText: {
        fontSize: ms(13),
        color: '#888',
        fontWeight: '500',
    },
});

export default TermsAndConditionsModal;
