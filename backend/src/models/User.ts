import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../types';

/**
 * User Document Interface
 */
export interface IUser extends Document {
    uid: string; // Firebase UID
    email: string;
    studentNumber: string;
    displayName: string;
    phoneNumber?: string;
    role: UserRole;
    yearLevel?: number;
    program?: string;
    status: 'active' | 'suspended';
    registrationStatus: 'pending' | 'approved' | 'rejected';
    registrationFormUrl?: string;
    studentAccessRights: boolean;
    lastActiveAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * User Schema
 * Stores user profile data synced from Firebase Authentication
 */
const UserSchema: Schema = new Schema(
    {
        uid: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        studentNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        displayName: {
            type: String,
            required: true,
            trim: true,
        },
        phoneNumber: {
            type: String,
            required: false,
            trim: true,
            default: null,
        },
        role: {
            type: String,
            enum: Object.values(UserRole),
            required: true,
            default: UserRole.STUDENT_1ST_TO_3RD,
        },
        yearLevel: {
            type: Number,
            min: 1,
            max: 5,
        },
        program: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'suspended'],
            default: 'active',
            index: true,
        },
        studentAccessRights: {
            type: Boolean,
            default: true,
        },
        registrationStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
            index: true,
        },
        registrationFormUrl: {
            type: String,
            default: null,
        },
        lastActiveAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
UserSchema.index({ role: 1 });

export default mongoose.model<IUser>('User', UserSchema);
