import { Request, Response } from 'express';
import User from '../models/User';
import AcademicStudy from '../models/AcademicStudy';

/**
 * GET /api/admin/analytics
 * Returns all stats needed for the Admin Analytics Dashboard.
 */
export const getAnalytics = async (_req: Request, res: Response): Promise<void> => {
    try {
        const now = new Date();

        // ── Run all aggregations in parallel ────────────────────────────
        const [
            totalUsers,
            activeUsers,
            suspendedUsers,
            pendingRegistrations,
            totalStudies,
            approvedStudies,
            pendingStudies,
            rejectedStudies,
            viewsAgg,
            downloadsAgg,
            userGrowthRaw,
            yearLevelRaw,
            categoryRaw,
            studyTypeRaw,
        ] = await Promise.all([
            // Users
            User.countDocuments({ role: { $ne: 'admin' } }),
            User.countDocuments({ role: { $ne: 'admin' }, status: 'active' }),
            User.countDocuments({ role: { $ne: 'admin' }, status: 'suspended' }),
            User.countDocuments({ role: { $ne: 'admin' }, registrationStatus: 'pending' }),

            // Studies
            AcademicStudy.countDocuments({}),
            AcademicStudy.countDocuments({ approvalStatus: 'approved' }),
            AcademicStudy.countDocuments({ approvalStatus: 'pending' }),
            AcademicStudy.countDocuments({ approvalStatus: 'rejected' }),

            // Totals
            AcademicStudy.aggregate([{ $group: { _id: null, total: { $sum: '$viewCount' } } }]),
            AcademicStudy.aggregate([{ $group: { _id: null, total: { $sum: '$downloadCount' } } }]),

            // User growth — last 7 months
            User.aggregate([
                {
                    $match: {
                        role: { $ne: 'admin' },
                        createdAt: {
                            $gte: new Date(now.getFullYear(), now.getMonth() - 6, 1),
                        },
                    },
                },
                {
                    $group: {
                        _id: {
                            year:  { $year:  '$createdAt' },
                            month: { $month: '$createdAt' },
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]),

            // Year level breakdown (students only)
            User.aggregate([
                { $match: { role: { $ne: 'admin' }, yearLevel: { $exists: true, $ne: null } } },
                { $group: { _id: '$yearLevel', count: { $sum: 1 } } },
                { $sort: { _id: 1 } },
            ]),

            // Top research categories
            AcademicStudy.aggregate([
                { $match: { approvalStatus: 'approved' } },
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 7 },
            ]),

            // Study type breakdown
            AcademicStudy.aggregate([
                { $group: { _id: '$studyType', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
        ]);

        // ── Format user growth into labels + data arrays ─────────────────
        const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const growthMap = new Map<string, number>();
        (userGrowthRaw as any[]).forEach(r => {
            growthMap.set(`${r._id.year}-${r._id.month}`, r.count);
        });

        const growthLabels: string[] = [];
        const growthData: number[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
            growthLabels.push(MONTH_LABELS[d.getMonth()]);
            growthData.push(growthMap.get(key) ?? 0);
        }

        // ── Format year level for pie chart ─────────────────────────────
        const YEAR_COLORS = ['#7C3AED','#A78BFA','#C4B5FD','#EC4899','#F472B6'];
        const yearLevel = (yearLevelRaw as any[]).map((r, i) => ({
            name:  `${r._id}${r._id === 1 ? 'st' : r._id === 2 ? 'nd' : r._id === 3 ? 'rd' : 'th'} Year`,
            count: r.count,
            color: YEAR_COLORS[i % YEAR_COLORS.length],
        }));

        // ── Format categories ────────────────────────────────────────────
        const categories = (categoryRaw as any[]).map(r => ({ label: r._id ?? 'Other', value: r.count }));

        // ── Format study types ───────────────────────────────────────────
        const studyTypes = (studyTypeRaw as any[]).map(r => ({ label: r._id ?? 'Other', value: r.count }));

        res.json({
            stats: {
                totalUsers,
                activeUsers,
                suspendedUsers,
                pendingRegistrations,
                totalStudies,
                approvedStudies,
                pendingStudies,
                rejectedStudies,
                totalViews:     (viewsAgg[0] as any)?.total ?? 0,
                totalDownloads: (downloadsAgg[0] as any)?.total ?? 0,
            },
            userGrowth: { labels: growthLabels, data: growthData },
            yearLevel,
            categories,
            studyTypes,
        });
    } catch (error) {
        console.error('getAnalytics error:', error);
        res.status(500).json({ message: 'Failed to fetch analytics' });
    }
};
