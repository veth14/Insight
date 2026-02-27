import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, StatusBar,
    TouchableOpacity, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types';
import { scale, vs, ms } from '../../utils/responsive';
import api from '../../services/api.service';

interface TopicItem { topic: string; count: number; }

const TrendingAllScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

    const [topics, setTopics]       = useState<TopicItem[]>([]);
    const [loading, setLoading]     = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [query, setQuery]         = useState('');

    const fetchTopics = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const res = await api.get('/studies/trending-topics');
            setTopics(res.data ?? []);
        } catch (err) {
            console.error('TrendingAll fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchTopics(); }, [fetchTopics]));

    const filtered = query.trim()
        ? topics.filter(t => t.topic.toLowerCase().includes(query.toLowerCase()))
        : topics;

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
                    placeholder="Search topics..."
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

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#0E1F43" />
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.topic}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchTopics(true); }}
                            colors={['#0E1F43']}
                            tintColor="#0E1F43"
                        />
                    }
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <Text style={styles.listHeaderText}>
                                {filtered.length} {filtered.length === 1 ? 'topic' : 'topics'}
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.item}
                            activeOpacity={0.7}
                            onPress={() => {
                                navigation.getParent()?.navigate('Search', { initialQuery: item.topic });
                            }}
                        >
                            <Ionicons name="trending-up-outline" size={ms(16)} color="#0E1F43" style={styles.itemIcon} />
                            <Text style={styles.itemText}>{item.topic}</Text>
                            <View style={styles.countBadge}>
                                <Text style={styles.countText}>{item.count}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>
                                {query ? `No topics match "${query}"` : 'No trending topics yet.'}
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container:  { flex: 1, backgroundColor: '#ECEEF8' },
    centered:   { flex: 1, justifyContent: 'center', alignItems: 'center' },

    topBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: scale(16), paddingVertical: vs(10), backgroundColor: '#ECEEF8',
    },
    backBtn: {
        width: scale(36), height: vs(36), borderRadius: ms(10),
        backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#E0E5F0',
        shadowColor: '#0E1F43', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
    },
    topBarTitle: { fontSize: ms(16), fontWeight: '800', color: '#0E1F43' },

    searchWrapper: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: scale(16), marginBottom: vs(8),
        backgroundColor: '#fff', borderRadius: ms(12),
        paddingHorizontal: scale(12), paddingVertical: vs(10),
        borderWidth: 1, borderColor: '#E0E5F0',
    },
    searchIcon:  { marginRight: scale(8) },
    searchInput: { flex: 1, fontSize: ms(14), color: '#1A2744', padding: 0 },

    listHeader:         { paddingHorizontal: scale(16), paddingVertical: vs(8) },
    listHeaderText:     { fontSize: ms(12), color: '#9AADCA', fontWeight: '600' },
    listContent:        { paddingHorizontal: scale(16), paddingBottom: vs(40) },

    item: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: vs(14),
    },
    itemIcon: { marginRight: scale(12) },
    itemText: { flex: 1, fontSize: ms(14), color: '#1A2744', fontWeight: '500' },

    countBadge: {
        backgroundColor: 'rgba(14,31,67,0.08)',
        borderRadius: ms(20), paddingHorizontal: scale(9), paddingVertical: vs(3),
    },
    countText: { fontSize: ms(11), fontWeight: '700', color: '#0E1F43' },

    separator: { height: 1, backgroundColor: '#E8ECF5' },
    empty:     { paddingVertical: vs(40), alignItems: 'center' },
    emptyText: { color: '#9AADCA', fontSize: ms(14) },
});

export default TrendingAllScreen;
