import AuditLog, { AuditAction } from '../models/AuditLog';
import User from '../models/User';

/**
 * Writes an audit log entry.
 * Looks up the admin displayName from the database if not provided.
 */
export async function logAdminAction(params: {
    adminUid: string;
    action: AuditAction;
    targetName?: string;
    details?: string;
    adminName?: string;
}): Promise<void> {
    try {
        let { adminName } = params;
        if (!adminName) {
            const admin = await User.findOne({ uid: params.adminUid }).select('displayName').lean();
            adminName = (admin as any)?.displayName ?? 'Admin';
        }
        await AuditLog.create({
            adminUid:   params.adminUid,
            adminName,
            action:     params.action,
            targetName: params.targetName,
            details:    params.details,
        });
    } catch (err) {
        // Never let audit logging crash the main operation
        console.error('Audit log write failed:', err);
    }
}
