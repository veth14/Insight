import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, StatusBar, Platform, ActivityIndicator,
    KeyboardAvoidingView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import AppHeader from '../../components/AppHeader';
import { scale, vs, ms } from '../../utils/responsive';
import { auth } from '../../config/firebase';
import CustomAlert, { AlertButton } from '../../components/CustomAlert';

const DEPARTMENTS = ['BSIT', 'BSCS', 'BSIS', 'BSEMC', 'BS CpE'];
const STUDY_TYPES = ['Capstone', 'Case Study', 'Dissertation', 'Project', 'Thesis'];
const CATEGORIES  = [
    'Artificial Intelligence',
    'Computer Engineering',
    'Computer Science',
    'Data Science',
    'Information Systems',
    'IoT',
    'Machine Learning',
    'Mobile Dev',
    'Multimedia',
    'Security',
    'Web System'
];
const TOOLS_LIST  = [
    'Android Studio', 'Angular', 'Arduino', 'AWS', 'Blockchain', 'C#', 'C++',
    'Django', 'Docker', 'ESP32', 'Express', 'Figma', 'Firebase', 'Flask',
    'Flutter', 'Git', 'Java', 'Kotlin', 'Laravel', 'MongoDB', 'MySQL',
    'Next.js', 'Node.js', 'PHP', 'PostgreSQL', 'Postman', 'Python', 'PyTorch',
    'Raspberry Pi', 'React', 'React Native', 'Supabase', 'Swift',
    'Tailwind CSS', 'TensorFlow', 'Unity', 'Vercel', 'Vue.js', 'Xcode'
];

interface PickedFile {
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
}

const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const SectionCard = React.memo(({ icon, title, children }: { icon: string; title: string | React.ReactNode; children: React.ReactNode }) => (
    <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBox}>
                <Ionicons name={icon as any} size={15} color="#0E1F43" />
            </View>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {children}
    </View>
));

const ChipGroup = React.memo(({ items, active, onSelect }: { items: string[]; active: string; onSelect: (v: string) => void }) => (
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
));

const UploadScreen: React.FC = () => {
    // Form fields
    const [title, setTitle]           = useState('');
    const [authors, setAuthors]       = useState('');
    const [abstract, setAbstract]     = useState('');
    const [year, setYear]             = useState(String(new Date().getFullYear()));
    const [activeDept, setActiveDept] = useState('');
    const [activeType, setActiveType] = useState('');
    const [activeCategory, setActiveCategory] = useState('');
    const [keywords, setKeywords]     = useState('');
    const [methodology, setMethodology]   = useState('');
    const [keyFindings, setKeyFindings]   = useState('');
    const [selectedTools, setSelectedTools] = useState<string[]>([]);

    const toggleTool = (tool: string) =>
        setSelectedTools(prev =>
            prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
        );

    // File
    const [pickedFile, setPickedFile]   = useState<PickedFile | null>(null);
    const [pickedImage, setPickedImage] = useState<{ uri: string; name: string; mimeType: string } | null>(null);

    // Upload state
    const [uploading, setUploading]   = useState(false);
    const [submitted, setSubmitted]   = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0); // 0-100
    const [pdfProgress, setPdfProgress] = useState(0);
    const [imageProgress, setImageProgress] = useState(0);

    // Compute combined progress whenever per-file progress updates to avoid
    // stale closures or double-counting. Simple average of the two percentages.
    React.useEffect(() => {
        const combined = Math.round((pdfProgress + imageProgress) / 2);
        setUploadProgress(Math.min(100, Math.max(0, combined)));
    }, [pdfProgress, imageProgress]);

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean; title: string; message: string; buttons?: AlertButton[]; icon?: any; iconColor?: string;
    }>({ visible: false, title: '', message: '' });

    const showAlert = (title: string, message: string, buttons?: AlertButton[], icon?: any, iconColor?: string) => {
        setAlertConfig({ visible: true, title, message, buttons, icon, iconColor });
    };

    /* ── Debug: Test connectivity to API and external site ───────────────── */
    const testConnectivity = async () => {
        const apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/studies/upload`;
        try {
            console.log('[Test] fetching api url (HEAD):', apiUrl);
            const r = await fetch(apiUrl, { method: 'GET' });
            console.log('[Test] API GET status:', r.status);
            showAlert('Test Result', `API reachable, status ${r.status}`);
        } catch (e:any) {
            console.error('[Test] API fetch failed:', e);
            showAlert('Test Result', `API fetch failed: ${e.message || e}`);
        }

        try {
            console.log('[Test] fetching https://www.google.com');
            const r2 = await fetch('https://www.google.com');
            console.log('[Test] Google GET status:', r2.status);
        } catch (e:any) {
            console.error('[Test] Google fetch failed:', e);
        }
    };

    /* ── Pick Image ─────────────────────────────────────────────────── */
    const handlePickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            showAlert('Permission Required', 'Please allow access to your photo library to upload a system image.', undefined, 'alert-circle', '#E97C3A');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: true,
            aspect: [4, 3],
        });
        if (result.canceled || !result.assets || result.assets.length === 0) return;
        const asset    = result.assets[0];
        const ext      = asset.uri.split('.').pop() ?? 'jpg';
        const mimeType = asset.mimeType ?? `image/${ext}`;
        console.log('[Upload] picked image asset:', asset);

        // Compress / resize image to speed up uploads
        try {
            const manipResult = await ImageManipulator.manipulateAsync(
                asset.uri,
                [{ resize: { width: 1024 } }],
                { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
            );
            const info = await FileSystem.getInfoAsync(manipResult.uri);
            const infoSize = (info as any).size ?? null;
            console.log('[Upload] compressed image uri=', manipResult.uri, 'size=', infoSize);
            setPickedImage({ uri: manipResult.uri, name: `system_image.${ext}`, mimeType: 'image/jpeg' });
            return;
        } catch (e) {
            console.warn('[Upload] image compression failed, using original asset', e);
        }
        // Ensure the URI points to a readable file on Android (cropped images may return content:// URIs)
        try {
            const info = await FileSystem.getInfoAsync(asset.uri);
            if (info.exists && info.size && info.size > 0) {
                setPickedImage({ uri: asset.uri, name: `system_image.${ext}`, mimeType });
                return;
            }
        } catch (e) {
            // getInfo can fail for some content:// URIs; continue to fallback
            console.warn('[Upload] FileSystem.getInfoAsync failed for picked uri, will try download fallback', e);
        }

        // Fallback: copy/download to cache directory and use that URI so the Image preview can read it
        try {
            const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || '';
            const dest = `${cacheDir}picked_image_${Date.now()}.${ext}`;
            console.log('[Upload] downloading/copying picked image to cache:', dest);
            const downloadRes = await FileSystem.downloadAsync(asset.uri, dest);
            console.log('[Upload] download fallback result:', downloadRes);
            setPickedImage({ uri: downloadRes.uri, name: `system_image.${ext}`, mimeType });
        } catch (err) {
            console.warn('[Upload] image download fallback failed, using original uri', err);
            setPickedImage({ uri: asset.uri, name: `system_image.${ext}`, mimeType });
        }
    };

    /* ── Pick PDF ──────────────────────────────────────────────────── */
    const handlePickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });
            if (result.canceled || !result.assets || result.assets.length === 0) return;
            const asset = result.assets[0];
            setPickedFile({
                uri:      asset.uri,
                name:     asset.name,
                size:     asset.size,
                mimeType: asset.mimeType ?? 'application/pdf',
            });
        } catch (err) {
            showAlert('Error', 'Could not open file picker. Please try again.', undefined, 'alert-circle', '#EF4444');
        }
    };

    /* ── Submit ────────────────────────────────────────────────────── */
    const handleSubmit = async () => {
        if (!title.trim() || !authors.trim() || !abstract.trim() || !year.trim()) {
            showAlert('Missing Information', 'Please fill in all required basic information fields.', undefined, 'alert-circle', '#E97C3A');
            return;
        }
        if (!activeType || !activeCategory) {
            showAlert('Missing Classification', 'Please select a study type and research category.', undefined, 'alert-circle', '#E97C3A');
            return;
        }
        if (!pickedFile) {
            showAlert('Missing PDF', 'Please attach a PDF file before submitting.', undefined, 'document-text', '#E97C3A');
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        try {
            const idToken = await auth.currentUser?.getIdToken();
            if (!idToken) throw new Error('Not authenticated');
            // Upload PDF and image in parallel to server endpoints that accept a single file.
            const apiBase = process.env.EXPO_PUBLIC_API_URL;

            const uploadFileWithProgress = (uri: string, name: string, fieldName = 'file', onProgress?: (p:number)=>void) => new Promise<any>((resolve, reject) => {
                const apiUrl = `${apiBase}/studies/upload-object`;
                const xhr = new XMLHttpRequest();
                const form = new FormData();
                form.append(fieldName, { uri, name, type: fieldName === 'file' ? 'application/pdf' : 'image/jpeg' } as any);

                xhr.open('POST', apiUrl);
                xhr.setRequestHeader('Authorization', `Bearer ${idToken}`);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const raw = (event.loaded / event.total) * 100;
                        const percent = Math.min(100, Math.max(0, Math.round(raw)));
                        try { if (onProgress) onProgress(percent); } catch(_){ }
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const json = JSON.parse(xhr.responseText);
                            resolve(json);
                        } catch (e) { resolve({}); }
                    } else {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                };
                xhr.onerror = () => reject(new Error('Network error during upload'));
                xhr.send(form as any);
            });

            // Start both uploads concurrently. Each onProgress only updates its own state;
            // a useEffect computes the combined percent to avoid double-counting/stale closures.
            const pdfUploadPromise = uploadFileWithProgress(pickedFile.uri, pickedFile.name, 'file', (p:number) => { setPdfProgress(Math.min(100, Math.max(0, p))); });
            let imgUploadPromise: Promise<any> | null = null;
            if (pickedImage) {
                imgUploadPromise = uploadFileWithProgress(pickedImage.uri, pickedImage.name, 'file', (p:number) => { setImageProgress(Math.min(100, Math.max(0, p))); });
            } else {
                // No image selected: mark image progress as 100% (will use default logo)
                setImageProgress(100);
            }

            let pdfResult: any = null;
            let imgResult: any = null;

            // Basic combined progress: start and wait for both
            try {
                pdfResult = await pdfUploadPromise.then(r => { setPdfProgress(100); return r; });
                if (imgUploadPromise) imgResult = await imgUploadPromise.then(r => { setImageProgress(100); return r; });
                else imgResult = null;
            } catch (firstErr: any) {
                // If upload-object endpoint is not available (404), fall back to the legacy combined `/studies/upload` endpoint
                const status = (firstErr && firstErr.message) ? firstErr.message : '';
                if (status.includes('404') || status.includes('Upload failed with status 404') ) {
                    console.warn('[Upload] upload-object not found, falling back to /studies/upload');

                    const combinedUpload = () => new Promise<any>((resolve, reject) => {
                        const apiUrl = `${apiBase}/studies/upload`;
                        const xhr2 = new XMLHttpRequest();
                        const form2 = new FormData();
                        // Attach metadata fields
                        form2.append('title', title.trim());
                        form2.append('authors', authors.trim());
                        form2.append('abstract', abstract.trim());
                        form2.append('methodology', methodology.trim());
                        form2.append('keyFindings', keyFindings.trim());
                        form2.append('toolsUsed', selectedTools.join(','));
                        form2.append('category', activeCategory);
                        form2.append('department', activeDept);
                        form2.append('studyType', activeType);
                        form2.append('yearPublished', year.trim());

                        form2.append('pdf', { uri: pickedFile.uri, name: pickedFile.name, type: pickedFile.mimeType || 'application/pdf' } as any);
                        if (pickedImage) {
                            form2.append('image', { uri: pickedImage.uri, name: pickedImage.name, type: pickedImage.mimeType || 'image/jpeg' } as any);
                        }

                        xhr2.open('POST', apiUrl);
                        xhr2.setRequestHeader('Authorization', `Bearer ${idToken}`);

                        xhr2.upload.onprogress = (ev) => {
                            if (ev.lengthComputable) {
                                const percentage = Math.min(100, Math.max(0, Math.round((ev.loaded / ev.total) * 100)));
                                // Apply same percent to both so UI shows progress
                                setPdfProgress(percentage);
                                setImageProgress(percentage);
                            }
                        };

                        xhr2.onload = () => {
                            if (xhr2.status >= 200 && xhr2.status < 300) {
                                try { resolve(JSON.parse(xhr2.responseText)); } catch (e) { resolve({}); }
                            } else {
                                reject(new Error(`Combined upload failed with status ${xhr2.status}`));
                            }
                        };
                        xhr2.onerror = () => reject(new Error('Network error during combined upload'));
                        xhr2.send(form2 as any);
                    });

                    const combinedRes = await combinedUpload();
                    // combined endpoint returns created study; emulate pdfResult/imgResult shape
                    pdfResult = { publicUrl: combinedRes?.study?.fileUrl || null };
                    imgResult = { publicUrl: combinedRes?.study?.systemImageUrl || null };
                } else {
                    throw firstErr;
                }
            }

            // Finalize metadata creation
            const apiCreate = `${apiBase}/studies/create`;
            const payload = {
                title: title.trim(),
                authors: authors.trim(),
                abstract: abstract.trim(),
                methodology: methodology.trim(),
                keyFindings: keyFindings.trim(),
                toolsUsed: selectedTools.join(','),
                category: activeCategory,
                department: activeDept,
                studyType: activeType,
                yearPublished: year.trim(),
                fileUrl: pdfResult?.publicUrl || null,
                systemImageUrl: imgResult?.publicUrl || null,
                // Some deployments require `fullText` (schema required). Provide abstract as fallback.
                fullText: abstract.trim() || 'No full text available.' ,
            };
            console.log('[Upload] create payload', payload);

            const createRes = await fetch(apiCreate, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify(payload),
            });
            let createData: any = null;
            try {
                createData = await createRes.json();
            } catch (e) {
                const text = await createRes.text().catch(() => '<<no body>>');
                console.warn('[Upload] create endpoint returned non-JSON body:', text);
            }
            console.log('[Upload] create response', { status: createRes.status, body: createData });
            if (!createRes.ok) {
                const message = createData?.message || createData?.error || `Create failed ${createRes.status}`;
                throw new Error(message);
            }
            setUploadProgress(100);

            setSubmitted(true);
        } catch (err: any) {
            console.error('Upload error:', err);
            showAlert('Upload Failed', err.message ?? 'Something went wrong. Please try again.', undefined, 'alert-circle', '#EF4444');
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setTitle(''); setAuthors(''); setAbstract(''); setYear(String(new Date().getFullYear()));
        setActiveDept(''); setActiveType(''); setActiveCategory(''); setKeywords('');
        setMethodology(''); setKeyFindings(''); setSelectedTools([]);
        setPickedFile(null); setPickedImage(null); setSubmitted(false);
    };

    // Remove strict disabling so users can tap and explicitly see which fields they missed explicitly via alerts
    const isReady = !uploading;

    /* ── Success Screen ─────────────────────────────────────────────── */
    if (submitted) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
                <AppHeader />
                <View style={styles.successBox}>
                    <View style={styles.successIcon}>
                        <Ionicons name="checkmark-circle" size={ms(62)} color="#16A34A" />
                    </View>
                    <Text style={styles.successTitle}>Submitted!</Text>
                    <Text style={styles.successSub}>
                        Your research has been submitted and is pending admin review.{'\n'}
                        You'll be notified once it's approved.
                    </Text>
                    <TouchableOpacity style={[styles.submitBtn, { marginTop: vs(28), alignSelf: 'stretch' }]} onPress={resetForm} activeOpacity={0.8}>
                        <Ionicons name="add-circle-outline" size={ms(18)} color="#fff" />
                        <Text style={styles.submitBtnText}>Submit Another</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    /* ── Form ───────────────────────────────────────────────────────── */
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
            <AppHeader />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="none"
            >

                <View style={styles.headerSection}>
                    <Text style={styles.pageTitle}>Submit Research</Text>
                    <Text style={styles.pageSub}>Share your capstone or academic study with the community</Text>
                </View>

                {/* Basic Info */}
                <SectionCard icon="document-text-outline" title="Basic Information">
                    <Text style={styles.label}>Research Title <Text style={styles.req}>*</Text></Text>
                    <TextInput style={styles.input} placeholder="Enter full title of the study..." placeholderTextColor="#9AADCA" value={title} onChangeText={setTitle} />

                    <Text style={[styles.label, { marginTop: 14 }]}>Authors <Text style={styles.req}>*</Text></Text>
                    <TextInput style={styles.input} placeholder="e.g. Dela Cruz, Juan A.; Santos, Maria B." placeholderTextColor="#9AADCA" value={authors} onChangeText={setAuthors} />
                    <Text style={styles.hint}>Separate multiple authors with semicolons ( ; )</Text>

                    <Text style={[styles.label, { marginTop: 14 }]}>Year Published <Text style={styles.req}>*</Text></Text>
                    <TextInput style={[styles.input, styles.yearInput]} placeholder="e.g. 2024" placeholderTextColor="#9AADCA" value={year} onChangeText={setYear} keyboardType="numeric" maxLength={4} />
                </SectionCard>

                {/* Abstract */}
                <SectionCard icon="reader-outline" title={<Text>Abstract <Text style={styles.req}>*</Text></Text>}>
                    <TextInput
                        style={[styles.input, styles.textarea]}
                        placeholder="Provide a brief summary of the research..."
                        placeholderTextColor="#9AADCA"
                        value={abstract}
                        onChangeText={setAbstract}
                        multiline
                        textAlignVertical="top"
                        blurOnSubmit={false}
                        returnKeyType="default"
                        scrollEnabled={false}
                    />
                    <Text style={styles.charCount}>{abstract.length} characters</Text>
                </SectionCard>

                {/* Keywords */}
                <SectionCard icon="pricetag-outline" title="Keywords">
                    <TextInput style={styles.input} placeholder="e.g. Machine Learning, IoT, Web System" placeholderTextColor="#9AADCA" value={keywords} onChangeText={setKeywords} />
                    <Text style={styles.hint}>Separate keywords with commas</Text>
                </SectionCard>

                {/* Research Details */}
                <SectionCard icon="bulb-outline" title="Research Details (Optional)">
                    <Text style={styles.label}>Methodology</Text>
                    <TextInput
                        style={[styles.input, styles.textarea, { minHeight: vs(80) }]}
                        placeholder="e.g. Agile development, Experimental research, Descriptive method…"
                        placeholderTextColor="#9AADCA"
                        value={methodology}
                        onChangeText={setMethodology}
                        multiline
                        textAlignVertical="top"
                        blurOnSubmit={false}
                        scrollEnabled={false}
                    />
                    <Text style={[styles.label, { marginTop: vs(14) }]}>Key Findings</Text>
                    <TextInput
                        style={[styles.input, styles.textarea, { minHeight: vs(80) }]}
                        placeholder="e.g. The system achieved 94% accuracy…"
                        placeholderTextColor="#9AADCA"
                        value={keyFindings}
                        onChangeText={setKeyFindings}
                        multiline
                        textAlignVertical="top"
                        blurOnSubmit={false}
                        scrollEnabled={false}
                    />
                </SectionCard>

                {/* Tools Used */}
                <SectionCard icon="construct-outline" title="Tools &amp; Technologies Used">
                    <Text style={styles.hint}>Tap to select — choose all that apply</Text>
                    <View style={[styles.chipGroup, { marginTop: vs(10) }]}>
                        {TOOLS_LIST.map(tool => {
                            const active = selectedTools.includes(tool);
                            return (
                                <TouchableOpacity
                                    key={tool}
                                    style={[styles.chip, active && styles.chipActive]}
                                    onPress={() => toggleTool(tool)}
                                    activeOpacity={0.8}
                                >
                                    {active && <Ionicons name="checkmark" size={12} color="#fff" style={{ marginRight: 4 }} />}
                                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{tool}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    {selectedTools.length > 0 && (
                        <Text style={[styles.hint, { marginTop: vs(10), color: '#2E7D32' }]}>
                            {selectedTools.length} tool{selectedTools.length > 1 ? 's' : ''} selected
                        </Text>
                    )}
                </SectionCard>

                {/* Classification */}
                <SectionCard icon="albums-outline" title="Classification">
                    <Text style={styles.label}>Study Type <Text style={styles.req}>*</Text></Text>
                    <ChipGroup items={STUDY_TYPES} active={activeType} onSelect={setActiveType} />
                    <Text style={[styles.label, { marginTop: 14 }]}>Department</Text>
                    <ChipGroup items={DEPARTMENTS} active={activeDept} onSelect={setActiveDept} />
                    <Text style={[styles.label, { marginTop: 14 }]}>Research Category <Text style={styles.req}>*</Text></Text>
                    <ChipGroup items={CATEGORIES} active={activeCategory} onSelect={setActiveCategory} />
                </SectionCard>

                {/* System Image */}
                <SectionCard icon="image-outline" title={<Text>System Image / Logo <Text style={styles.req}>*</Text></Text>}>
                    <Text style={styles.hint}>Upload a screenshot or logo that represents your system.</Text>
                    <TouchableOpacity
                        style={[styles.imageBox, pickedImage ? styles.imageBoxFilled : null]}
                        onPress={handlePickImage}
                        activeOpacity={0.8}
                        disabled={uploading}
                    >
                        {pickedImage ? (
                            <View style={styles.imagePreviewRow}>
                                <Image source={{ uri: pickedImage.uri }} style={styles.imagePreview} resizeMode="cover" />
                                <View style={{ flex: 1, marginLeft: scale(12) }}>
                                    <Text style={styles.fileName} numberOfLines={1}>{pickedImage.name}</Text>
                                    <Text style={styles.fileReady}>Image selected ✓</Text>
                                </View>
                                <TouchableOpacity onPress={() => setPickedImage(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} disabled={uploading}>
                                    <Ionicons name="close-circle" size={20} color="#9AADCA" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <View style={[styles.uploadIconCircle, { backgroundColor: '#EEF1FB' }]}>
                                    <Ionicons name="image-outline" size={28} color="#3B5BDB" />
                                </View>
                                <Text style={styles.fileBoxTitle}>Tap to choose an image</Text>
                                <Text style={styles.fileBoxSub}>JPG, PNG or WebP · Max 20 MB</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </SectionCard>

                {/* Upload PDF */}
                <SectionCard icon="attach-outline" title={<Text>Upload PDF <Text style={styles.req}>*</Text></Text>}>
                    <TouchableOpacity
                        style={[styles.fileBox, pickedFile ? styles.fileBoxFilled : null]}
                        onPress={handlePickFile}
                        activeOpacity={0.8}
                        disabled={uploading}
                    >
                        {pickedFile ? (
                            <View style={styles.fileSelectedRow}>
                                <View style={styles.fileIconBox}>
                                    <Ionicons name="document-text" size={22} color="#DC2626" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.fileName} numberOfLines={1}>{pickedFile.name}</Text>
                                    <Text style={styles.fileReady}>{formatSize(pickedFile.size)} · Ready to upload</Text>
                                </View>
                                <TouchableOpacity onPress={() => setPickedFile(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} disabled={uploading}>
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
                        { label: 'Title',    done: !!title },
                        { label: 'Authors',  done: !!authors },
                        { label: 'Abstract', done: !!abstract },
                        { label: 'Year',     done: !!year },
                        { label: 'Type',     done: !!activeType },
                        { label: 'Category', done: !!activeCategory },
                        { label: 'Image',    done: !!pickedImage },
                        { label: 'PDF',      done: !!pickedFile },
                    ].map(({ label, done }) => (
                        <View key={label} style={[styles.summaryChip, done && styles.summaryChipDone]}>
                            <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={11} color={done ? '#2E7D32' : '#9AADCA'} />
                            <Text style={[styles.summaryChipText, done && styles.summaryChipTextDone]}>{label}</Text>
                        </View>
                    ))}
                </View>

                {/* Upload progress area */}
                {uploading && (
                    <View style={{ marginBottom: vs(12) }}>
                        <View style={styles.progressBarTrack}>
                            <View style={[styles.progressBarFill, { width: `${uploadProgress}%` }]} />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: vs(6) }}>
                            <Text style={{ fontSize: ms(12), color: '#5A6A8A' }}>PDF: {pdfProgress}%</Text>
                            <Text style={{ fontSize: ms(12), color: '#5A6A8A' }}>Image: {imageProgress}%</Text>
                        </View>
                    </View>
                )}

                {/* Submit */}
                <TouchableOpacity
                    style={[styles.submitBtn, !isReady && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    activeOpacity={0.8}
                    disabled={!isReady}
                >
                    {uploading ? (
                        <>
                            <ActivityIndicator size="small" color="#fff" />
                            <Text style={styles.submitBtnText}>Uploading…</Text>
                        </>
                    ) : (
                        <>
                            <Ionicons name="cloud-upload-outline" size={19} color="#fff" />
                            <Text style={styles.submitBtnText}>Submit Research</Text>
                        </>
                    )}
                </TouchableOpacity>

            </ScrollView>
            </KeyboardAvoidingView>

            <CustomAlert 
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={alertConfig.buttons}
                icon={alertConfig.icon}
                iconColor={alertConfig.iconColor}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },
    scroll: { padding: scale(16), paddingBottom: vs(110) },

    headerSection: { paddingBottom: vs(12) },
    pageTitle: { fontSize: ms(22), fontWeight: '800', color: '#0E1F43' },
    pageSub: { fontSize: ms(12), color: '#9AADCA', marginTop: vs(2) },

    // Section card
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: ms(16),
        padding: scale(16),
        marginBottom: vs(14),
        borderWidth: 1,
        borderColor: '#F0F2F8',
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: scale(8), marginBottom: vs(14) },
    sectionIconBox: {
        width: scale(28), height: vs(28), borderRadius: ms(8),
        backgroundColor: '#F0F2F8',
        justifyContent: 'center', alignItems: 'center',
    },
    sectionTitle: { fontSize: ms(13), fontWeight: '700', color: '#0E1F43' },

    // Success screen
    successBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: scale(32) },
    successIcon: { marginBottom: vs(16) },
    successTitle: { fontSize: ms(26), fontWeight: '800', color: '#0E1F43', marginBottom: vs(10) },
    successSub: { fontSize: ms(14), color: '#5A6A8A', textAlign: 'center', lineHeight: 22 },

    label: { fontSize: ms(12), fontWeight: '600', color: '#5A6A8A', marginBottom: vs(7) },
    req: { color: '#E53935' },
    hint: { fontSize: ms(11), color: '#9AADCA', marginTop: vs(4) },

    input: {
        backgroundColor: '#F5F6FA',
        borderRadius: ms(10),
        borderWidth: 1,
        borderColor: '#E0E5F0',
        paddingHorizontal: scale(13),
        paddingVertical: Platform.OS === 'ios' ? 12 : 10,
        fontSize: ms(14),
        color: '#0E1F43',
    },
    textarea: { minHeight: vs(130), paddingTop: vs(12), paddingBottom: vs(12) },
    yearInput: { width: scale(110) },
    charCount: { fontSize: ms(10), color: '#9AADCA', textAlign: 'right', marginTop: vs(4) },

    chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(7) },
    chip: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: scale(13), paddingVertical: vs(7),
        borderRadius: ms(20),
        backgroundColor: '#F5F6FA',
        borderWidth: 1.5, borderColor: '#D0D8E8',
    },
    chipActive: { backgroundColor: '#0E1F43', borderColor: '#0E1F43' },
    chipText: { fontSize: ms(12), fontWeight: '600', color: '#5A6A8A' },
    chipTextActive: { color: '#fff' },

    // File upload
    fileBox: {
        borderRadius: ms(14),
        borderWidth: 1.5,
        borderColor: '#D0D8E8',
        borderStyle: 'dashed',
        paddingVertical: vs(30),
        alignItems: 'center',
        gap: vs(8),
        backgroundColor: '#F5F6FA',
    },
    fileBoxFilled: {
        paddingVertical: vs(16),
        borderStyle: 'solid',
        borderColor: '#0E1F43',
        backgroundColor: '#EEF1F8',
    },
    uploadIconCircle: {
        width: scale(58), height: vs(58), borderRadius: ms(29),
        backgroundColor: '#FFF3EC',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: vs(4),
    },
    fileBoxTitle: { fontSize: ms(14), fontWeight: '700', color: '#3B4F70' },
    fileBoxSub: { fontSize: ms(12), color: '#9AADCA' },
    fileSelectedRow: { flexDirection: 'row', alignItems: 'center', gap: scale(12), paddingHorizontal: scale(4) },
    fileIconBox: {
        width: scale(42), height: vs(42), borderRadius: ms(10),
        backgroundColor: '#F0F2F8',
        justifyContent: 'center', alignItems: 'center',
    },
    fileName: { fontSize: ms(13), fontWeight: '700', color: '#0E1F43' },
    fileReady: { fontSize: ms(11), color: '#2E7D32', marginTop: vs(2) },

    // Image picker
    imageBox: {
        borderRadius: ms(14),
        borderWidth: 1.5,
        borderColor: '#D0D8E8',
        borderStyle: 'dashed',
        paddingVertical: vs(24),
        alignItems: 'center',
        gap: vs(8),
        backgroundColor: '#F5F6FA',
    },
    imageBoxFilled: {
        paddingVertical: vs(14),
        borderStyle: 'solid',
        borderColor: '#3B5BDB',
        backgroundColor: '#EEF1FB',
    },
    imagePreviewRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(4), width: '100%' },
    imagePreview: {
        width: scale(64), height: vs(52),
        borderRadius: ms(8),
        backgroundColor: '#D0D8E8',
    },

    // Summary chips
    summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(6), marginBottom: vs(16) },
    summaryChip: {
        flexDirection: 'row', alignItems: 'center', gap: scale(4),
        paddingHorizontal: scale(9), paddingVertical: vs(5),
        borderRadius: ms(20), backgroundColor: '#F0F2F8',
        borderWidth: 1, borderColor: '#E0E5F0',
    },
    summaryChipDone: { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' },
    summaryChipText: { fontSize: ms(10), fontWeight: '600', color: '#9AADCA' },
    summaryChipTextDone: { color: '#2E7D32' },

    // Submit
    submitBtn: {
        backgroundColor: '#0E1F43',
        borderRadius: ms(14),
        height: vs(52),
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: scale(9),
        shadowColor: '#0E1F43',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    submitBtnDisabled: { backgroundColor: '#C5D0E0', elevation: 0, shadowOpacity: 0 },
    submitBtnText: { color: '#fff', fontSize: ms(15), fontWeight: '800', letterSpacing: 0.3 },
    progressBarTrack: {
        height: vs(8),
        backgroundColor: '#E6EEF8',
        borderRadius: ms(6),
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#0E1F43',
    },
});

export default UploadScreen;
