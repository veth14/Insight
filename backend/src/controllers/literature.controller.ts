import { Request, Response } from 'express';
import AcademicStudy from '../models/AcademicStudy';
import User from '../models/User';
import { AuthRequest } from '../types';
import { logAdminAction } from '../utils/audit';
import { AuditAction } from '../models/AuditLog';
import { supabase, BUCKET_NAME } from '../config/supabase';

/** Extract the storage path from a Supabase public/signed URL */
function extractStoragePath(url?: string): string | null {
    if (!url) return null;
    // Matches both /object/public/bucket/ and /object/sign/bucket/ patterns
    const match = url.match(/\/object\/(?:public|sign)\/[^/]+\/(.+?)(?:\?|$)/);
    return match ? match[1] : null;
}

/** Return a 1-hour signed URL for a storage path, or null on failure */
async function signUrl(url?: string): Promise<string | null> {
    const path = extractStoragePath(url);
    if (!path) return url ?? null;
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) return url ?? null; // fallback to original
    return data.signedUrl;
}

/**
 * GET /api/admin/literature
 * Returns academic studies for admin review.
 * Query params:
 *   - search:  string             — matches title or authors
 *   - status:  'all' | 'pending' | 'approved' | 'rejected'  (default 'all')
 *   - limit:   number             (default 50)
 *   - skip:    number             (default 0)
 */
export const getLiterature = async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, status = 'all', limit = '50', skip = '0' } = req.query as {
            search?: string; status?: string; limit?: string; skip?: string;
        };

        const filter: Record<string, any> = {};

        if (status && status !== 'all') {
            filter.approvalStatus = status;
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { title:   { $regex: regex } },
                { authors: { $regex: regex } },
            ];
        }

        const [studies, total] = await Promise.all([
            AcademicStudy.find(filter)
                .select('-fullText')
                .sort({ createdAt: -1 })
                .skip(Number(skip))
                .limit(Number(limit))
                .lean(),
            AcademicStudy.countDocuments(filter),
        ]);

        // Enrich each study with uploader's profile info
        const uids = [...new Set(studies.map(s => s.uploadedBy).filter(Boolean))];
        const users = await User.find({ uid: { $in: uids } })
            .select('uid displayName studentNumber yearLevel program email')
            .lean();
        const userMap = Object.fromEntries(users.map(u => [u.uid, u]));

        // Generate signed URLs for images and PDFs (bucket is private)
        const enriched = await Promise.all(
            studies.map(async s => ({
                ...s,
                fileUrl:       await signUrl((s as any).fileUrl),
                systemImageUrl: await signUrl((s as any).systemImageUrl),
                uploader: userMap[(s as any).uploadedBy] ?? null,
            }))
        );

        res.json({ studies: enriched, total });
    } catch (error) {
        console.error('getLiterature error:', error);
        res.status(500).json({ message: 'Failed to fetch literature' });
    }
};

/**
 * PATCH /api/admin/literature/:id/approve
 * Approves a pending research submission.
 */
export const approveLiterature = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const { id } = req.params;

        const study = await AcademicStudy.findById(id);
        if (!study) {
            res.status(404).json({ message: 'Study not found' });
            return;
        }

        study.approvalStatus  = 'approved';
        study.rejectionReason = undefined;
        await study.save();

        await logAdminAction({
            adminUid:   authReq.user!.uid,
            action:     AuditAction.APPROVED_LITERATURE,
            targetName: study.title,
            details:    `Approved research submission: "${study.title}"`,
        });

        res.json({ message: 'Study approved', study });
    } catch (error) {
        console.error('approveLiterature error:', error);
        res.status(500).json({ message: 'Failed to approve study' });
    }
};

/**
 * PATCH /api/admin/literature/:id/reject
 * Rejects a research submission.
 * Body: { reason?: string }
 */
export const rejectLiterature = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const { id } = req.params;
        const { reason } = req.body as { reason?: string };

        const study = await AcademicStudy.findById(id);
        if (!study) {
            res.status(404).json({ message: 'Study not found' });
            return;
        }

        study.approvalStatus  = 'rejected';
        study.rejectionReason = reason?.trim() || undefined;
        await study.save();

        await logAdminAction({
            adminUid:   authReq.user!.uid,
            action:     AuditAction.REJECTED_LITERATURE,
            targetName: study.title,
            details:    reason ? `Rejected: ${reason}` : `Rejected research submission: "${study.title}"`,
        });

        res.json({ message: 'Study rejected', study });
    } catch (error) {
        console.error('rejectLiterature error:', error);
        res.status(500).json({ message: 'Failed to reject study' });
    }
};
