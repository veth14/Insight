import mongoose, { Schema, Document } from 'mongoose';

/**
 * Academic Study Document Interface
 */
export interface IAcademicStudy extends Document {
    title: string;
    authors: string[];
    abstract: string;
    keywords: string[];
    category: string;
    yearPublished: number;
    uploadedBy: string; // User UID
    fileUrl: string; // Supabase file path
    thumbnailUrl?: string;
    fullText: string; // Extracted text for search
    downloadCount: number;
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Academic Study Schema
 * Stores metadata and searchable content for research papers
 */
const AcademicStudySchema: Schema = new Schema(
    {
        title: {
            type: String,
            required: true,
            text: true, // Enable text search on title
        },
        authors: {
            type: [String],
            required: true,
        },
        abstract: {
            type: String,
            required: true,
            text: true, // Enable text search on abstract
        },
        keywords: {
            type: [String],
            required: true,
            index: true,
        },
        category: {
            type: String,
            required: true,
            index: true,
        },
        yearPublished: {
            type: Number,
            required: true,
            index: true,
        },
        uploadedBy: {
            type: String,
            required: true,
            ref: 'User',
        },
        fileUrl: {
            type: String,
            required: true,
        },
        thumbnailUrl: {
            type: String,
        },
        fullText: {
            type: String,
            required: true,
            text: true, // Enable text search on full text
        },
        downloadCount: {
            type: Number,
            default: 0,
        },
        viewCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Compound text index for full-text search
AcademicStudySchema.index(
    {
        title: 'text',
        abstract: 'text',
        fullText: 'text',
        authors: 'text',
        keywords: 'text',
    },
    {
        weights: {
            title: 10,
            keywords: 8,
            abstract: 5,
            authors: 3,
            fullText: 1,
        },
        name: 'search_index',
    }
);

// Compound indexes for filtering
AcademicStudySchema.index({ category: 1, yearPublished: -1 });
AcademicStudySchema.index({ uploadedBy: 1, createdAt: -1 });

export default mongoose.model<IAcademicStudy>('AcademicStudy', AcademicStudySchema);
