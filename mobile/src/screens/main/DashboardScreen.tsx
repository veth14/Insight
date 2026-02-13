import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, FlatList, StatusBar, Modal, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import StudyCard from '../../components/StudyCard';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList, UserRole, AcademicProgram } from '../../types';
import * as DocumentPicker from 'expo-document-picker';

// Mock Data for Design
const MOCK_STUDIES = Array(5).fill(0).map((_, i) => ({
    _id: `study-${i}`,
    title: `Machine Learning in Education: A Case Study ${i + 1}`,
    authors: ['Valmores, I.', 'Doe, J.'],
    category: 'BSCS', // Program specific
    program: AcademicProgram.BSCS, 
    yearPublished: 2024,
    abstract: 'This is a sample abstract for the study. It discusses the implications of AI in modern classrooms...',
    keywords: ['AI', 'Education', 'Machine Learning'],
    downloadCount: 150 + i * 10,
    viewCount: 300 + i * 20,
}));

const MOCK_GAPS = Array(3).fill(0).map((_, i) => ({
    _id: `gap-${i}`,
    title: `Unexplored Areas in Quantum Computing Security ${i + 1}`,
    authors: ['Smith, A.'],
    category: 'BSIT', // Program specific
    program: AcademicProgram.BSIT,
    yearPublished: 2025,
    abstract: 'Exploring the potential vulnerabilities in post-quantum cryptography...',
    keywords: ['Quantum', 'Security', 'Cryptography'],
    downloadCount: 50,
    viewCount: 100,
}));

const DashboardScreen: React.FC = () => {
    const { user } = useAuth();
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

    // Upload State
    const [modalVisible, setModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [formData, setFormData] = useState({
        title: '',
        authors: '',
        category: '',
        program: user?.program || AcademicProgram.BSCS,
        keywords: '',
        tools: '',
        gap: '',
        abstract: ''
    });
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

    // Filter content based on user program
    // In a real app, this would happen on the backend query
    const recommendedStudies = MOCK_STUDIES; // Placeholder for logic
    const userProgram = user?.program || AcademicProgram.BSCS;

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true
            });

            if (result.canceled) return;
            setSelectedFile(result.assets[0]);
        } catch (err) {
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !formData.title || !formData.authors) {
            Alert.alert('Missing Fields', 'Please fill in required fields and select a PDF.');
            return;
        }

        setUploading(true);
        // Mock Progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 0.1;
            setUploadProgress(Math.min(progress, 0.9));
        }, 200);

        try {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Mock API delay
            clearInterval(interval);
            setUploadProgress(1);
            Alert.alert('Success', 'Study uploaded successfully!');
            setModalVisible(false);
            resetForm();
        } catch (error) {
            Alert.alert('Upload Failed', 'Could not upload study.');
        } finally {
            setUploading(false);
            setUploadProgress(0);
            clearInterval(interval);
        }
    };

    const resetForm = () => {
        setFormData({ 
            title: '', 
            authors: '', 
            category: '', 
            program: user?.program || AcademicProgram.BSCS,
            keywords: '', 
            tools: '', 
            gap: '', 
            abstract: '' 
        });
        setSelectedFile(null);
    };

    const handleStudyPress = (studyId: string) => {
        navigation.navigate('StudyDetail', { studyId });
    };

    const renderSectionHeader = (title: string, subtitle?: string) => (
        <View style={styles.sectionHeader}>
            <View>
                <Text style={styles.sectionTitle}>{title}</Text>
                {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
            </View>
            <TouchableOpacity onPress={() => console.log('See All pressed')}>
                <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            
            {/* Academic Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.brandText}>INSIGHT</Text>
                    <Text style={styles.universityText}>UNIVERSITY PREVIEW</Text>
                </View>
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Search Bar Placeholder */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={COLORS.text.secondary} style={styles.searchIcon} />
                    <Text style={styles.searchPlaceholder}>Search for papers, authors, or topics...</Text>
                </View>

                {/* Categories / Disciplines */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer} contentContainerStyle={styles.chipsContent}>
                    {['All Fields', 'Computer Science', 'Medicine', 'Engineering', 'Social Sciences', 'Arts'].map((chip, index) => (
                        <TouchableOpacity key={index} style={[styles.chip, index === 0 && styles.activeChip]}>
                            <Text style={[styles.chipText, index === 0 && styles.activeChipText]}>{chip}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Recommended This Week (Horizontal) */}
                {renderSectionHeader(`Recommended for ${userProgram}`, 'Curated based on your program')}
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={recommendedStudies}
                    renderItem={({ item }) => (
                        <StudyCard 
                            study={item} 
                            variant="horizontal" 
                            onPress={() => handleStudyPress(item._id as string)}
                        />
                    )}
                    keyExtractor={item => item._id as string}
                    contentContainerStyle={styles.horizontalList}
                />

                {/* Emerging Research Gaps (Vertical List) */}
                <View style={styles.gapsSection}>
                    {renderSectionHeader('Emerging Research Gaps', 'High-impact opportunities')}
                    <View style={styles.verticalList}>
                        {MOCK_GAPS.map((item) => (
                            <StudyCard 
                                key={item._id} 
                                study={item} 
                                variant="vertical" 
                                onPress={() => handleStudyPress(item._id as string)}
                            />
                        ))}
                    </View>
                </View>

            </ScrollView>

            {/* Upload FAB - Year 4 Only */}
            {user?.role === UserRole.STUDENT_4TH && (
                <TouchableOpacity 
                    style={styles.fab} 
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={32} color={COLORS.white} />
                </TouchableOpacity>
            )}

            {/* Upload Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView 
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalContainer}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Upload Research</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={COLORS.text.primary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                                <Text style={styles.label}>Title</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Study Title"
                                    value={formData.title}
                                    onChangeText={(text) => setFormData({...formData, title: text})}
                                />

                                <Text style={styles.label}>Authors</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Author names (comma separated)"
                                    value={formData.authors}
                                    onChangeText={(text) => setFormData({...formData, authors: text})}
                                />

                                <View style={styles.row}>
                                    <View style={[styles.column, { marginRight: 8 }]}>
                                        <Text style={styles.label}>Category</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="e.g. AI"
                                            value={formData.category}
                                            onChangeText={(text) => setFormData({...formData, category: text})}
                                        />
                                    </View>
                                    <View style={[styles.column, { marginLeft: 8 }]}>
                                        <Text style={styles.label}>Program</Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                                            {[AcademicProgram.BSIS, AcademicProgram.BSIT, AcademicProgram.BSCS].map((prog) => (
                                                <TouchableOpacity
                                                    key={prog}
                                                    onPress={() => setFormData({...formData, program: prog})}
                                                    style={{
                                                        backgroundColor: formData.program === prog ? COLORS.primary : COLORS.card,
                                                        borderWidth: 1,
                                                        borderColor: formData.program === prog ? COLORS.primary : COLORS.border,
                                                        borderRadius: 16,
                                                        paddingVertical: 4,
                                                        paddingHorizontal: 10,
                                                        marginRight: 6,
                                                        marginBottom: 6
                                                    }}
                                                >
                                                    <Text style={{ 
                                                        color: formData.program === prog ? COLORS.white : COLORS.text.secondary,
                                                        fontSize: 10,
                                                        fontWeight: '600'
                                                    }}>{prog}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.row}>
                                    <View style={[styles.column]}>
                                        <Text style={styles.label}>Keywords</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Tags"
                                            value={formData.keywords}
                                            onChangeText={(text) => setFormData({...formData, keywords: text})}
                                        />
                                    </View>
                                </View>

                                <Text style={styles.label}>Tools Used</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Technologies/Frameworks"
                                    value={formData.tools}
                                    onChangeText={(text) => setFormData({...formData, tools: text})}
                                />

                                <Text style={styles.label}>Research Gap</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="What problem does this solve?"
                                    multiline
                                    numberOfLines={3}
                                    value={formData.gap}
                                    onChangeText={(text) => setFormData({...formData, gap: text})}
                                />

                                <Text style={styles.label}>Abstract</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Summary of the study"
                                    multiline
                                    numberOfLines={4}
                                    value={formData.abstract}
                                    onChangeText={(text) => setFormData({...formData, abstract: text})}
                                />

                                {/* File Selection */}
                                <TouchableOpacity style={styles.fileButton} onPress={handlePickDocument}>
                                    <Ionicons name="document-text-outline" size={24} color={selectedFile ? COLORS.primary : COLORS.text.secondary} />
                                    <Text style={[
                                        styles.fileButtonText, 
                                        selectedFile && { color: COLORS.primary, fontWeight: '600' }
                                    ]}>
                                        {selectedFile ? selectedFile.name : 'Select PDF Document'}
                                    </Text>
                                    {selectedFile && <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />}
                                </TouchableOpacity>
                            </ScrollView>

                            {/* Submit Button */}
                            <TouchableOpacity 
                                style={[styles.submitButton, uploading && styles.disabledButton]} 
                                onPress={handleUpload}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <View style={styles.progressWrapper}>
                                        <Text style={styles.uploadingText}>Uploading... {Math.round(uploadProgress * 100)}%</Text>
                                        <View style={styles.progressBarBg}>
                                            <View style={[styles.progressBarFill, { width: `${uploadProgress * 100}%` }]} />
                                        </View>
                                    </View>
                                ) : (
                                    <Text style={styles.submitButtonText}>Submit Research</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: COLORS.primary,
        padding: SPACING.m,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: SPACING.l,
    },
    headerContent: {
        flex: 1,
    },
    brandText: {
        color: COLORS.white,
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    universityText: {
        color: COLORS.secondary,
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 1.5,
        marginTop: 2,
    },
    iconButton: {
        padding: SPACING.xs,
    },
    scrollContent: {
        paddingBottom: SPACING.xl,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        margin: SPACING.m,
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.subtle,
    },
    searchIcon: {
        marginRight: SPACING.s,
    },
    searchPlaceholder: {
        color: COLORS.text.secondary,
        flex: 1,
    },
    chipsContainer: {
        marginBottom: SPACING.m,
    },
    chipsContent: {
        paddingHorizontal: SPACING.m,
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: COLORS.card,
        marginRight: SPACING.s,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    activeChip: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    chipText: {
        color: COLORS.text.secondary,
        fontSize: 14,
        fontWeight: '500',
    },
    activeChipText: {
        color: COLORS.white,
        fontWeight: '600',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: SPACING.m,
        marginBottom: SPACING.m,
        marginTop: SPACING.s,
    },
    sectionTitle: {
        ...TYPOGRAPHY.h2,
        color: COLORS.text.primary,
    },
    sectionSubtitle: {
        ...TYPOGRAPHY.caption,
        color: COLORS.text.secondary,
        marginTop: 2,
    },
    seeAll: {
        color: COLORS.secondary,
        fontWeight: '600',
        fontSize: 14,
        marginTop: 4,
    },
    horizontalList: {
        paddingHorizontal: SPACING.m,
        paddingBottom: SPACING.m,
    },
    verticalList: {
        paddingHorizontal: SPACING.m,
    },
    gapsSection: {
        marginTop: SPACING.s,
    },
    fab: {
        position: 'absolute',
        bottom: SPACING.l,
        right: SPACING.l,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
        zIndex: 100,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: BORDER_RADIUS.l,
        borderTopRightRadius: BORDER_RADIUS.l,
        padding: SPACING.l,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    modalTitle: {
        ...TYPOGRAPHY.h2,
        color: COLORS.text.primary,
    },
    formContainer: {
        marginBottom: SPACING.m,
    },
    label: {
        ...TYPOGRAPHY.caption,
        color: COLORS.text.secondary,
        marginBottom: SPACING.xs,
        marginTop: SPACING.s,
    },
    input: {
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.s,
        padding: SPACING.m,
        ...TYPOGRAPHY.body,
        color: COLORS.text.primary,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
    },
    column: {
        flex: 1,
    },
    fileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.l,
        marginBottom: SPACING.m,
        padding: SPACING.m,
        backgroundColor: COLORS.card,
        borderRadius: BORDER_RADIUS.s,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderStyle: 'dashed',
    },
    fileButtonText: {
        marginLeft: SPACING.s,
        ...TYPOGRAPHY.body,
        color: COLORS.text.secondary,
        flex: 1,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        alignItems: 'center',
        marginTop: SPACING.s,
        height: 56,
        justifyContent: 'center',
    },
    disabledButton: {
        opacity: 0.9,
    },
    submitButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    progressWrapper: {
        width: '100%',
    },
    uploadingText: {
        color: COLORS.white,
        fontSize: 12,
        marginBottom: 4,
        textAlign: 'center',
    },
    progressBarBg: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: COLORS.white,
        borderRadius: 2,
    },
});

export default DashboardScreen;
