import { Request } from 'express';

/**
 * User Role Enum
 */
export enum UserRole {
    STUDENT_1ST_TO_3RD = 'student_1_3',
    STUDENT_4TH = 'student_4',
    ADMIN = 'admin',
    FACULTY = 'faculty'
}

/**
 * Request with authenticated user
 */
export interface AuthRequest extends Request {
    user?: {
        uid: string;
        email?: string;
    };
}
