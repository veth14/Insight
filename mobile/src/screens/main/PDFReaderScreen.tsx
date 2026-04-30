import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, ActivityIndicator,
    TouchableOpacity, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../types';
import { ms, scale, vs } from '../../utils/responsive';
import api from '../../services/api.service';
import * as FileSystem from 'expo-file-system/legacy';
import { usePreventScreenCapture } from 'expo-screen-capture';

type Props = NativeStackScreenProps<HomeStackParamList, 'PDFReader'>;

const PDFReaderScreen: React.FC<Props> = ({ route, navigation }) => {
    const { studyId, offlineUrl } = route.params;

    const [fileUrl, setFileUrl] = useState<string | null>(offlineUrl || null);
    const [title, setTitle]     = useState('Document');
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);
    const [lastPage, setLastPage] = useState(1);
    const progressTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

    usePreventScreenCapture();

    // Debounced progress reporter — fires 2 s after the last page change
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
                        lastPage:   page,
                        totalPages: total,
                        progress,
                    });
                } catch { /* silent — progress is best-effort */ }
            }, 2000);
        } catch { /* ignore malformed messages */ }
    }, [studyId]);

    useEffect(() => {
        return () => { if (progressTimerRef.current) clearTimeout(progressTimerRef.current); };
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
                if (!url) { setError('No document available for this study.'); return; }
                setTitle(t ?? 'Document');
                setLastPage(lp && lp > 1 ? lp : 1);
                setFileUrl(url);
            } catch (e: any) {
                setError('Failed to load the document. Please try again.');
            } finally {
                setLoading(false);
            }
        })();
    }, [studyId, offlineUrl]);

    const getBase64Pdf = async (uri: string) => {
        try {
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
            return `data:application/pdf;base64,${base64}`;
        } catch (error) {
            console.error("Error reading file to base64:", error);
            return uri; // fallback
        }
    };

    const [htmlSource, setHtmlSource] = useState<string | null>(null);

    useEffect(() => {
        if (!fileUrl) return;

        (async () => {
            let finalUrl = fileUrl;
            // If offline URI
            if (finalUrl.startsWith('file://')) {
                finalUrl = await getBase64Pdf(finalUrl);
            }
            setHtmlSource(pdfHtml(finalUrl, lastPage));
        })();
    }, [fileUrl, lastPage]);

    const pdfHtml = (url: string, startPage: number = 1) => `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=4.0, user-scalable=yes">
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html{height:100%}
body{min-height:100%;background:#e8ecf2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow-x:hidden}
#splash{position:fixed;inset:0;z-index:200;background:#0e1f43;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;transition:opacity .4s}
#splash.hide{opacity:0;pointer-events:none}
.big-spinner{width:48px;height:48px;border-radius:50%;border:4px solid rgba(255,255,255,0.2);border-top-color:#fff;animation:spin .8s linear infinite}
#splashLabel{color:rgba(255,255,255,0.7);font-size:14px;font-weight:500;letter-spacing:0.3px}
#splashProgress{width:160px;height:3px;background:rgba(255,255,255,0.15);border-radius:2px;overflow:hidden}
#splashBar{height:100%;background:#fff;border-radius:2px;width:0%;transition:width .3s ease}
#errorBox{position:fixed;inset:0;z-index:300;background:#fff;display:none;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:32px;text-align:center}
#errorTitle{font-size:17px;font-weight:700;color:#0e1f43}
#errorMsg{font-size:13px;color:#9aadca;line-height:1.6}
#badge{position:fixed;bottom:20px;right:16px;z-index:150;background:rgba(14,31,67,0.88);color:#fff;font-size:12px;font-weight:700;letter-spacing:0.5px;padding:6px 13px;border-radius:20px;backdrop-filter:blur(8px);box-shadow:0 4px 16px rgba(0,0,0,0.28);opacity:0;transition:opacity .25s;pointer-events:none}
#badge.show{opacity:1}
#pages{padding:12px 10px 80px;display:flex;flex-direction:column;align-items:center;gap:10px}
.page-card{width:100%;background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.14);position:relative}
.page-card canvas{display:block;width:100%;height:auto}
.page-placeholder{width:100%;background:#f0f2f5;display:flex;align-items:center;justify-content:center}
.page-placeholder .mini-spin{width:22px;height:22px;border-radius:50%;border:2px solid #dde3f0;border-top-color:#0e1f43;animation:spin .7s linear infinite}
.page-num{position:absolute;bottom:8px;right:10px;font-size:10px;color:rgba(0,0,0,0.22);font-weight:600;user-select:none}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div id="splash">
  <div class="big-spinner"></div>
  <span id="splashLabel">Loading document\u2026</span>
  <div id="splashProgress"><div id="splashBar"></div></div>
</div>
<div id="errorBox">
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#0e1f43" stroke-width="1.5">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r=".5" fill="#0e1f43"/>
  </svg>
  <div id="errorTitle">Could not load document</div>
  <div id="errorMsg"></div>
</div>
<div id="badge">1 / 1</div>
<div id="pages"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
(function(){
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const PDF_URL='${url}';
    const START_PAGE=${startPage};
  const DPR=Math.min(window.devicePixelRatio||1, 1.5); // Reduced from 3 to 1.5 to prevent Out-Of-Memory (blank pages)
  const GUTTER=20;
  const CSS_WIDTH=window.innerWidth-GUTTER;
  const splash=document.getElementById('splash');
  const splashBar=document.getElementById('splashBar');
  const badge=document.getElementById('badge');
  const pages=document.getElementById('pages');
  let totalPages=0,badgeTimer=null;
  function postPage(page,total){try{if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify({type:'pageChange',page:+page,total:+total}))}catch(_){}}
  function showBadge(page){const text=page+' / '+totalPages;badge.textContent=text;badge.classList.add('show');clearTimeout(badgeTimer);badgeTimer=setTimeout(()=>badge.classList.remove('show'),2000);postPage(page,totalPages)}
  const visObserver=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.intersectionRatio>0.3)showBadge(e.target.dataset.page)})},{threshold:[0.3,0.6]});
  function renderPageIntoCard(pdf,num,card){
    pdf.getPage(num).then(page=>{
      const baseVp=page.getViewport({scale:1});
      const scale=(CSS_WIDTH/baseVp.width)*DPR;
      const vp=page.getViewport({scale});
      const ph=card.querySelector('.page-placeholder');
      if(ph)ph.remove();
      const canvas=document.createElement('canvas');
      canvas.width=vp.width;canvas.height=vp.height;
      canvas.style.width=CSS_WIDTH+'px';canvas.style.height=(vp.height/DPR)+'px';
      card.appendChild(canvas);
      page.render({canvasContext:canvas.getContext('2d'),viewport:vp});
    });
  }
  function buildPages(pdf){
    totalPages=pdf.numPages;
    pdf.getPage(1).then(pg=>{
      const vp=pg.getViewport({scale:1});
      const cssH=(CSS_WIDTH/vp.width)*vp.height;
      for(let i=1;i<=totalPages;i++){
        const card=document.createElement('div');
        card.className='page-card';card.style.width=CSS_WIDTH+'px';card.dataset.page=i;
        const ph=document.createElement('div');
        ph.className='page-placeholder';ph.style.height=cssH+'px';
        ph.innerHTML='<div class="mini-spin"></div>';
        card.appendChild(ph);
        const pn=document.createElement('div');
        pn.className='page-num';pn.textContent=i;
        card.appendChild(pn);
        pages.appendChild(card);
        visObserver.observe(card);
      }
      const lazyObs=new IntersectionObserver(entries=>{
        entries.forEach(e=>{if(e.isIntersecting&&!e.target.dataset.rendered){e.target.dataset.rendered='1';renderPageIntoCard(pdf,+e.target.dataset.page,e.target)}})
      },{rootMargin:'250px'});
      document.querySelectorAll('.page-card').forEach(c=>lazyObs.observe(c));
      splashBar.style.width='100%';
      setTimeout(()=>{
        splash.classList.add('hide');
        if(START_PAGE>1){
          const t=document.querySelector('[data-page="'+START_PAGE+'"]');
          if(t)t.scrollIntoView({behavior:'instant',block:'start'});
        }
        showBadge(START_PAGE);
      },400);
    });
  }
  const task=pdfjsLib.getDocument({
    url:PDF_URL,
    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/',
    withCredentials:false
  });
  task.onProgress=({loaded,total})=>{if(total>0)splashBar.style.width=Math.round((loaded/total)*90)+'%'};
  task.promise.then(buildPages).catch(err=>{
    splash.classList.add('hide');
    const eb=document.getElementById('errorBox');eb.style.display='flex';
    document.getElementById('errorMsg').textContent=err.message;
  });
})();
</script>
</body>
</html>`;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#0E1F43" />

            {/* Header */}
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
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#0E1F43" />
                    <Text style={styles.loadingText}>Loading document…</Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Ionicons name="document-outline" size={52} color="#C0CDE8" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                        <Text style={styles.goBackText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            ) : fileUrl ? (
                <WebView
                    source={htmlSource ? { html: htmlSource } : undefined}
                    style={{ flex: 1, backgroundColor: '#e8ecf2' }}
                    originWhitelist={['*']}
                    javaScriptEnabled
                    startInLoadingState
                    onMessage={handleMessage}
                    renderLoading={() => (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color="#0E1F43" />
                            <Text style={styles.loadingText}>Loading document…</Text>
                        </View>
                    )}
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
    errorText:   {
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
