import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types';

type Props = NativeStackScreenProps<HomeStackParamList, 'PDFReader'>;

/**
 * PDFReaderScreen Component
 * Displays PDF documents with reading tracking
 * (Placeholder for now)
 */
const PDFReaderScreen: React.FC<Props> = ({ route }) => {
    const { studyId } = route.params;

    return (
        <View style={styles.container}>
            <Text style={styles.placeholder}>
                PDF Reader for study: {studyId}
            </Text>
            <Text style={styles.subtitle}>PDF reading functionality coming soon...</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    placeholder: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#999',
    },
});

export default PDFReaderScreen;
