import { Router } from 'express';
import multer from 'multer';
import { register, getMe, updateProfile } from '../controllers/auth.controller';
import { sendOTP, verifyOTP } from '../controllers/otp.controller';
import { sendResetOTP, verifyResetOTP, resetPassword } from '../controllers/reset.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Multer setup: memory storage so no temp directory is needed.
// sharp will process the in-memory buffer and write the final file.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

/**
 * @route   POST /api/auth/register
 * @desc    Register new user in database (after Firebase registration)
 * @access  Private (requires Firebase token)
 */
router.post('/register', authenticate, upload.single('registrationForm'), register);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, getMe);

/**
 * @route   PUT /api/auth/me
 * @desc    Update current user profile (displayName, phoneNumber only)
 * @access  Private
 */
router.put('/me', authenticate, updateProfile);

/**
 * @route   POST /api/auth/send-otp
 * @desc    Generate and email a 4-digit OTP for two-factor authentication
 * @access  Private (requires Firebase token)
 */
router.post('/send-otp', authenticate, sendOTP);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify the OTP submitted by the user
 * @access  Private (requires Firebase token)
 */
router.post('/verify-otp', authenticate, verifyOTP);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send a 6-digit reset OTP to the user's email
 * @access  Public
 */
router.post('/forgot-password', sendResetOTP);

/**
 * @route   POST /api/auth/verify-reset-otp
 * @desc    Verify the 6-digit reset OTP; returns a one-time resetToken
 * @access  Public
 */
router.post('/verify-reset-otp', verifyResetOTP);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset Firebase password using a valid resetToken
 * @access  Public
 */
router.post('/reset-password', resetPassword);

export default router;
