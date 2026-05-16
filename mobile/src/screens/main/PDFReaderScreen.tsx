import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, ActivityIndicator,
    TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../types';
import { ms, scale, vs } from '../../utils/responsive';
import api from '../../services/api.service';
import { usePreventScreenCapture } from 'expo-screen-capture';
import * as FileSystem from 'expo-file-system/legacy';
import { buildPdfViewerHtml, chunkBase64, ensurePdfJsScript, ensurePdfJsWorkerScript } from '../../utils/pdfViewer';

type Props = NativeStackScreenProps<HomeStackParamList, 'PDFReader'>;

const PDFReaderScreen: React.FC<Props> = ({ route, navigation }) => {
    const { studyId, offlineUrl } = route.params;

    const [fileUrl, setFileUrl] = useState<string | null>(offlineUrl || null);
    const [title, setTitle] = useState('Document');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastPage, setLastPage] = useState(1);
    const [htmlSource, setHtmlSource] = useState<string | null>(null);
    const [offlinePdfBase64, setOfflinePdfBase64] = useState<string | null>(null);
    const offlineInjectedRef = useRef(false);
    const webViewRef = useRef<WebView>(null);
    const progressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    usePreventScreenCapture();

    const handleMessage = useCallback((event: any) => {
        try {
            const msg = JSON.parse(event.nativeEvent.data);
            if (msg.type !== 'pageChange') return;
            const { page, total } = msg as { page: number; total: number };
            if (!page || !total) return;

            if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
            progressTimerRef.current = setTimeout(async () => {
                const progress = Math.min(100, Math.round((page / total) * 100));
                try {
                    await api.put(`/studies/${studyId}/progress`, {
                        lastPage: page,
                        totalPages: total,
                        progress,
                    });
                } catch {
                    // best-effort
                }
            }, 2000);
        } catch {
            // ignore malformed messages
        }
    }, [studyId]);

    useEffect(() => {
        return () => {
            if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (offlineUrl) {
            setLoading(false);
            return;
        }

        (async () => {
            try {
                const res = await api.get(`/studies/${studyId}`);
                const { fileUrl: url, title: t, lastPage: lp } = res.data;
                if (!url) {
                    setError('No document available for this study.');
                    return;
                }
                setTitle(t ?? 'Document');
                setLastPage(lp && lp > 1 ? lp : 1);
                setFileUrl(url);
            } catch {
                setError('Failed to load the document. Please try again.');
            } finally {
                setLoading(false);
            }
        })();
    }, [studyId, offlineUrl]);

    useEffect(() => {
        if (!fileUrl) return;

        let cancelled = false;
        offlineInjectedRef.current = false;
        setHtmlSource(null);
        setOfflinePdfBase64(null);

        (async () => {
            try {
                if (fileUrl.startsWith('file://')) {
                    if (!cancelled) {
                        const base64 = await FileSystem.readAsStringAsync(fileUrl, { encoding: FileSystem.EncodingType.Base64 });
                        setOfflinePdfBase64(base64);
                        const [pdfJsScript, pdfJsWorkerScript] = await Promise.all([
                            ensurePdfJsScript(),
                            ensurePdfJsWorkerScript(),
                        ]);
                        if (!pdfJsScript || !pdfJsWorkerScript) {
                            setError('PDF viewer assets are unavailable. Reconnect once to cache them, then try again.');
                            return;
                        }
                        setHtmlSource(buildPdfViewerHtml('about:blank', pdfJsScript, pdfJsWorkerScript, lastPage));
                    }
                    return;
                }

                // For online files, use WebView with pdf.js
                const [pdfJsScript, pdfJsWorkerScript] = await Promise.all([
                    ensurePdfJsScript(),
                    ensurePdfJsWorkerScript(),
                ]);
                if (!pdfJsScript || !pdfJsWorkerScript) {
                    if (!cancelled) {
                        setError('PDF viewer assets are unavailable. Reconnect once to cache them, then try again.');
                    }
                    return;
                }

                console.log('[PDFReader] Building HTML viewer for online PDF');
                if (!cancelled) {
                    setOfflinePdfBase64(null);
                    setHtmlSource(buildPdfViewerHtml(fileUrl, pdfJsScript, pdfJsWorkerScript, lastPage));
                }
            } catch (viewerError) {
                console.error('Error preparing PDF viewer:', viewerError);
                if (!cancelled) {
                    setError('Failed to prepare the document viewer. Please try again.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [fileUrl, lastPage]);

    const renderLoading = () => (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#0E1F43" />
            <Text style={styles.loadingText}>Loading document…</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#0E1F43" />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.8}
                >
                    <Ionicons name="arrow-back" size={ms(20)} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
            </View>

            {loading ? (
                renderLoading()
            ) : error ? (
                <View style={styles.center}>
                    <Ionicons name="document-outline" size={52} color="#C0CDE8" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                        <Text style={styles.goBackText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            ) : htmlSource ? (
                <WebView
                    ref={webViewRef}
                    source={{ html: htmlSource }}
                    style={{ flex: 1, backgroundColor: '#e8ecf2' }}
                    originWhitelist={['*']}
                    javaScriptEnabled
                    allowFileAccess
                    allowFileAccessFromFileURLs
                    allowUniversalAccessFromFileURLs
                    startInLoadingState
                    onMessage={handleMessage}
                    renderLoading={renderLoading}
                    onError={(syntheticEvent) => {
                        console.error('[WebView] Error:', syntheticEvent.nativeEvent);
                    }}
                    onHttpError={(syntheticEvent) => {
                        console.error('[WebView] HTTP Error:', syntheticEvent.nativeEvent);
                    }}
                    onLoadEnd={() => {
                        if (!offlinePdfBase64 || offlineInjectedRef.current) return;

                        offlineInjectedRef.current = true;
                        const chunks = chunkBase64(offlinePdfBase64, 100000);

                        webViewRef.current?.injectJavaScript('window.beginOfflinePdfLoad(); true;');
                        chunks.forEach((chunk, index) => {
                            const script = `window.appendOfflinePdfChunk(${JSON.stringify(chunk)}); true;`;
                            setTimeout(() => webViewRef.current?.injectJavaScript(script), index * 5);
                        });

                        setTimeout(() => {
                            webViewRef.current?.injectJavaScript('window.finishOfflinePdfLoad(); true;');
                        }, chunks.length * 5 + 50);
                    }}
                />
            ) : null}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0E1F43' },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: scale(12),
        paddingHorizontal: scale(16), paddingVertical: vs(12),
        backgroundColor: '#0E1F43',
    },
    backBtn: {
        width: scale(36), height: vs(36), borderRadius: ms(10),
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: {
        flex: 1, fontSize: ms(14), fontWeight: '700', color: '#fff',
    },
    center: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#F5F6FA', gap: vs(10),
    },
    loadingText: { marginTop: vs(8), color: '#5A6A8A', fontSize: ms(14) },
    errorText: {
        color: '#EF4444', fontSize: ms(14),
        textAlign: 'center', paddingHorizontal: scale(32),
    },
    goBackBtn: {
        marginTop: vs(12), backgroundColor: '#0E1F43',
        borderRadius: ms(12), paddingHorizontal: scale(28), paddingVertical: vs(12),
    },
    goBackText: { color: '#fff', fontSize: ms(14), fontWeight: '700' },
});

export default PDFReaderScreen;
