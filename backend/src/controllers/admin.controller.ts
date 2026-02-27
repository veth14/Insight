import { Request, Response } from 'express';
import User from '../models/User';
import { AuthRequest, UserRole } from '../types';
import { logAdminAction } from '../utils/audit';
import { AuditAction } from '../models/AuditLog';

const NON_ADMIN_ROLES = [
    UserRole.STUDENT_1ST_TO_3RD,
    UserRole.STUDENT_4TH,
    UserRole.FACULTY,
];

/**
 * GET /api/admin/users
 * Returns all users except admins.
 * Query params:
 *   - status: 'active' | 'suspended' (optional, default = all)
 *   - search: string (optional, matches displayName or email)
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, search } = req.query as { status?: string; search?: string };

        const filter: Record<string, any> = {
            role: { $in: NON_ADMIN_ROLES },
        };

        if (status === 'active' || status === 'suspended') {
            filter.status = status;
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { displayName: { $regex: regex } },
                { email: { $regex: regex } },
                { studentNumber: { $regex: regex } },
            ];
        }

        const users = await User.find(filter)
            .select('uid email displayName studentNumber phoneNumber role yearLevel program status studentAccessRights lastActiveAt createdAt')
            .sort({ lastActiveAt: -1, createdAt: -1 })
            .lean();

        res.json({ users });
    } catch (error) {
        console.error('Admin getUsers error:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};

/**
 * PATCH /api/admin/users/:uid/status
 * Toggle a user's status between active and suspended.
 * Body: { status: 'active' | 'suspended' }
 */
export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { uid } = req.params;
        const { status } = req.body as { status: 'active' | 'suspended' };

        if (status !== 'active' && status !== 'suspended') {
            res.status(400).json({ message: 'Invalid status. Must be "active" or "suspended".' });
            return;
        }

        const user = await User.findOne({ uid });

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Prevent modifying admins
        if (user.role === UserRole.ADMIN) {
            res.status(403).json({ message: 'Cannot modify admin accounts.' });
            return;
        }

        user.status = status;
        await user.save();

        // Audit log
        const adminUid = (req as AuthRequest).user?.uid ?? '';
        await logAdminAction({
            adminUid,
            action: status === 'suspended' ? AuditAction.SUSPEND_USER : AuditAction.ACTIVATE_USER,
            targetName: user.displayName,
            details: `${status === 'suspended' ? 'Suspended' : 'Activated'} account for ${user.email}`,
        });

        res.json({
            message: `User ${status === 'suspended' ? 'suspended' : 'activated'} successfully`,
            user: {
                uid: user.uid,
                status: user.status,
            },
        });
    } catch (error) {
        console.error('Admin updateUserStatus error:', error);
        res.status(500).json({ message: 'Failed to update user status' });
    }
};

/**
 * PUT /api/admin/users/:uid
 * Update editable user fields (name, phone, yearLevel, status, studentAccessRights).
 * Email and studentNumber are NOT modifiable.
 */
/**
 * GET /api/admin/registrations
 * Returns users with registrationStatus filter.
 * Query: ?status=pending|approved|rejected&search=
 */
export const getRegistrations = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, search } = req.query as { status?: string; search?: string };

        const filter: Record<string, any> = {
            role: { $in: NON_ADMIN_ROLES },
        };

        if (status === 'pending' || status === 'approved' || status === 'rejected') {
            filter.registrationStatus = status;
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { displayName: { $regex: regex } },
                { email:         { $regex: regex } },
                { studentNumber: { $regex: regex } },
            ];
        }

        const users = await User.find(filter)
            .select('uid email displayName studentNumber yearLevel program registrationStatus registrationFormUrl createdAt')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ users });
    } catch (error) {
        console.error('Admin getRegistrations error:', error);
        res.status(500).json({ message: 'Failed to fetch registrations' });
    }
};

/**
 * PATCH /api/admin/registrations/:uid/approve
 */
export const approveRegistration = async (req: Request, res: Response): Promise<void> => {
    try {
        const { uid } = req.params;
        const user = await User.findOne({ uid });
        if (!user) { res.status(404).json({ message: 'User not found' }); return; }

        user.registrationStatus = 'approved';
        await user.save();

        const adminUid = (req as AuthRequest).user?.uid ?? '';
        await logAdminAction({
            adminUid,
            action: AuditAction.APPROVED_REGISTRATION,
            targetName: user.displayName,
            details: `Approved registration for ${user.email}`,
        });

        res.json({ message: 'Registration approved', uid });
    } catch (error) {
        console.error('approveRegistration error:', error);
        res.status(500).json({ message: 'Failed to approve registration' });
    }
};

/**
 * PATCH /api/admin/registrations/:uid/reject
 * Body: { reason?: string }
 */
export const rejectRegistration = async (req: Request, res: Response): Promise<void> => {
    try {
        const { uid } = req.params;
        const { reason } = req.body as { reason?: string };
        const user = await User.findOne({ uid });
        if (!user) { res.status(404).json({ message: 'User not found' }); return; }

        user.registrationStatus = 'rejected';
        await user.save();

        const adminUid = (req as AuthRequest).user?.uid ?? '';
        await logAdminAction({
            adminUid,
            action: AuditAction.REJECTED_REGISTRATION,
            targetName: user.displayName,
            details: reason ? `Rejected: ${reason}` : `Rejected registration for ${user.email}`,
        });

        res.json({ message: 'Registration rejected', uid });
    } catch (error) {
        console.error('rejectRegistration error:', error);
        res.status(500).json({ message: 'Failed to reject registration' });
    }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { uid } = req.params;
        const { displayName, phoneNumber, yearLevel, status, studentAccessRights } = req.body as {
            displayName?: string;
            phoneNumber?: string;
            yearLevel?: number;
            status?: 'active' | 'suspended';
            studentAccessRights?: boolean;
        };

        const user = await User.findOne({ uid });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        if (user.role === UserRole.ADMIN) {
            res.status(403).json({ message: 'Cannot modify admin accounts.' });
            return;
        }

        const updates: Record<string, any> = {};
        if (displayName !== undefined) updates.displayName = displayName.trim();
        if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber.trim();
        if (yearLevel !== undefined) updates.yearLevel = yearLevel === 0 ? undefined : yearLevel;
        if (status === 'active' || status === 'suspended') updates.status = status;
        if (studentAccessRights !== undefined) updates.studentAccessRights = studentAccessRights;

        await User.updateOne({ uid }, { $set: updates });
        const updated = await User.findOne({ uid })
            .select('uid email displayName studentNumber phoneNumber role yearLevel program status studentAccessRights lastActiveAt createdAt')
            .lean();

        // Audit log
        const adminUid = (req as AuthRequest).user?.uid ?? '';
        await logAdminAction({
            adminUid,
            action: AuditAction.EDIT_USER,
            targetName: (updated as any)?.displayName ?? uid,
            details: `Updated profile fields: ${Object.keys(updates).join(', ')}`,
        });

        res.json({ message: 'User updated successfully', user: updated });
    } catch (error) {
        console.error('Admin updateUser error:', error);
        res.status(500).json({ message: 'Failed to update user' });
    }
};
