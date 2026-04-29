import { Request, Response } from 'express';
import crypto from 'crypto';
import OTP from '../models/OTP';
import { sendEmailWithFallback } from '../services/email.service';

const MAX_ATTEMPTS = 3;
const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 5 * 60; // 5 minutes, matches mobile cooldown

/**
 * Generates a cryptographically secure 4-digit numeric OTP
 */
const generateOTP = (): string =>
    crypto.randomInt(1000, 10000).toString();

/**
 * POST /api/auth/send-otp
 * Generates a new OTP, saves it to MongoDB, and sends it via email.
 * Requires a valid Firebase Bearer token (authenticate middleware).
 */
export const sendOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ message: 'Email is required' });
            return;
        }

        // Rate limit: reject if a code was sent less than RESEND_COOLDOWN_SECONDS ago
        const existingOTP = await OTP.findOne({ email: email.toLowerCase() });
        if (existingOTP) {
            const secondsSinceSent = Math.floor((Date.now() - (existingOTP.createdAt as Date).getTime()) / 1000);
            if (secondsSinceSent < RESEND_COOLDOWN_SECONDS) {
                const retryAfter = RESEND_COOLDOWN_SECONDS - secondsSinceSent;
                res.status(429).json({
                    message: `Please wait ${retryAfter} second${retryAfter !== 1 ? 's' : ''} before requesting a new code.`,
                    retryAfter,
                });
                return;
            }
        }

        // Delete any previous OTPs for this email to keep collection clean
        await OTP.deleteMany({ email: email.toLowerCase() });

        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        // Persist OTP record
        await OTP.create({
            email: email.toLowerCase(),
            otp: otpCode,
            expiresAt,
            attempts: 0,
        });

        // Send email
        await sendEmailWithFallback({
            to: email,
            fromName: 'Insight App',
            subject: 'Insight — Your Verification Code',
            html: `
                <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #F8F9FF; border-radius: 12px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="color: #0E1F43; font-size: 22px; margin: 0;">Insight</h1>
                        <p style="color: #666; font-size: 13px; margin-top: 4px;">CCS Academic Research Repository</p>
                    </div>
                    <h2 style="color: #0E1F43; font-size: 18px; text-align: center;">Two-Factor Authentication</h2>
                    <p style="color: #444; text-align: center; font-size: 14px;">Your one-time verification code is:</p>
                    <div style="
                        font-size: 40px;
                        font-weight: 700;
                        letter-spacing: 16px;
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
                    <hr style="border: none; border-top: 1px solid #E5E7F5; margin: 24px 0;" />
                    <p style="color: #aaa; font-size: 11px; text-align: center;">
                        If you didn't request this, you can safely ignore this email.
                    </p>
                </div>
            `,
        });

        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error: any) {
        console.error('Send OTP error:', error?.message || error);
        console.error('Email config — USER:', process.env.EMAIL_USER, '| PASS set:', !!process.env.EMAIL_PASS);
        res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }
};

/**
 * POST /api/auth/verify-otp
 * Validates the OTP submitted by the user.
 * Increments attempt counter on failure, deletes record on success or max attempts.
 */
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            res.status(400).json({ message: 'Email and OTP are required' });
            return;
        }

        const record = await OTP.findOne({ email: email.toLowerCase() });

        if (!record) {
            res.status(400).json({
                message: 'No OTP found for this email. Please request a new one.',
                code: 'OTP_NOT_FOUND',
            });
            return;
        }

        // Check expiry
        if (record.expiresAt < new Date()) {
            await OTP.deleteOne({ _id: record._id });
            res.status(400).json({
                message: 'OTP has expired. Please request a new one.',
                code: 'OTP_EXPIRED',
            });
            return;
        }

        // Check max attempts
        if (record.attempts >= MAX_ATTEMPTS) {
            await OTP.deleteOne({ _id: record._id });
            res.status(400).json({
                message: 'Too many failed attempts. Please request a new OTP.',
                code: 'MAX_ATTEMPTS',
            });
            return;
        }

        // Wrong OTP — increment attempt counter
        if (record.otp !== otp.trim()) {
            await OTP.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
            const remaining = MAX_ATTEMPTS - (record.attempts + 1);
            res.status(400).json({
                message: `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
                code: 'INVALID_OTP',
                attemptsRemaining: remaining,
            });
            return;
        }

        // ✅ OTP is correct — delete the record
        await OTP.deleteOne({ _id: record._id });

        res.status(200).json({ message: 'OTP verified successfully', verified: true });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'Failed to verify OTP. Please try again.' });
    }
};
