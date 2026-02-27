import { Request, Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../types';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

/**
 * Register new user
 * Called after Firebase account creation to store user in database
 */
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const { uid, email, displayName, role, yearLevel, studentNumber, phoneNumber, program } = req.body;
        // If a file was uploaded via multipart/form-data, multer will attach it to req.file
        const uploadedFile = (req as any).file;
        let registrationFormUrl: string | null = null;
        console.log(`[register] file received: ${uploadedFile ? uploadedFile.originalname + ' (' + uploadedFile.size + ' bytes)' : 'none'}, content-type: ${req.headers['content-type']?.substring(0, 60)}`);

        if (uploadedFile) {
            // Process in-memory buffer through sharp (no temp disk file needed)
            const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');
            const finalDir = path.join(uploadsRoot, 'registrationForms');
            if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true });

            const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
            const finalPath = path.join(finalDir, filename);

            try {
                await sharp(uploadedFile.buffer)
                    .rotate()                                         // auto-orient from EXIF
                    .resize({ width: 1200, withoutEnlargement: true }) // cap width at 1200px
                    .jpeg({ quality: 80 })                            // clear JPEG output
                    .toFile(finalPath);

                const host = req.protocol + '://' + req.get('host');
                registrationFormUrl = `${host}/uploads/registrationForms/${filename}`;
            } catch (procErr) {
                console.error('Image processing failed, saving raw buffer instead:', procErr);
                // fallback: write raw buffer as-is
                try {
                    fs.writeFileSync(finalPath, uploadedFile.buffer);
                    const host = req.protocol + '://' + req.get('host');
                    registrationFormUrl = `${host}/uploads/registrationForms/${filename}`;
                } catch (writeErr) {
                    console.error('Fallback write also failed:', writeErr);
                }
            }
        } else if (req.body.registrationFormUrl) {
            registrationFormUrl = req.body.registrationFormUrl;
        }

        // Verify the authenticated user matches the user being registered
        if (authReq.user?.uid !== uid) {
            res.status(403).json({ message: 'Forbidden: UID mismatch' });
            return;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ uid });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        // Create new user
        const user = new User({
            uid,
            email,
            studentNumber,
            displayName,
            phoneNumber,
            role,
            yearLevel,
            program,
            registrationFormUrl: registrationFormUrl ?? null,
        });

        await user.save();

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                uid: user.uid,
                email: user.email,
                studentNumber: user.studentNumber,
                displayName: user.displayName,
                phoneNumber: user.phoneNumber,
                program: user.program,
                role: user.role,
                yearLevel: user.yearLevel,
                registrationStatus: user.registrationStatus,
            },
        });
    } catch (error: any) {
        console.error('Registration error:', error?.message ?? error);
        res.status(500).json({ message: 'Failed to register user', detail: error?.message });
    }
};

/**
 * Get current user profile
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;

        const user = await User.findOne({ uid: authReq.user?.uid });

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Stamp last active time without running full document validation
        await User.updateOne({ uid: authReq.user?.uid }, { $set: { lastActiveAt: new Date() } });

        res.json({
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                phoneNumber: user.phoneNumber,
                studentNumber: user.studentNumber,
                program: user.program,
                role: user.role,
                yearLevel: user.yearLevel,
                registrationStatus: user.registrationStatus,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                status: (user as any).status ?? 'active',
                lastActiveAt: (user as any).lastActiveAt ?? null,
            },
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Failed to get user' });
    }
};

/**
 * Update current user profile
 * Only displayName and phoneNumber are allowed to change
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const { displayName, phoneNumber } = req.body;

        const user = await User.findOne({ uid: authReq.user?.uid });

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (displayName !== undefined) user.displayName = displayName.trim();
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber.trim();

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                phoneNumber: user.phoneNumber,
                studentNumber: user.studentNumber,
                program: user.program,
                role: user.role,
                yearLevel: user.yearLevel,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
};
