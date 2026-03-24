import mongoose, { Schema, Document } from 'mongoose';

/**
 * Academic Study Document Interface
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface IAcademicStudy extends Document {
    title: string;
    authors: string[];
    abstract: string;
    methodology?: string;
    keyFindings?: string;
    toolsUsed?: string[];
    keywords: string[];
    category: string;
    department?: string;
    studyType: string;         // e.g. 'Thesis' | 'Project' | 'Dissertation'
    yearPublished: number;
    uploadedBy: string;        // User UID
    fileUrl: string;
    systemImageUrl?: string;
    thumbnailUrl?: string;
    fullText: string;
    downloadCount: number;
    viewCount: number;
    approvalStatus: ApprovalStatus;
    rejectionReason?: string;
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
        },        department: {
            type: String,
            required: false,
            index: true,
        },        yearPublished: {
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
        systemImageUrl: {
            type: String,
            default: null,
        },
        thumbnailUrl: {
            type: String,
        },
        fullText: {
            type: String,
            required: true,
            text: true, // Enable text search on full text
        },
        methodology:  { type: String, default: null },
        keyFindings:  { type: String, default: null },
        toolsUsed:    { type: [String], default: [] },
        studyType: {
            type: String,
            required: true,
            default: 'Thesis',
            index: true,
        },
        approvalStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
            index: true,
        },
        rejectionReason: { type: String, default: null },
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
