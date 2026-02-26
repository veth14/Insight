import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, StatusBar,
    TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types';
import { scale, vs, ms } from '../../utils/responsive';

const ALL_TRENDING = [
    'Artificial Intelligence in Education',
    'Mobile Health Applications',
    'Cybersecurity & Data Privacy',
    'IoT & Smart Systems',
    'Machine Learning Applications',
    'Web Development Technologies',
    'Cloud Computing and Virtualization',
    'Data Analytics and Big Data',
    'Software Engineering Practices',
    'Human–Computer Interaction (HCI)',
    'Blockchain Technology',
    'Information Systems Security',
    'Smart Campus Systems',
    'Database Management Systems',
    'Automation and Robotics',
];

const TrendingAllScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
    const [query, setQuery] = useState('');

    const filtered = query.trim()
        ? ALL_TRENDING.filter(t => t.toLowerCase().includes(query.toLowerCase()))
        : ALL_TRENDING;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#ECEEF8" />

            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <Ionicons name="chevron-back" size={ms(20)} color="#0E1F43" />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>Trending Topics</Text>
                <View style={{ width: scale(36) }} />
            </View>

            {/* Search */}
            <View style={styles.searchWrapper}>
                <Ionicons name="search-outline" size={ms(16)} color="#9AADCA" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by author, keyword.."
                    placeholderTextColor="#9AADCA"
                    value={query}
                    onChangeText={setQuery}
                    returnKeyType="search"
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="close-circle" size={ms(16)} color="#9AADCA" />
                    </TouchableOpacity>
                )}
            </View>

            {/* List */}
            <FlatList
                data={filtered}
                keyExtractor={(_, i) => String(i)}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <Text style={styles.listHeaderText}>Trending Topics</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.item}
                        activeOpacity={0.7}
                        onPress={() => {
                            // Navigate to Search tab with query pre-filled
                            navigation.getParent()?.navigate('Search', { initialQuery: item });
                        }}
                    >
                        <Ionicons name="trending-up-outline" size={ms(16)} color="#0E1F43" style={styles.itemIcon} />
                        <Text style={styles.itemText}>{item}</Text>
                    </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No topics match "{query}"</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

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
        paddingVertical: vs(10),
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

    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: scale(16),
        marginBottom: vs(12),
        backgroundColor: '#fff',
        borderRadius: ms(12),
        paddingHorizontal: scale(12),
        height: vs(44),
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    searchIcon: {
        marginRight: scale(8),
    },
    searchInput: {
        flex: 1,
        fontSize: ms(13),
        color: '#0E1F43',
    },

    listContent: {
        paddingHorizontal: scale(16),
        paddingBottom: vs(32),
    },
    listHeader: {
        backgroundColor: '#fff',
        paddingHorizontal: scale(16),
        paddingTop: vs(14),
        paddingBottom: vs(4),
        borderTopLeftRadius: ms(12),
        borderTopRightRadius: ms(12),
    },
    listHeaderText: {
        fontSize: ms(13),
        fontWeight: '700',
        color: '#0E1F43',
        marginBottom: vs(4),
    },

    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: scale(16),
        paddingVertical: vs(12),
    },
    itemIcon: {
        marginRight: scale(12),
    },
    itemText: {
        fontSize: ms(13),
        color: '#1A2E55',
        flex: 1,
    },
    separator: {
        height: 0,
        backgroundColor: 'transparent',
    },

    empty: {
        backgroundColor: '#fff',
        paddingVertical: vs(24),
        alignItems: 'center',
        borderBottomLeftRadius: ms(12),
        borderBottomRightRadius: ms(12),
    },
    emptyText: {
        fontSize: ms(13),
        color: '#9AADCA',
    },
});

export default TrendingAllScreen;
