import { Request, Response } from 'express';
import AuditLog from '../models/AuditLog';

/**
 * GET /api/admin/audit
 * Returns audit log entries, newest first.
 * Query params:
 *   - search: string (optional, matches action, targetName, adminName)
 *   - limit:  number (default 50)
 *   - skip:   number (default 0)
 */
export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, limit = '50', skip = '0' } = req.query as {
            search?: string; limit?: string; skip?: string;
        };

        const filter: Record<string, any> = {};

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { action:     { $regex: regex } },
                { adminName:  { $regex: regex } },
                { targetName: { $regex: regex } },
                { details:    { $regex: regex } },
            ];
        }

        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .sort({ createdAt: -1 })
                .skip(Number(skip))
                .limit(Number(limit))
                .lean(),
            AuditLog.countDocuments(filter),
        ]);

        res.json({ logs, total });
    } catch (error) {
        console.error('getAuditLogs error:', error);
        res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
};
