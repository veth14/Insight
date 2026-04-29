import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { AuthRequest, UserRole } from '../types';

/**
 * Role-based authorization middleware factory
 * Checks if authenticated user has required role
 */
export const authorize = (...allowedRoles: UserRole[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as AuthRequest;

            if (!authReq.user?.uid) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            // Get user from database
            const user = await User.findOne({ uid: authReq.user.uid });

            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }

            // Check if user's role is in allowed roles
            if (!allowedRoles.includes(user.role)) {
                res.status(403).json({
                    message: 'Forbidden: Insufficient permissions',
                });
                return;
            }

            next();
        } catch (error) {
            console.error('Authorization error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };
};

/**
 * Check if user can upload (4th year student, admin, or faculty)
 */
export const canUpload = authorize(
    UserRole.STUDENT_4TH,
    UserRole.ADMIN,
    UserRole.FACULTY
);

/**
 * Check if user is admin or faculty
 */
export const isAdminOrFaculty = authorize(
    UserRole.ADMIN,
    UserRole.FACULTY
);
