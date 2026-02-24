import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    FlatList, 
    Modal, 
    Platform,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import StudyCard from '../../components/StudyCard';
import { useNavigation } from '@react-navigation/native';

// Mock Data
const MOCK_RESULTS = Array(10).fill(0).map((_, i) => ({
    _id: `search-${i}`,
    title: `Advanced Algorithms in Mobile Computing ${i + 1}`,
    authors: ['Valmores, I.', 'Turing, A.'],
    category: i % 2 === 0 ? 'Mobile Dev' : 'Algorithms',
    yearPublished: 2024 - (i % 5),
    abstract: 'This study explores high-performance algorithms for modern mobile architectures...',
}));

const SearchScreen: React.FC = () => {
    const [query, setQuery] = useState('');
    const [filterVisible, setFilterVisible] = useState(false);
    const navigation = useNavigation<any>();

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={COLORS.text.secondary} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search titles, authors, keywords..."
                    value={query}
                    onChangeText={setQuery}
                    placeholderTextColor={COLORS.text.secondary}
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                        <Ionicons name="close-circle" size={20} color={COLORS.text.secondary} />
                    </TouchableOpacity>
                )}
            </View>
            <TouchableOpacity 
                style={styles.filterButton} 
                onPress={() => setFilterVisible(true)}
            >
                <Ionicons name="options" size={24} color={COLORS.primary} />
            </TouchableOpacity>
        </View>
    );

    const renderFilterModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={filterVisible}
            onRequestClose={() => setFilterVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, SHADOWS.medium]}>
                    <View style={styles.modalHeader}>
                        <Text style={TYPOGRAPHY.h3}>Filter Results</Text>
                        <TouchableOpacity onPress={() => setFilterVisible(false)}>
                            <Ionicons name="close" size={24} color={COLORS.text.primary} />
                        </TouchableOpacity>
                    </View>
                    
                    {/* Filter Options Placeholder */}
                    <Text style={styles.filterLabel}>Year</Text>
                    <View style={styles.filterRow}>
                        {['2024', '2023', '2022+'].map(y => (
                            <TouchableOpacity key={y} style={styles.chip}>
                                <Text style={styles.chipText}>{y}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.filterLabel}>Category</Text>
                    <View style={styles.filterRow}>
                        {['AI', 'Web', 'Mobile'].map(c => (
                            <TouchableOpacity key={c} style={styles.chip}>
                                <Text style={styles.chipText}>{c}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity 
                        style={styles.applyButton}
                        onPress={() => setFilterVisible(false)}
                    >
                        <Text style={styles.applyButtonText}>Apply Filters</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.container}>
            {renderHeader()}
            
            <FlatList
                data={query.length > 0 ? MOCK_RESULTS : []}
                keyExtractor={item => item._id}
                renderItem={({ item }) => (
                    <StudyCard 
                        study={item} 
                        variant="vertical" 
                        onPress={() => navigation.navigate('HomeStack', { 
                            screen: 'StudyDetail', 
                            params: { studyId: item._id } 
                        })}
                    />
                )}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="library-outline" size={64} color={COLORS.text.secondary} />
                        <Text style={[TYPOGRAPHY.body, { marginTop: SPACING.m, textAlign: 'center' }]}>
                            {query.length > 0 ? 'No papers found.' : 'Search the academic repository\nby title, author, or keyword.'}
                        </Text>
                    </View>
                }
            />

            {renderFilterModal()}
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
        alignItems: 'center',
        padding: SPACING.m,
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        ...SHADOWS.subtle,
        zIndex: 10,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.m,
        paddingHorizontal: SPACING.m,
        paddingVertical: 10, // Taller touch target
        marginRight: SPACING.m,
    },
    searchIcon: {
        marginRight: SPACING.s,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text.primary,
        height: '100%',
    },
    filterButton: {
        padding: SPACING.s,
    },
    listContent: {
        padding: SPACING.m,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.xxl * 2,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.card,
        borderTopLeftRadius: BORDER_RADIUS.l,
        borderTopRightRadius: BORDER_RADIUS.l,
        padding: SPACING.l,
        minHeight: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    filterLabel: {
        ...TYPOGRAPHY.h3,
        fontSize: 16,
        marginBottom: SPACING.s,
        marginTop: SPACING.m,
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    chip: {
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: SPACING.s,
        marginBottom: SPACING.s,
    },
    chipText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.text.primary,
    },
    applyButton: {
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.m,
        padding: SPACING.m,
        alignItems: 'center',
        marginTop: SPACING.xl,
    },
    applyButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default SearchScreen;
