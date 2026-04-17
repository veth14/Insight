import { Request, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { supabase, BUCKET_NAME } from '../config/supabase';
import AcademicStudy from '../models/AcademicStudy';
import User from '../models/User';
import { AuthRequest } from '../types';
import { logActivity } from './activity.controller';
import { generateStudySummary } from '../services/ai.service';
import { sendAdminNewLiteratureEmail } from '../services/email.service';

// Known tools/technologies to auto-detect by scanning PDF text
const KNOWN_TOOLS = [
    'React Native', 'React', 'Vue.js', 'Angular', 'Next.js',
    'Node.js', 'Express', 'Laravel', 'Django', 'Flask',
    'Python', 'Java', 'Kotlin', 'Swift', 'PHP', 'C#', 'C++',
    'MySQL', 'MongoDB', 'PostgreSQL', 'Firebase', 'Supabase',
    'Arduino', 'Raspberry Pi', 'ESP32', 'TensorFlow', 'PyTorch',
    'Flutter', 'Unity', 'Android Studio', 'Xcode', 'Figma',
];

const autoDetectTools = (text: string): string[] => {
    const lower = text.toLowerCase();
    return KNOWN_TOOLS.filter(tool => lower.includes(tool.toLowerCase()));
};

// Memory storage — we upload the buffer directly to Supabase
export const pdfUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB per file
    fileFilter: (_req, file, cb) => {
        const allowed = [
            'application/pdf',
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and image files (jpg/png/webp) are allowed'));
        }
    },
});

/**
 * POST /api/studies/upload
 * Accepts multipart/form-data with a "pdf" file + metadata fields.
 * Uploads the PDF to Supabase Storage and creates an AcademicStudy document.
 */
export const uploadStudy = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq  = req as AuthRequest;
        const uid      = authReq.user?.uid;
        const files    = (req as any).files as Record<string, Express.Multer.File[]> | undefined;

        const pdfFile   = files?.['pdf']?.[0];
        const imageFile = files?.['image']?.[0];

        if (!pdfFile) {
            res.status(400).json({ message: 'No PDF file uploaded' });
            return;
        }

        // ── Parse body fields ────────────────────────────────────────────
        const {
            title,
            authors,        // comma-separated string
            abstract,
            methodology,
            keyFindings,
            toolsUsed,      // comma-separated string
            keywords,       // comma-separated string
            category,
            department,
            studyType,
            yearPublished,
        } = req.body as Record<string, string>;

        if (!title || !authors || !abstract) {
            res.status(400).json({ message: 'title, authors and abstract are required' });
            return;
        }

        // ── Extract full text from PDF (best-effort) ─────────────────────
        let fullText = '';
        try {
            const parsed = await pdfParse(pdfFile.buffer);
            fullText = parsed.text ?? '';
        } catch {
            fullText = abstract; // fallback
        }

        // ── AI Summarization (Gemini via Generative AI) ────────────────
        let finalAbstract = abstract.trim();
        let finalMethodology = methodology?.trim() || undefined;
        let finalKeyFindings = keyFindings?.trim() || undefined;

        if (fullText.length > 500) {
            try {
                console.log(`[AI] Generating summary for paper: "${title || 'Unknown'}"...`);
                // Use our new AI service hooked to Google Gemini
                const aiSummary = await generateStudySummary(fullText);
                
                // Override the manually provided ones ideally with AI generated
                if (aiSummary.abstract) finalAbstract = aiSummary.abstract;
                if (aiSummary.methodology) finalMethodology = aiSummary.methodology;
                if (aiSummary.keyFindings) finalKeyFindings = aiSummary.keyFindings;
                
                console.log('[AI] Summary successfully generated and injected.');
            } catch (error) {
                console.warn('[AI] Summarization failed softly, falling back to manual input.', error);
            }
        }

        // ── Merge user-provided tools + auto-detected from PDF ─────────────
        const userTools     = toolsUsed ? toolsUsed.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
        const detectedTools = autoDetectTools(fullText);
        const mergedTools   = Array.from(new Set([...userTools, ...detectedTools]));

        const sanitizedTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 60);
        const storagePath    = `${uid}/${Date.now()}_${sanitizedTitle}.pdf`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, pdfFile.buffer, {
                contentType: 'application/pdf',
                upsert: false,
            });

        if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            res.status(500).json({ message: 'Failed to upload PDF to storage', detail: uploadError.message });
            return;
        }

        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(storagePath);
        const fileUrl = urlData.publicUrl;

        // ── Upload system image to Supabase Storage (if provided) ────────
        let systemImageUrl: string | undefined;
        if (imageFile) {
            const ext = imageFile.mimetype.split('/')[1] ?? 'jpg';
            const imagePath = `${uid}/images/${Date.now()}_${sanitizedTitle}.${ext}`;

            // Log incoming image metadata for production debugging
            try {
                console.log('[uploadStudy] imageFile received:', {
                    fieldname: imageFile.fieldname,
                    originalname: imageFile.originalname,
                    mimetype: imageFile.mimetype,
                    size: imageFile.size,
                });
            } catch (_) {}

            const { error: imgError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(imagePath, imageFile.buffer, {
                    contentType: imageFile.mimetype,
                    upsert: false,
                });

            if (!imgError) {
                const { data: imgUrlData } = await supabase.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(imagePath);
                systemImageUrl = imgUrlData.publicUrl;
            } else {
                console.error('[uploadStudy] System image upload failed:', imgError.message, imgError);
                // Fail the request so the client receives a clear error in production
                res.status(500).json({ message: 'Failed to upload system image', detail: imgError.message });
                return;
            }
        }

        // ── Save to MongoDB ──────────────────────────────────────────────
        const study = await AcademicStudy.create({
            title:         title.trim(),
            authors:       authors.split(';').map((a: string) => a.trim()).filter(Boolean),
            abstract:      finalAbstract,
            methodology:   finalMethodology,
            keyFindings:   finalKeyFindings,
            toolsUsed:     mergedTools,
            keywords:      keywords  ? keywords.split(',').map((k: string) => k.trim()).filter(Boolean) : [],
            category:      category  ?? 'General',
            department:    department || undefined,
            studyType:     studyType ?? 'Thesis',
            yearPublished: parseInt(yearPublished) || new Date().getFullYear(),
            uploadedBy:    uid!,
            fileUrl,
            systemImageUrl,
            fullText,
            approvalStatus: 'pending',
        });

        // ── Fire Admin Literature Upload Alert (Async) ──
        User.findOne({ uid: uid! }).select('email').lean()
            .then(uploader => {
                if (uploader?.email) {
                    return User.find({ 
                        role: 'admin', 
                        'notificationPreferences.literatureSubmissions': true 
                    }).select('email').lean()
                    .then(admins => {
                        const adminEmails = admins.map(a => a.email);
                        if (adminEmails.length > 0) {
                            sendAdminNewLiteratureEmail(adminEmails, uploader.email, study.title).catch(err => console.error(err));
                        }
                    });
                }
            })
            .catch(err => console.error("Error fetching admins for literature notification:", err));

        // ── Log user activity ────────────────────────────────────────────
        try {
            const user = await User.findOne({ uid }).select('displayName').lean();
            const userName = (user as any)?.displayName ?? 'Unknown';
            await logActivity({
                userId:      uid!,
                userName,
                actionType:  'upload',
                actionLabel: 'Uploaded New Thesis',
                studyId:     study._id.toString(),
                studyTitle:  title.trim(),
            });
        } catch { /* non-blocking */ }

        res.status(201).json({
            message: 'Research submitted successfully. Pending admin approval.',
            study: {
                _id:            study._id,
                title:          study.title,
                approvalStatus: study.approvalStatus,
                fileUrl:        study.fileUrl,
            },
        });
    } catch (error: any) {
        console.error('uploadStudy error:', error);
        res.status(500).json({ message: 'Upload failed', detail: error.message });
    }
};

/**
 * GET /api/studies/my
 * Returns all studies uploaded by the current user.
 */
export const getMyStudies = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const uid     = authReq.user?.uid;

        const studies = await AcademicStudy.find({ uploadedBy: uid })
            .select('-fullText')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ studies });
    } catch (error: any) {
        console.error('getMyStudies error:', error);
        res.status(500).json({ message: 'Failed to fetch studies' });
    }
};
