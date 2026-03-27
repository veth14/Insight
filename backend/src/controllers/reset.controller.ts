import { Request, Response } from 'express';
import crypto from 'crypto';
import PasswordResetOTP from '../models/PasswordResetOTP';
import { admin } from '../config/firebase';
import { sendEmailWithFallback } from '../services/email.service';

const MAX_ATTEMPTS = 5;
const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const RESET_TOKEN_EXPIRY_MINUTES = 10;

const generateOTP = (): string =>
    Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit

/**
 * POST /api/auth/forgot-password
 * Sends a 6-digit OTP to the email for password reset.
 * Public — no auth middleware.
 */
export const sendResetOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ message: 'Email is required.' });
            return;
        }

        // Verify the email exists in Firebase
        try {
            await admin.auth().getUserByEmail(email.toLowerCase());
        } catch {
            // Generic message to avoid email enumeration
            res.status(200).json({ message: 'If that email is registered, a code has been sent.' });
            return;
        }

        // Rate limiting: reject if sent less than RESEND_COOLDOWN_SECONDS ago
        const existing = await PasswordResetOTP.findOne({ email: email.toLowerCase() });
        if (existing) {
            const secondsSinceSent = Math.floor(
                (Date.now() - (existing.createdAt as Date).getTime()) / 1000
            );
            if (secondsSinceSent < RESEND_COOLDOWN_SECONDS) {
                const retryAfter = RESEND_COOLDOWN_SECONDS - secondsSinceSent;
                res.status(429).json({
                    message: `Please wait ${retryAfter} second${retryAfter !== 1 ? 's' : ''} before requesting a new code.`,
                    retryAfter,
                });
                return;
            }
            await PasswordResetOTP.deleteMany({ email: email.toLowerCase() });
        }

        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        await PasswordResetOTP.create({
            email: email.toLowerCase(),
            otp: otpCode,
            expiresAt,
            attempts: 0,
            resetToken: null,
            resetTokenExpiresAt: null,
        });

        await sendEmailWithFallback({
            to: email,
            fromName: 'Insight App',
            subject: 'Insight — Password Reset Code',
            html: `
                <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #F8F9FF; border-radius: 12px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="color: #0E1F43; font-size: 22px; margin: 0;">Insight</h1>
                        <p style="color: #666; font-size: 13px; margin-top: 4px;">CCS Academic Research Repository</p>
                    </div>
                    <h2 style="color: #0E1F43; font-size: 18px; text-align: center;">Password Reset</h2>
                    <p style="color: #444; text-align: center; font-size: 14px;">Your 6-digit password reset code is:</p>
                    <div style="
                        font-size: 36px;
                        font-weight: 700;
                        letter-spacing: 12px;
                        color: #0E1F43;
                        text-align: center;
                        padding: 24px 16px;
                        background: #fff;
                        border: 2px solid #CDDDFF;
                        border-radius: 10px;
                        margin: 20px 0;
                    ">
                        ${otpCode}
                    </div>
                    <p style="color: #888; text-align: center; font-size: 13px;">This code expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.</p>
                    <p style="color: #888; text-align: center; font-size: 13px;">If you did not request a password reset, you can safely ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #E5E7F5; margin: 24px 0;" />
                    <p style="color: #aaa; font-size: 11px; text-align: center;">
                        InsiqhtMobileApp@qcu.ph
                    </p>
                </div>
            `,
        });

        res.status(200).json({ message: 'If that email is registered, a code has been sent.' });
    } catch (error: any) {
        console.error('Send Reset OTP error:', error?.message || error);
        res.status(500).json({ message: 'Failed to send reset code. Please try again.' });
    }
};

/**
 * POST /api/auth/verify-reset-otp
 * Verifies the 6-digit OTP; returns a short-lived resetToken on success.
 * Public — no auth middleware.
 */
export const verifyResetOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            res.status(400).json({ message: 'Email and code are required.' });
            return;
        }

        const record = await PasswordResetOTP.findOne({ email: email.toLowerCase() });

        if (!record) {
            res.status(400).json({ message: 'No reset code found. Please request a new one.', code: 'OTP_NOT_FOUND' });
            return;
        }

        if (record.expiresAt < new Date()) {
            await PasswordResetOTP.deleteOne({ _id: record._id });
            res.status(400).json({ message: 'Code has expired. Please request a new one.', code: 'OTP_EXPIRED' });
            return;
        }

        if (record.attempts >= MAX_ATTEMPTS) {
            await PasswordResetOTP.deleteOne({ _id: record._id });
            res.status(400).json({ message: 'Too many failed attempts. Please request a new code.', code: 'MAX_ATTEMPTS' });
            return;
        }

        if (record.otp !== otp.trim()) {
            await PasswordResetOTP.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
            const remaining = MAX_ATTEMPTS - (record.attempts + 1);
            res.status(400).json({
                message: `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
                code: 'INVALID_OTP',
                attemptsRemaining: remaining,
            });
            return;
        }

        // OTP correct — generate a one-time resetToken
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

        await PasswordResetOTP.updateOne(
            { _id: record._id },
            { resetToken, resetTokenExpiresAt, otp: '' } // clear OTP so it can't be reused
        );

        res.status(200).json({ message: 'Code verified.', resetToken });
    } catch (error) {
        console.error('Verify Reset OTP error:', error);
        res.status(500).json({ message: 'Failed to verify code. Please try again.' });
    }
};

/**
 * POST /api/auth/reset-password
 * Resets the user's Firebase password using a valid resetToken.
 * Public — no auth middleware.
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, resetToken, newPassword } = req.body;

        if (!email || !resetToken || !newPassword) {
            res.status(400).json({ message: 'Email, reset token, and new password are required.' });
            return;
        }

        if (newPassword.length < 6) {
            res.status(400).json({ message: 'Password must be at least 6 characters.' });
            return;
        }

        const record = await PasswordResetOTP.findOne({ email: email.toLowerCase(), resetToken });

        if (!record || !record.resetToken) {
            res.status(400).json({ message: 'Invalid or expired reset session. Please start over.', code: 'INVALID_TOKEN' });
            return;
        }

        if (!record.resetTokenExpiresAt || record.resetTokenExpiresAt < new Date()) {
            await PasswordResetOTP.deleteOne({ _id: record._id });
            res.status(400).json({ message: 'Reset session has expired. Please start over.', code: 'TOKEN_EXPIRED' });
            return;
        }

        // Update Firebase password
        const firebaseUser = await admin.auth().getUserByEmail(email.toLowerCase());
        await admin.auth().updateUser(firebaseUser.uid, { password: newPassword });

        // Revoke all refresh tokens so existing sessions are invalidated
        await admin.auth().revokeRefreshTokens(firebaseUser.uid);

        // Clean up the reset record
        await PasswordResetOTP.deleteOne({ _id: record._id });

        res.status(200).json({ message: 'Password reset successfully.' });
    } catch (error: any) {
        console.error('Reset Password error:', error?.message || error);
        res.status(500).json({ message: 'Failed to reset password. Please try again.' });
    }
};
