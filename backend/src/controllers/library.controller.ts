import { Request, Response } from 'express';
import mongoose from 'mongoose';
import AcademicStudy from '../models/AcademicStudy';
import Bookmark from '../models/Bookmark';
import ReadingHistory from '../models/ReadingHistory';
import { AuthRequest } from '../types';
import { supabase, BUCKET_NAME } from '../config/supabase';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Fields returned in study cards (no fullText) */
const STUDY_CARD_FIELDS = '-fullText -methodology -keyFindings';

function extractStoragePath(url?: string): string | null {
    if (!url) return null;
    const marker = '/object/public/';
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    const afterBucket = url.slice(idx + marker.length);
    const slashIdx = afterBucket.indexOf('/');
    return slashIdx === -1 ? null : afterBucket.slice(slashIdx + 1).split('?')[0];
}

async function signUrl(url?: string): Promise<string | null> {
    const path = extractStoragePath(url);
    if (!path) return url ?? null;
    const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(path, 3600);
    return error ? (url ?? null) : (data?.signedUrl ?? null);
}

// ─── Search ───────────────────────────────────────────────────────────────────

/**
 * GET /api/studies/search
 * Query params: q, category, fromYear, toYear, studyType, page, limit
 * Only returns approved studies.
 */
export const searchStudies = async (req: Request, res: Response): Promise<void> => {
    try {
        const { q, category, fromYear, toYear, studyType, page = '1', limit = '20' } = req.query as Record<string, string>;

        const filter: Record<string, any> = { approvalStatus: 'approved' };

        if (q && q.trim()) {
            const re = new RegExp(q.trim(), 'i');
            filter.$or = [
                { title:    re },
                { authors:  re },
                { abstract: re },
                { keywords: re },
                { category: re },
            ];
        }

        if (category && category !== 'All Categories') {
            filter.category = new RegExp(category, 'i');
        }

        if (studyType && studyType !== 'All') {
            filter.studyType = new RegExp(studyType, 'i');
        }

        const from = parseInt(fromYear) || 0;
        const to   = parseInt(toYear)   || 9999;
        if (from || (toYear && parseInt(toYear) !== 9999)) {
            filter.yearPublished = { $gte: from, $lte: to };
        }

        const skip  = (parseInt(page) - 1) * parseInt(limit);
        const total = await AcademicStudy.countDocuments(filter);

        const studies = await AcademicStudy.find(filter)
            .select(STUDY_CARD_FIELDS)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        res.json({ studies, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error: any) {
        console.error('searchStudies error:', error);
        res.status(500).json({ message: 'Search failed' });
    }
};

// ─── Bookmarks ────────────────────────────────────────────────────────────────

/**
 * GET /api/studies/bookmarks
 * Returns all studies bookmarked by the current user.
 */
export const getBookmarks = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = (req as AuthRequest).user?.uid;

        const bookmarks = await Bookmark.find({ userId: uid })
            .sort({ createdAt: -1 })
            .lean();

        const studyIds = bookmarks.map(b => b.studyId);
        const [studies, readingHistory] = await Promise.all([
            AcademicStudy.find({ _id: { $in: studyIds } })
                .select(STUDY_CARD_FIELDS)
                .lean(),
            ReadingHistory.find({ userId: uid, studyId: { $in: studyIds } })
                .select('studyId progress lastPage totalPages lastReadAt')
                .lean(),
        ]);

        // Build a progress map keyed by studyId
        const progressMap = new Map(
            readingHistory.map(r => [String(r.studyId), r])
        );

        // Preserve bookmark order and merge progress
        const studyMap = new Map(studies.map(s => [String(s._id), s]));
        const ordered  = studyIds
            .map(id => {
                const study    = studyMap.get(String(id));
                const progress = progressMap.get(String(id));
                if (!study) return null;
                return {
                    ...study,
                    progress:   progress?.progress   ?? 0,
                    lastPage:   progress?.lastPage   ?? 0,
                    totalPages: progress?.totalPages ?? 0,
                    lastReadAt: progress?.lastReadAt ?? null,
                };
            })
            .filter(Boolean);

        res.json({ studies: ordered });
    } catch (error: any) {
        console.error('getBookmarks error:', error);
        res.status(500).json({ message: 'Failed to fetch bookmarks' });
    }
};

/**
 * POST /api/studies/:id/bookmark
 * Toggles a bookmark — adds it if absent, removes it if present.
 * Returns { bookmarked: boolean }.
 */
export const toggleBookmark = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid     = (req as AuthRequest).user?.uid;
        const studyId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(studyId)) {
            res.status(400).json({ message: 'Invalid study ID' });
            return;
        }

        const existing = await Bookmark.findOne({ userId: uid, studyId });

        if (existing) {
            await Bookmark.deleteOne({ _id: existing._id });
            res.json({ bookmarked: false });
        } else {
            await Bookmark.create({ userId: uid, studyId });
            res.json({ bookmarked: true });
        }
    } catch (error: any) {
        // handle duplicate key (race condition)
        if (error.code === 11000) {
            res.json({ bookmarked: true });
            return;
        }
        console.error('toggleBookmark error:', error);
        res.status(500).json({ message: 'Failed to toggle bookmark' });
    }
};

/**
 * GET /api/studies/bookmarks/check/:id
 * Returns { bookmarked: boolean } for a single study.
 */
export const checkBookmark = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid     = (req as AuthRequest).user?.uid;
        const studyId = req.params.id;
        const exists  = await Bookmark.exists({ userId: uid, studyId });
        res.json({ bookmarked: !!exists });
    } catch (error: any) {
        console.error('checkBookmark error:', error);
        res.status(500).json({ message: 'Failed to check bookmark' });
    }
};

// ─── Reading History ──────────────────────────────────────────────────────────

/**
 * GET /api/studies/reading-history
 * Returns the current user's reading history with populated study data.
 */
export const getReadingHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = (req as AuthRequest).user?.uid;

        const history = await ReadingHistory.find({ userId: uid })
            .sort({ lastReadAt: -1 })
            .lean();

        const studyIds = history.map(h => h.studyId);
        const studies  = await AcademicStudy.find({ _id: { $in: studyIds } })
            .select(STUDY_CARD_FIELDS)
            .lean();

        const studyMap = new Map(studies.map(s => [String(s._id), s]));

        const result = history.map(h => ({
            ...studyMap.get(String(h.studyId)),
            _readingId: h._id,
            progress:   h.progress,   // 0-100
            lastPage:   h.lastPage,
            totalPages: h.totalPages,
            lastReadAt: h.lastReadAt,
        })).filter(r => r._id); // omit deleted studies

        res.json({ history: result });
    } catch (error: any) {
        console.error('getReadingHistory error:', error);
        res.status(500).json({ message: 'Failed to fetch reading history' });
    }
};

/**
 * PUT /api/studies/:id/progress
 * Body: { lastPage, totalPages, progress }
 * Upserts a ReadingHistory record for the current user.
 */
// ─── Dashboard ───────────────────────────────────────────────────────────────

/**
 * GET /api/studies/dashboard
 * Returns personalised dashboard data for the current user:
 *   stats, recentlyAdded, recommended, trending
 */
export const getDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = (req as AuthRequest).user?.uid;
        const APPROVED = { approvalStatus: 'approved' };

        const FIELDS = '-fullText -methodology -keyFindings -abstract';

        const [totalApproved, readingCount, savedCount, recentStudies, trendingStudies] = await Promise.all([
            AcademicStudy.countDocuments(APPROVED),
            ReadingHistory.countDocuments({ userId: uid, progress: { $gt: 0, $lt: 100 } }),
            Bookmark.countDocuments({ userId: uid }),
            AcademicStudy.find(APPROVED)
                .select(FIELDS)
                .sort({ createdAt: -1 })
                .limit(6)
                .lean(),
            AcademicStudy.find(APPROVED)
                .select(FIELDS)
                .sort({ viewCount: -1 })
                .limit(3)
                .lean(),
        ]);

        // Recommended = separate query excluding trending IDs, sorted by newest viewCount
        const trendingIds = trendingStudies.map(s => s._id);
        const recommendedStudies = await AcademicStudy.find({
            ...APPROVED,
            _id: { $nin: trendingIds },
        })
            .select(FIELDS)
            .sort({ viewCount: -1, createdAt: -1 })
            .limit(6)
            .lean();

        // Sign image URLs for all cards in parallel
        const signStudies = async (list: any[]) =>
            Promise.all(list.map(async s => ({
                ...s,
                systemImageUrl: await signUrl(s.systemImageUrl),
            })));

        const [recentSigned, trendingSigned, recommendedSigned] = await Promise.all([
            signStudies(recentStudies),
            signStudies(trendingStudies),
            signStudies(recommendedStudies),
        ]);

        const trending    = trendingSigned;
        const recommended = recommendedSigned;

        res.json({
            stats: { totalApproved, readingCount, savedCount },
            recentlyAdded: recentSigned,
            recommended,
            trending,
        });
    } catch (error: any) {
        console.error('getDashboard error:', error);
        res.status(500).json({ message: 'Failed to load dashboard' });
    }
};

export const updateProgress = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid     = (req as AuthRequest).user?.uid;
        const studyId = req.params.id;
        const { lastPage = 0, totalPages = 1, progress = 0 } = req.body;

        if (!mongoose.Types.ObjectId.isValid(studyId)) {
            res.status(400).json({ message: 'Invalid study ID' });
            return;
        }

        const record = await ReadingHistory.findOneAndUpdate(
            { userId: uid, studyId },
            {
                lastPage:   Number(lastPage),
                totalPages: Number(totalPages),
                progress:   Math.min(100, Math.max(0, Number(progress))),
                lastReadAt: new Date(),
            },
            { upsert: true, new: true }
        );

        res.json({ record });
    } catch (error: any) {
        console.error('updateProgress error:', error);
        res.status(500).json({ message: 'Failed to update progress' });
    }
};

// ─── Study Detail ─────────────────────────────────────────────────────────────

/**
 * GET /api/studies/:id
 * Returns full study detail with signed URLs + bookmark status.
 * Increments viewCount on each call.
 */
export const getStudyById = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = (req as AuthRequest).user?.uid;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid study ID' });
            return;
        }

        const study = await AcademicStudy.findById(id).lean();
        if (!study || (study as any).approvalStatus !== 'approved') {
            res.status(404).json({ message: 'Study not found' });
            return;
        }

        // Increment view count (fire-and-forget)
        AcademicStudy.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }).catch(() => {});

        // Check bookmark status + reading progress for current user
        const [isBookmarkedDoc, readingRecord] = await Promise.all([
            uid ? Bookmark.exists({ userId: uid, studyId: id }) : Promise.resolve(null),
            uid ? ReadingHistory.findOne({ userId: uid, studyId: id })
                      .select('lastPage totalPages progress').lean()
                : Promise.resolve(null),
        ]);
        const isBookmarked = !!isBookmarkedDoc;

        // Sign both image and PDF URLs
        const [signedFileUrl, signedImageUrl] = await Promise.all([
            signUrl((study as any).fileUrl),
            signUrl((study as any).systemImageUrl),
        ]);

        res.json({
            ...study,
            fileUrl:        signedFileUrl,
            systemImageUrl: signedImageUrl,
            isBookmarked,
            // Reading-resume data (null when user has never opened the PDF)
            lastPage:   (readingRecord as any)?.lastPage   ?? null,
            totalPages: (readingRecord as any)?.totalPages ?? null,
            progress:   (readingRecord as any)?.progress   ?? null,
        });
    } catch (error: any) {
        console.error('getStudyById error:', error);
        res.status(500).json({ message: 'Failed to fetch study' });
    }
};

// ─── Trending Topics ──────────────────────────────────────────────────────────

/**
 * GET /api/studies/trending-topics
 * Returns distinct categories with study counts, sorted by popularity.
 */
export const getTrendingTopics = async (req: Request, res: Response): Promise<void> => {
    try {
        const topics = await AcademicStudy.aggregate([
            { $match: { approvalStatus: 'approved' } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 25 },
        ]);

        res.json(topics.map(t => ({ topic: t._id as string, count: t.count as number })));
    } catch (error: any) {
        console.error('getTrendingTopics error:', error);
        res.status(500).json({ message: 'Failed to fetch trending topics' });
    }
};
