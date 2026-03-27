import { Request, Response } from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import RegisterOTP from '../models/RegisterOTP';

const MAX_ATTEMPTS = 5;
const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;

const createTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('[Register OTP Controller] ERROR: EMAIL_USER or EMAIL_PASS missing!');
        return null;
    }
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        family: 4, // Force IPv4 to prevent ENETUNREACH errors on Railway
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

const generateOTP = (): string =>
    Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit

/**
 * POST /api/auth/send-register-otp
 * Sends a 6-digit OTP to the email for registration verification.
 * Public — no auth middleware.
 */
export const sendRegisterOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ message: 'Email is required.' });
            return;
        }

        const normalizedEmail = email.toLowerCase().trim();

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
        const hashParams = crypto.createHash('sha256').update(otpCode).digest('hex'); // We can store raw or hashed. Given existing pattern, we'll store raw code for simplicity or hashed if needed for higher security.
        // Let's store plain OTP for now like the other file does for easy checking.
        
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
        const transporter = createTransporter();
        if (!transporter) {
            res.status(500).json({ message: 'Email service misconfigured on server.' });
            return;
        }

        const mailOptions = {
            from: `"Insight Support" <${process.env.EMAIL_USER}>`,
            to: normalizedEmail,
            subject: 'Insight Registration Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2>Registration Verification</h2>
                    <p>Use the following 6-digit code to verify your email and complete your registration:</p>
                    <h1 style="font-size: 32px; letter-spacing: 2px; color: #4A90E2;">${otpCode}</h1>
                    <p>This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
                    <p>If you did not request this, please ignore this email.</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);

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
