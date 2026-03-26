import mongoose, { Schema, Document } from 'mongoose';

export interface IRegisterOTP extends Document {
    email: string;
    otp: string;
    expiresAt: Date;
    attempts: number;
    isVerified: boolean;
    createdAt: Date;
}

const RegisterOTPSchema = new Schema<IRegisterOTP>(
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
        isVerified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// TTL index: MongoDB auto-deletes expired records
RegisterOTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });      

export default mongoose.model<IRegisterOTP>('RegisterOTP', RegisterOTPSchema);
