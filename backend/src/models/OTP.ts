import mongoose, { Schema, Document } from 'mongoose';

/**
 * OTP Document Interface
 * Matches the structure stored in MongoDB
 */
export interface IOTP extends Document {
    email: string;
    otp: string;
    expiresAt: Date;
    attempts: number;
    createdAt: Date;
}

const OTPSchema = new Schema<IOTP>(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        otp: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        attempts: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// TTL index: MongoDB auto-deletes the document after expiresAt
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IOTP>('OTP', OTPSchema);
