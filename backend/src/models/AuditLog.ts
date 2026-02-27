import mongoose, { Schema, Document } from 'mongoose';

export enum AuditAction {
    SUSPEND_USER           = 'SUSPEND_USER',
    ACTIVATE_USER          = 'ACTIVATE_USER',
    EDIT_USER              = 'EDIT_USER',
    CHANGE_PASSWORD        = 'CHANGE_PASSWORD',
    APPROVED_REGISTRATION  = 'APPROVED_REGISTRATION',
    REJECTED_REGISTRATION  = 'REJECTED_REGISTRATION',
    APPROVED_LITERATURE    = 'APPROVED_LITERATURE',
    REJECTED_LITERATURE    = 'REJECTED_LITERATURE',
}

export interface IAuditLog extends Document {
    adminUid: string;
    adminName: string;
    action: AuditAction;
    targetName?: string;
    details?: string;
    createdAt: Date;
}

const AuditLogSchema: Schema = new Schema(
    {
        adminUid:   { type: String, required: true, index: true },
        adminName:  { type: String, required: true },
        action:     { type: String, enum: Object.values(AuditAction), required: true, index: true },
        targetName: { type: String },
        details:    { type: String },
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
