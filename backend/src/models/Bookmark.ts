import mongoose, { Schema, Document } from 'mongoose';

/**
 * Bookmark Document Interface
 */
export interface IBookmark extends Document {
    userId: string;
    studyId: mongoose.Types.ObjectId;
    createdAt: Date;
}

/**
 * Bookmark Schema
 * Stores user bookmarks for academic studies
 */
const BookmarkSchema: Schema = new Schema(
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
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Compound index for unique user-study bookmark
BookmarkSchema.index({ userId: 1, studyId: 1 }, { unique: true });

// Index for sorting by creation date
BookmarkSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IBookmark>('Bookmark', BookmarkSchema);
