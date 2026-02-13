import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    SafeAreaView, 
    FlatList,
    StatusBar,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import StudyCard from '../../components/StudyCard';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types';

type LibraryTab = 'in_progress' | 'saved' | 'completed';

// Mock Data with Progress
const MOCK_LIBRARY = Array(15).fill(0).map((_, i) => ({
    _id: `lib-${i}`,
    title: `Research Methodology in CS ${i + 1}`,
    authors: ['Prof. X'],
    category: 'Computer Science',
    yearPublished: 2024,
    status: i < 5 ? 'in_progress' : (i < 10 ? 'saved' : 'completed'),
    progress: i < 5 ? (i + 1) * 0.2 : (i < 10 ? 0 : 1),
    abstract: 'Abstract for library item...',
}));

const LibraryScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<LibraryTab>('in_progress');
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

    const filteredData = MOCK_LIBRARY.filter(item => item.status === activeTab);

    const renderProgressBar = (progress: number) => (
        <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
                <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress * 100)}% Complete</Text>
        </View>
    );

    const renderTab = (tab: LibraryTab, label: string) => (
        <TouchableOpacity 
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
        >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.itemContainer}>
            <StudyCard 
                study={item} 
                variant="vertical"
                onPress={() => navigation.navigate('StudyDetail', { studyId: item._id })} 
            />
            {activeTab === 'in_progress' && renderProgressBar(item.progress)}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>My Library</Text>
                    <Text style={styles.headerSubtitle}>Manage your academic collection</Text>
                </View>
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="filter" size={20} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                {renderTab('in_progress', 'Reading')}
                {renderTab('saved', 'Saved')}
                {renderTab('completed', 'Done')}
            </View>

            <FlatList
                data={filteredData}
                keyExtractor={item => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="book-outline" size={64} color={COLORS.text.secondary} />
                        <Text style={styles.emptyText}>No items found in this section.</Text>
                        <Text style={styles.emptySubtext}>Explore the dashboard to add papers.</Text>
                    </View>
                }
            />
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
        paddingTop: SPACING.l,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    headerTitle: {
        ...TYPOGRAPHY.h1,
        color: COLORS.white,
        fontSize: 24,
    },
    headerSubtitle: {
        ...TYPOGRAPHY.caption,
        color: COLORS.secondary,
        marginTop: 4,
    },
    iconButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 8,
        borderRadius: BORDER_RADIUS.full,
    },
    tabContainer: {
        flexDirection: 'row',
        padding: SPACING.m,
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        marginHorizontal: 4,
        borderRadius: BORDER_RADIUS.s,
    },
    activeTab: {
        backgroundColor: COLORS.secondary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text.secondary,
    },
    activeTabText: {
        color: COLORS.white,
    },
    listContent: {
        padding: SPACING.m,
        paddingBottom: SPACING.xl,
    },
    itemContainer: {
        marginBottom: SPACING.m,
    },
    progressContainer: {
        marginTop: SPACING.xs,
        paddingHorizontal: SPACING.xs,
    },
    progressBackground: {
        height: 6,
        backgroundColor: COLORS.border,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 3,
    },
    progressText: {
        ...TYPOGRAPHY.caption,
        marginTop: 4,
        textAlign: 'right',
        color: COLORS.text.secondary,
        fontSize: 10,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        ...TYPOGRAPHY.h3,
        color: COLORS.text.primary,
        marginTop: SPACING.m,
    },
    emptySubtext: {
        ...TYPOGRAPHY.body,
        color: COLORS.text.secondary,
        marginTop: SPACING.s,
    },
});

export default LibraryScreen;