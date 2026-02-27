import mongoose, { Schema, Document } from 'mongoose';

export type ActivityType = 'upload' | 'download' | 'bookmark' | 'citation' | 'view' | 'login';

export interface IUserActivity extends Document {
    userId: string;
    userName: string;
    actionType: ActivityType;
    actionLabel: string;       // e.g. "Uploaded New Thesis", "Downloaded PDF"
    studyId?: mongoose.Types.ObjectId;
    studyTitle?: string;       // truncated paper title shown below action
    metadata?: Record<string, any>;
    createdAt: Date;
}

const UserActivitySchema: Schema = new Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        userName: {
            type: String,
            required: true,
        },
        actionType: {
            type: String,
            enum: ['upload', 'download', 'bookmark', 'citation', 'view', 'login'],
            required: true,
            index: true,
        },
        actionLabel: {
            type: String,
            required: true,
        },
        studyId: {
            type: Schema.Types.ObjectId,
            ref: 'AcademicStudy',
            default: null,
        },
        studyTitle: {
            type: String,
            default: null,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: null,
        },
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);

// Compound index for fast admin queries (newest first per user)
UserActivitySchema.index({ createdAt: -1 });
UserActivitySchema.index({ actionType: 1, createdAt: -1 });

export default mongoose.model<IUserActivity>('UserActivity', UserActivitySchema);
