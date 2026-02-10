import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../types';

/**
 * User Document Interface
 */
export interface IUser extends Document {
    uid: string; // Firebase UID
    email: string;
    displayName: string;
    role: UserRole;
    yearLevel?: number;
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
        displayName: {
            type: String,
            required: true,
            trim: true,
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
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
UserSchema.index({ role: 1 });

export default mongoose.model<IUser>('User', UserSchema);
