import mongoose, { Schema, Document } from 'mongoose';

/**
 * Reading History Document Interface
 */
export interface IReadingHistory extends Document {
    userId: string;
    studyId: mongoose.Types.ObjectId;
    lastPage: number;
    totalPages: number;
    progress: number; // Percentage (0-100)
    lastReadAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Reading History Schema
 * Tracks user reading progress and history
 */
const ReadingHistorySchema: Schema = new Schema(
    {
        userId: {
            type: String,
            required: true,
            ref: 'User',
            index: true,
        },
        studyId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'AcademicStudy',
            index: true,
        },
        lastPage: {
            type: Number,
            required: true,
            default: 0,
        },
        totalPages: {
            type: Number,
            required: true,
        },
        progress: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
            default: 0,
        },
        lastReadAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for unique user-study combination
ReadingHistorySchema.index({ userId: 1, studyId: 1 }, { unique: true });

// Index for sorting by last read
ReadingHistorySchema.index({ userId: 1, lastReadAt: -1 });

export default mongoose.model<IReadingHistory>('ReadingHistory', ReadingHistorySchema);
