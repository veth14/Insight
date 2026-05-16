import * as FileSystem from 'expo-file-system/legacy';

const PDF_JS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDF_JS_CACHE_DIR = `${FileSystem.cacheDirectory}pdfjs/`;
const PDF_JS_CACHE_FILE = `${PDF_JS_CACHE_DIR}pdf.min.js`;

export const ensurePdfJsScript = async (): Promise<string | null> => {
    try {
        const info = await FileSystem.getInfoAsync(PDF_JS_CACHE_FILE);
        if (!info.exists) {
            await FileSystem.makeDirectoryAsync(PDF_JS_CACHE_DIR, { intermediates: true });
            const result = await FileSystem.downloadAsync(PDF_JS_URL, PDF_JS_CACHE_FILE);
            if (result.status !== 200) {
                throw new Error(`Failed to cache pdf.js (${result.status})`);
            }
        }

        return await FileSystem.readAsStringAsync(PDF_JS_CACHE_FILE);
    } catch (cacheError) {
        try {
            const response = await fetch(PDF_JS_URL);
            if (!response.ok) {
                throw new Error(`Failed to fetch pdf.js (${response.status})`);
            }

            const script = await response.text();
            await FileSystem.makeDirectoryAsync(PDF_JS_CACHE_DIR, { intermediates: true }).catch(() => {});
            await FileSystem.writeAsStringAsync(PDF_JS_CACHE_FILE, script);
            return script;
        } catch (networkError) {
            console.error('[pdfViewer] Unable to load pdf.js script:', cacheError, networkError);
            return null;
        }
    }
};

export const fileUriToDataUrl = async (uri: string): Promise<string> => {
    try {
        console.log('[pdfViewer] Starting file to data URL conversion for:', uri);
        
        const info = await FileSystem.getInfoAsync(uri);
        if (!info.exists) {
            throw new Error(`File not found: ${uri}`);
        }
        console.log('[pdfViewer] File size:', info.size, 'bytes');

        if (info.size && info.size > 50 * 1024 * 1024) {
            throw new Error(`File too large for base64 encoding: ${(info.size / 1024 / 1024).toFixed(1)}MB`);
        }

        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const dataUrl = `data:application/pdf;base64,${base64}`;
        console.log('[pdfViewer] Data URL created, length:', dataUrl.length, 'characters');
        return dataUrl;
    } catch (error) {
        console.error('[pdfViewer] Error in fileUriToDataUrl:', error);
        throw error;
    }
};

  export const chunkBase64 = (base64: string, chunkSize: number = 100000): string[] => {
    const chunks: string[] = [];
    for (let index = 0; index < base64.length; index += chunkSize) {
      chunks.push(base64.slice(index, index + chunkSize));
    }
    return chunks;
  };

export const buildPdfViewerHtml = (pdfUrl: string, pdfJsScript: string, startPage: number = 1) => `<!DOCTYPE html>
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
  <span id="splashLabel">Loading document…</span>
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
<script>
${pdfJsScript}
</script>
<script>
console.log('[PDFViewer] Script loaded, pdfjsLib available:', typeof window.pdfjsLib !== 'undefined');
window._pdfBase64 = '';
window._pdfError = null;

window.beginOfflinePdfLoad = function() {
  console.log('[PDFViewer] beginOfflinePdfLoad');
  window._pdfBase64 = '';
};

window.appendOfflinePdfChunk = function(chunk) {
  if (!chunk) return;
  window._pdfBase64 += chunk;
};

window.finishOfflinePdfLoad = function() {
  console.log('[PDFViewer] finishOfflinePdfLoad, length:', window._pdfBase64 ? window._pdfBase64.length : 0);
  window.loadPdfFromBase64(window._pdfBase64);
};

window.loadPdfFromBase64 = function(base64) {
  console.log('[PDFViewer] loadPdfFromBase64 called, length:', base64 ? base64.length : 0);
  if (!window.pdfjsLib) {
    console.error('[PDFViewer] pdf.js not loaded yet, retrying...');
    setTimeout(() => window.loadPdfFromBase64(base64), 500);
    return;
  }
  window.initPdfViewer({ data: window.base64ToUint8Array(base64) });
};

window.base64ToUint8Array = function(base64) {
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes;
};

window.loadPdfFromDataUrl = function(dataUrl) {
  console.log('[PDFViewer] loadPdfFromDataUrl called, URL length:', dataUrl ? dataUrl.length : 0);
  if (!window.pdfjsLib) {
    console.error('[PDFViewer] pdf.js not loaded yet, retrying...');
    setTimeout(() => window.loadPdfFromDataUrl(dataUrl), 500);
    return;
  }
  window.initPdfViewer(dataUrl);
};

window.initPdfViewer = function(pdfSource) {
  const sourceType = pdfSource && pdfSource.data ? 'data' : 'url';
  const sourceLength = sourceType === 'url' ? (pdfSource ? pdfSource.length : 0) : (pdfSource && pdfSource.data ? pdfSource.data.length : 0);
  console.log('[PDFViewer] initPdfViewer called, sourceType:', sourceType, 'length:', sourceLength);
  const pdfjs = window.pdfjsLib;
  if (!pdfjs) {
    console.error('[PDFViewer] pdfjsLib is undefined');
    const eb=document.getElementById('errorBox');
    eb.style.display='flex';
    document.getElementById('errorMsg').textContent='PDF viewer not initialized.';
    return;
  }
  
  const START_PAGE=${startPage};
  const DPR=Math.min(window.devicePixelRatio||1, 1.5);
  const GUTTER=20;
  const CSS_WIDTH=window.innerWidth-GUTTER;
  const splash=document.getElementById('splash');
  const splashBar=document.getElementById('splashBar');
  const badge=document.getElementById('badge');
  const pages=document.getElementById('pages');
  let totalPages=0,badgeTimer=null;
  
  function postPage(page,total){try{if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify({type:'pageChange',page:+page,total:+total}))}catch(_){} }
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
    }).catch(err=>{console.error('[PDFViewer] Error rendering page',num,err)});
  }
  
  function buildPages(pdf){
    totalPages=pdf.numPages;
    console.log('[PDFViewer] PDF loaded, pages:', totalPages);
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
  
  console.log('[PDFViewer] Loading PDF, sourceType:', sourceType);

  const task=pdfjs.getDocument(sourceType === 'data' ? {
    data: pdfSource.data,
    disableWorker:true,
    useWorkerFetch:false,
    cMapPacked:false,
    withCredentials:false
  } : {
    url:pdfSource,
    disableWorker:true,
    useWorkerFetch:false,
    cMapPacked:false,
    withCredentials:false
  });
  
  task.onProgress=({loaded,total})=>{
    if(total>0){
      splashBar.style.width=Math.round((loaded/total)*90)+'%';
      console.log('[PDFViewer] Loading progress:', Math.round((loaded/total)*100)+'%');
    }
  };
  
  task.promise.then(buildPages).catch(err=>{
    console.error('[PDFViewer] Error loading PDF:', err);
    window._pdfError = err && err.message ? err.message : 'Unknown error';
    splash.classList.add('hide');
    const eb=document.getElementById('errorBox');
    eb.style.display='flex';
    const errorMsg = err && err.message ? err.message : 'Failed to load PDF';
    const preview = sourceType === 'url' ? (pdfSource ? pdfSource.substring(0, 50) : 'null') : 'base64 data';
    document.getElementById('errorMsg').textContent = 'Error: ' + errorMsg + ' (' + preview + ')';
    console.error('[PDFViewer] Error details:', {message: errorMsg, preview});
  });
};

// For online PDFs, load immediately
if ('${pdfUrl}' !== 'about:blank') {
  console.log('[PDFViewer] Loading online PDF immediately');
  setTimeout(() => window.initPdfViewer('${pdfUrl}'), 100);
}
</script>
</body>
</html>`;
