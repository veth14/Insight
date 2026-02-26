import mongoose, { Schema, Document } from 'mongoose';

export interface IPasswordResetOTP extends Document {
    email: string;
    otp: string;
    expiresAt: Date;
    attempts: number;
    resetToken: string | null;
    resetTokenExpiresAt: Date | null;
    createdAt: Date;
}

const PasswordResetOTPSchema = new Schema<IPasswordResetOTP>(
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
        resetToken: {
            type: String,
            default: null,
        },
        resetTokenExpiresAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// TTL index: MongoDB auto-deletes expired records
PasswordResetOTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IPasswordResetOTP>('PasswordResetOTP', PasswordResetOTPSchema);
