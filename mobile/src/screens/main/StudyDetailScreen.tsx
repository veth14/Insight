import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    SafeAreaView, 
    Platform, 
    StatusBar,
    Animated,
    LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types';
import StudyCard from '../../components/StudyCard';

const CollapsibleSection = ({ title, children, isOpen, onToggle }: any) => (
    <View style={styles.sectionContainer}>
        <TouchableOpacity style={styles.sectionHeader} onPress={onToggle} activeOpacity={0.7}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Ionicons 
                name={isOpen ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={COLORS.text.secondary} 
            />
        </TouchableOpacity>
        {isOpen && (
            <View style={styles.sectionContent}>
                <Text style={styles.sectionText}>{children}</Text>
            </View>
        )}
    </View>
);

const ActionButton = ({ icon, label, onPress, variant = 'secondary' }: any) => (
    <TouchableOpacity 
        style={[
            styles.actionButton, 
            variant === 'primary' && styles.actionButtonPrimary
        ]} 
        onPress={onPress}
    >
        <Ionicons 
            name={icon} 
            size={20} 
            color={variant === 'primary' ? '#FFF' : COLORS.primary} 
        />
        <Text style={[
            styles.actionButtonText,
            variant === 'primary' && styles.actionButtonTextPrimary
        ]}>{label}</Text>
    </TouchableOpacity>
);

const StudyDetailScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
    const route = useRoute();
    const studyId = (route.params as any)?.studyId || 'default';

    const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
        'Abstract': true,
        'Methodology': false,
        'Results': false,
    });

    const toggleSection = (section: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
                </TouchableOpacity>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerIcon}>
                        <Ionicons name="share-social-outline" size={24} color={COLORS.text.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.titleSection}>
                    <View style={styles.badgeContainer}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Computer Science</Text>
                        </View>
                        <Text style={styles.yearText}>2024</Text>
                    </View>
                    <Text style={styles.title}>Machine Learning in Academic Research</Text>
                    <Text style={styles.authors}>By Ian Valmores, Dr. Alan Turing</Text>
                </View>

                {/* Action Row */}
                <View style={styles.actionRow}>
                    <ActionButton icon="bookmark-outline" label="Save" />
                    <ActionButton icon="document-text-outline" label="Cite" />
                    <ActionButton 
                        icon="book-outline" 
                        label="Read Now" 
                        variant="primary" 
                        onPress={() => navigation.navigate('PDFReader', { studyId })}
                    />
                </View>

                {/* Content Sections */}
                <CollapsibleSection 
                    title="Abstract" 
                    isOpen={expandedSections['Abstract']}
                    onToggle={() => toggleSection('Abstract')}
                >
                    This study explores the integration of machine learning algorithms within academic research repositories to enhance searchability and recommendation systems. Using a dataset of 5,000 papers...
                </CollapsibleSection>

                <CollapsibleSection 
                    title="Methodology" 
                    isOpen={expandedSections['Methodology']}
                    onToggle={() => toggleSection('Methodology')}
                >
                    We employed a mixed-methods approach, combining quantitative analysis of search logs with qualitative interviews of 50 university students...
                </CollapsibleSection>

                <CollapsibleSection 
                    title="Key Findings" 
                    isOpen={expandedSections['Results']}
                    onToggle={() => toggleSection('Results')}
                >
                    1. Search time reduced by 40%.{'\n'}
                    2. Discovery of cross-disciplinary papers increased by 25%.{'\n'}
                    3. Student engagement with the platform doubled.
                </CollapsibleSection>

                <View style={styles.similarSection}>
                    <Text style={styles.sectionHeaderTitle}>Similar Works</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {[1, 2, 3].map(i => (
                            <StudyCard 
                                key={i}
                                study={{
                                    title: `Related Study ${i}`,
                                    authors: ['Smith et al.'],
                                    category: 'AI',
                                    yearPublished: 2023
                                }}
                                variant="horizontal"
                            />
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: SPACING.s,
    },
    headerActions: {
        flexDirection: 'row',
    },
    headerIcon: {
        padding: SPACING.s,
    },
    scrollContent: {
        paddingBottom: SPACING.xl,
    },
    titleSection: {
        padding: SPACING.l,
        backgroundColor: COLORS.card,
        marginBottom: SPACING.m,
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    badge: {
        backgroundColor: COLORS.secondary + '20', // 20% opacity
        paddingHorizontal: SPACING.s,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.s,
        marginRight: SPACING.m,
    },
    badgeText: {
        color: COLORS.secondary,
        fontWeight: 'bold',
        fontSize: 12,
    },
    yearText: {
        color: COLORS.text.secondary,
        fontSize: 12,
    },
    title: {
        ...TYPOGRAPHY.h2,
        color: COLORS.primary,
        marginBottom: SPACING.s,
    },
    authors: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.secondary,
        fontStyle: 'italic',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: SPACING.m,
        backgroundColor: COLORS.card,
        marginBottom: SPACING.m,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.s,
        paddingHorizontal: SPACING.m,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    actionButtonPrimary: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    actionButtonText: {
        marginLeft: SPACING.s,
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: 12,
    },
    actionButtonTextPrimary: {
        color: '#FFF',
    },
    sectionContainer: {
        backgroundColor: COLORS.card,
        marginBottom: 1, // separator look
        padding: SPACING.m,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        ...TYPOGRAPHY.h3,
        fontSize: 16,
    },
    sectionContent: {
        marginTop: SPACING.m,
    },
    sectionText: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.secondary,
        lineHeight: 24,
    },
    similarSection: {
        marginTop: SPACING.m,
        paddingLeft: SPACING.m,
    },
    sectionHeaderTitle: {
        ...TYPOGRAPHY.h3,
        marginBottom: SPACING.m,
        color: COLORS.text.primary,
    }
});

export default StudyDetailScreen;
