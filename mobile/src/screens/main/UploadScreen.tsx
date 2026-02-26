import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/AppHeader';

const DEPARTMENTS = ['BSIT', 'BSCS', 'BSIS'];
const RESEARCH_TYPES = ['Quantitative', 'Qualitative', 'Mixed Methods'];
const CATEGORIES = ['AI/ML', 'Mobile Dev', 'IoT', 'Web System', 'Security', 'Data Analytics', 'Multimedia'];

const UploadScreen: React.FC = () => {
    const [title, setTitle] = useState('');
    const [authors, setAuthors] = useState('');
    const [abstract, setAbstract] = useState('');
    const [year, setYear] = useState('');
    const [activeDept, setActiveDept] = useState('');
    const [activeType, setActiveType] = useState('');
    const [activeCategory, setActiveCategory] = useState('');
    const [fileName, setFileName] = useState('');

    const handlePickFile = () => {
        setFileName('sample_research.pdf');
    };

    const handleSubmit = () => {};

    const isReady = title && authors && abstract && year && activeDept && activeType && activeCategory;

    const SectionCard = ({ icon, title: t, children }: { icon: string; title: string; children: React.ReactNode }) => (
        <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBox}>
                    <Ionicons name={icon as any} size={15} color="#0E1F43" />
                </View>
                <Text style={styles.sectionTitle}>{t}</Text>
            </View>
            {children}
        </View>
    );

    const ChipGroup = ({ items, active, onSelect }: { items: string[]; active: string; onSelect: (v: string) => void }) => (
        <View style={styles.chipGroup}>
            {items.map(item => (
                <TouchableOpacity
                    key={item}
                    style={[styles.chip, active === item && styles.chipActive]}
                    onPress={() => onSelect(item)}
                    activeOpacity={0.8}
                >
                    {active === item && <Ionicons name="checkmark" size={12} color="#fff" style={{ marginRight: 4 }} />}
                    <Text style={[styles.chipText, active === item && styles.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <AppHeader />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                <View style={styles.headerSection}>
                    <Text style={styles.pageTitle}>Submit Research</Text>
                    <Text style={styles.pageSub}>Share your capstone or academic study with the community</Text>
                </View>

                {/* Basic Info */}
                <SectionCard icon="document-text-outline" title="Basic Information">
                    <Text style={styles.label}>Research Title <Text style={styles.req}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter full title of the study..."
                        placeholderTextColor="#9AADCA"
                        value={title}
                        onChangeText={setTitle}
                    />
                    <Text style={[styles.label, { marginTop: 14 }]}>Authors <Text style={styles.req}>*</Text></Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. dela Cruz J., Santos M.,"
                        placeholderTextColor="#9AADCA"
                        value={authors}
                        onChangeText={setAuthors}
                    />
                    <Text style={[styles.label, { marginTop: 14 }]}>Year Published <Text style={styles.req}>*</Text></Text>
                    <TextInput
                        style={[styles.input, styles.yearInput]}
                        placeholder="e.g. 2024"
                        placeholderTextColor="#9AADCA"
                        value={year}
                        onChangeText={setYear}
                        keyboardType="numeric"
                        maxLength={4}
                    />
                </SectionCard>

                {/* Abstract */}
                <SectionCard icon="reader-outline" title="Abstract">
                    <TextInput
                        style={[styles.input, styles.textarea]}
                        placeholder="Provide a brief summary of the research..."
                        placeholderTextColor="#9AADCA"
                        value={abstract}
                        onChangeText={setAbstract}
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{abstract.length} characters</Text>
                </SectionCard>

                {/* Classification */}
                <SectionCard icon="albums-outline" title="Classification">
                    <Text style={styles.label}>Department <Text style={styles.req}>*</Text></Text>
                    <ChipGroup items={DEPARTMENTS} active={activeDept} onSelect={setActiveDept} />
                    <Text style={[styles.label, { marginTop: 14 }]}>Research Type <Text style={styles.req}>*</Text></Text>
                    <ChipGroup items={RESEARCH_TYPES} active={activeType} onSelect={setActiveType} />
                    <Text style={[styles.label, { marginTop: 14 }]}>Research Category <Text style={styles.req}>*</Text></Text>
                    <ChipGroup items={CATEGORIES} active={activeCategory} onSelect={setActiveCategory} />
                </SectionCard>

                {/* File Upload */}
                <SectionCard icon="attach-outline" title="Upload PDF">
                    <TouchableOpacity
                        style={[styles.fileBox, fileName ? styles.fileBoxFilled : null]}
                        onPress={handlePickFile}
                        activeOpacity={0.8}
                    >
                        {fileName ? (
                            <View style={styles.fileSelectedRow}>
                                <View style={styles.fileIconBox}>
                                    <Ionicons name="document-text" size={22} color="#0E1F43" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
                                    <Text style={styles.fileReady}>Ready to upload</Text>
                                </View>
                                <TouchableOpacity onPress={() => setFileName('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                    <Ionicons name="close-circle" size={20} color="#9AADCA" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <View style={styles.uploadIconCircle}>
                                    <Ionicons name="cloud-upload-outline" size={30} color="#E97C3A" />
                                </View>
                                <Text style={styles.fileBoxTitle}>Tap to choose a PDF</Text>
                                <Text style={styles.fileBoxSub}>Maximum file size: 20 MB</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </SectionCard>

                {/* Progress chips summary */}
                <View style={styles.summaryRow}>
                    {[
                        { label: 'Title', done: !!title },
                        { label: 'Authors', done: !!authors },
                        { label: 'Abstract', done: !!abstract },
                        { label: 'Year', done: !!year },
                        { label: 'Dept.', done: !!activeDept },
                        { label: 'Type', done: !!activeType },
                        { label: 'Category', done: !!activeCategory },
                    ].map(({ label, done }) => (
                        <View key={label} style={[styles.summaryChip, done && styles.summaryChipDone]}>
                            <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={11} color={done ? '#2E7D32' : '#9AADCA'} />
                            <Text style={[styles.summaryChipText, done && styles.summaryChipTextDone]}>{label}</Text>
                        </View>
                    ))}
                </View>

                {/* Submit */}
                <TouchableOpacity
                    style={[styles.submitBtn, !isReady && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    activeOpacity={0.8}
                    disabled={!isReady}
                >
                    <Ionicons name="cloud-upload-outline" size={19} color="#fff" />
                    <Text style={styles.submitBtnText}>Submit Research</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    scroll: { padding: 16, paddingBottom: 110 },

    headerSection: { paddingBottom: 12 },
    pageTitle: { fontSize: 22, fontWeight: '800', color: '#0E1F43' },
    pageSub: { fontSize: 12, color: '#9AADCA', marginTop: 2 },

    // Section card
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#F0F2F8',
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    sectionIconBox: {
        width: 28, height: 28, borderRadius: 8,
        backgroundColor: '#F0F2F8',
        justifyContent: 'center', alignItems: 'center',
    },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#0E1F43' },

    label: { fontSize: 12, fontWeight: '600', color: '#5A6A8A', marginBottom: 7 },
    req: { color: '#E53935' },

    input: {
        backgroundColor: '#F5F6FA',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E0E5F0',
        paddingHorizontal: 13,
        paddingVertical: Platform.OS === 'ios' ? 12 : 10,
        fontSize: 14,
        color: '#0E1F43',
    },
    textarea: { minHeight: 110, paddingTop: 12 },
    yearInput: { width: 110 },
    charCount: { fontSize: 10, color: '#9AADCA', textAlign: 'right', marginTop: 4 },

    chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    chip: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 13, paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#F5F6FA',
        borderWidth: 1.5, borderColor: '#D0D8E8',
    },
    chipActive: { backgroundColor: '#0E1F43', borderColor: '#0E1F43' },
    chipText: { fontSize: 12, fontWeight: '600', color: '#5A6A8A' },
    chipTextActive: { color: '#fff' },

    // File upload
    fileBox: {
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#D0D8E8',
        borderStyle: 'dashed',
        paddingVertical: 30,
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F5F6FA',
    },
    fileBoxFilled: {
        paddingVertical: 16,
        borderStyle: 'solid',
        borderColor: '#0E1F43',
        backgroundColor: '#EEF1F8',
    },
    uploadIconCircle: {
        width: 58, height: 58, borderRadius: 29,
        backgroundColor: '#FFF3EC',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 4,
    },
    fileBoxTitle: { fontSize: 14, fontWeight: '700', color: '#3B4F70' },
    fileBoxSub: { fontSize: 12, color: '#9AADCA' },
    fileSelectedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
    fileIconBox: {
        width: 42, height: 42, borderRadius: 10,
        backgroundColor: '#F0F2F8',
        justifyContent: 'center', alignItems: 'center',
    },
    fileName: { fontSize: 13, fontWeight: '700', color: '#0E1F43' },
    fileReady: { fontSize: 11, color: '#2E7D32', marginTop: 2 },

    // Summary chips
    summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
    summaryChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 9, paddingVertical: 5,
        borderRadius: 20, backgroundColor: '#F0F2F8',
        borderWidth: 1, borderColor: '#E0E5F0',
    },
    summaryChipDone: { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' },
    summaryChipText: { fontSize: 10, fontWeight: '600', color: '#9AADCA' },
    summaryChipTextDone: { color: '#2E7D32' },

    // Submit
    submitBtn: {
        backgroundColor: '#0E1F43',
        borderRadius: 14,
        height: 52,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 9,
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    submitBtnDisabled: { backgroundColor: '#C5D0E0', elevation: 0, shadowOpacity: 0 },
    submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
});

export default UploadScreen;
