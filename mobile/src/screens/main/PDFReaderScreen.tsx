import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../types';
import { COLORS } from '../../constants/theme';
import { ms } from '../../utils/responsive';

type Props = NativeStackScreenProps<HomeStackParamList, 'PDFReader'>;

const PDFReaderScreen: React.FC<Props> = ({ route }) => {
    const { studyId } = route.params;
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock fetching study details from backend
        const fetchStudyPdf = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Public PDF URL for testing
                const pdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
                
                // For Android, we use Google Docs Viewer
                // For iOS, WebView handles PDF directly
                if (Platform.OS === 'android') {
                    setUrl(`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`);
                } else {
                    setUrl(pdfUrl);
                }
            } catch (err) {
                console.error("Failed to load PDF", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStudyPdf();
    }, [studyId]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading Document...</Text>
            </View>
        );
    }

    if (!url) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Failed to load document.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <WebView
                source={{ uri: url }}
                style={styles.webview}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        marginTop: 10,
        color: COLORS.text.secondary,
        fontSize: ms(14),
    },
    errorText: {
        color: COLORS.error,
        fontSize: ms(16),
    },
    webview: {
        flex: 1,
    }
});

export default PDFReaderScreen;