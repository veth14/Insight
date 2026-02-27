import { Request, Response } from 'express';
import UserActivity, { ActivityType, IUserActivity } from '../models/UserActivity';

/**
 * GET /api/admin/activities
 * Returns user activity log entries, newest first.
 * Query params:
 *   - search: string  — matches userName or studyTitle
 *   - type:   string  — filter by actionType (upload|download|bookmark|citation|view|login)
 *   - limit:  number  (default 50)
 *   - skip:   number  (default 0)
 */
export const getUserActivities = async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, type, limit = '50', skip = '0' } = req.query as {
            search?: string; type?: string; limit?: string; skip?: string;
        };

        const filter: Record<string, any> = {};

        if (type && type !== 'all') {
            filter.actionType = type;
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { userName:   { $regex: regex } },
                { studyTitle: { $regex: regex } },
                { actionLabel:{ $regex: regex } },
            ];
        }

        const [activities, total] = await Promise.all([
            UserActivity.find(filter)
                .sort({ createdAt: -1 })
                .skip(Number(skip))
                .limit(Number(limit))
                .lean(),
            UserActivity.countDocuments(filter),
        ]);

        res.json({ activities, total });
    } catch (error) {
        console.error('getUserActivities error:', error);
        res.status(500).json({ message: 'Failed to fetch activity logs' });
    }
};

/**
 * Helper — call this from other controllers to record a user action.
 * Does NOT throw; failures are silently swallowed so the main action isn't blocked.
 *
 * Usage:
 *   import { logActivity } from './activity.controller';
 *   await logActivity({ userId, userName, actionType: 'download', actionLabel: 'Downloaded PDF', studyTitle });
 */
export const logActivity = async (data: {
    userId: string;
    userName: string;
    actionType: ActivityType;
    actionLabel: string;
    studyId?: string;
    studyTitle?: string;
    metadata?: Record<string, any>;
}): Promise<void> => {
    try {
        await UserActivity.create({
            userId:      data.userId,
            userName:    data.userName,
            actionType:  data.actionType,
            actionLabel: data.actionLabel,
            studyId:     data.studyId     ?? null,
            studyTitle:  data.studyTitle  ?? null,
            metadata:    data.metadata    ?? null,
        });
    } catch (err) {
        console.error('[logActivity] Failed to record activity:', err);
    }
};
