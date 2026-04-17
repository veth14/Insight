import { Request, Response } from 'express';
import RegisterOTP from '../models/RegisterOTP';
import User from '../models/User';
import { sendEmailWithFallback } from '../services/email.service';

const MAX_ATTEMPTS = 5;
const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;

const generateOTP = (): string =>
    Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit

/**
 * POST /api/auth/send-register-otp
 * Sends a 6-digit OTP to the email for registration verification.
 * Public — no auth middleware.
 */
export const sendRegisterOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, studentNumber } = req.body;

        if (!email) {
            res.status(400).json({ message: 'Email is required.' });
            return;
        }

        if (!studentNumber) {
            res.status(400).json({ message: 'Student number is required.' });
            return;
        }

        // Validate student number format (XX-XXXX)
        const studentNoRegex = /^\d{2}-\d{4}$/;
        if (!studentNoRegex.test(String(studentNumber).trim())) {
            res.status(400).json({ message: 'Invalid student number format. Expected XX-XXXX.' });
            return;
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedStudentNumber = String(studentNumber).trim();

        // Check for existing user by email or student number to avoid sending OTP unnecessarily
        const dupQuery: any = { $or: [{ email: normalizedEmail }, { studentNumber: normalizedStudentNumber }] };

        const existing = await User.findOne(dupQuery).lean();
        if (existing) {
            if (existing.email === normalizedEmail) {
                res.status(400).json({ message: 'Email already registered', field: 'email' });
                return;
            }
            if (existing.studentNumber === normalizedStudentNumber) {
                res.status(400).json({ message: 'Student number already registered', field: 'studentNumber' });
                return;
            }
            // Generic duplicate fallback
            res.status(400).json({ message: 'User already registered' });
            return;
        }

        // Check cooldown
        const existingOTP = await RegisterOTP.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });
        if (existingOTP) {
            const timeSinceLast = (Date.now() - existingOTP.createdAt.getTime()) / 1000;
            if (timeSinceLast < RESEND_COOLDOWN_SECONDS) {
                const waitTime = Math.ceil(RESEND_COOLDOWN_SECONDS - timeSinceLast);
                res.status(429).json({ message: `Please wait ${waitTime} seconds before requesting a new OTP.` });
                return;
            }
        }

        // Generate OTP
        const otpCode = generateOTP();
        
        await RegisterOTP.deleteMany({ email: normalizedEmail });

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

        await RegisterOTP.create({
            email: normalizedEmail,
            otp: otpCode,
            expiresAt,
            attempts: 0,
            isVerified: false,
        });

        // Send Email
        await sendEmailWithFallback({
            to: normalizedEmail,
            subject: 'Insight Registration Verification Code',
            fromName: 'Insight Support',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2>Registration Verification</h2>
                    <p>Use the following 6-digit code to verify your email and complete your registration:</p>
                    <h1 style="font-size: 32px; letter-spacing: 2px; color: #4A90E2;">${otpCode}</h1>
                    <p>This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
                    <p>If you did not request this, please ignore this email.</p>
                </div>
            `,
        });

        res.status(200).json({ message: 'A verification code has been sent to your email.' });
    } catch (error) {
        console.error('sendRegisterOTP error:', error);
        res.status(500).json({ message: 'Failed to send OTP.' });
    }
};

/**
 * POST /api/auth/verify-register-otp
 * Verifies the 6-digit OTP. 
 */
export const verifyRegisterOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            res.status(400).json({ message: 'Email and OTP are required.' });
            return;
        }

        const normalizedEmail = email.toLowerCase().trim();

        const record = await RegisterOTP.findOne({ email: normalizedEmail, isVerified: false });

        if (!record) {
            res.status(400).json({ message: 'No pending OTP found. Please request a new one.' });
            return;
        }

        if (record.expiresAt < new Date()) {
            await RegisterOTP.deleteOne({ _id: record._id });
            res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
            return;
        }

        if (record.attempts >= MAX_ATTEMPTS) {
            await RegisterOTP.deleteOne({ _id: record._id });
            res.status(400).json({ message: 'Too many failed attempts. Please request a new OTP.' });
            return;
        }

        if (record.otp !== otp) {
            record.attempts += 1;
            await record.save();
            res.status(400).json({ message: 'Invalid OTP code.' });
            return;
        }

        // Mark verified
        record.isVerified = true;
        await record.save();

        res.status(200).json({ message: 'Email verified successfully.' });
    } catch (error) {
        console.error('verifyRegisterOTP error:', error);
        res.status(500).json({ message: 'Failed to verify OTP.' });
    }
};
