import { Request, Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../types';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { supabase } from '../config/supabase';
import { sendAdminNewRegistrationEmail } from '../services/email.service';

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
            const filename = `${studentNumber.trim()}_${Date.now()}.jpg`;

            try {
                // Process in-memory buffer through sharp
                const processedBuffer = await sharp(uploadedFile.buffer)
                    .rotate()                                         // auto-orient from EXIF
                    .resize({ width: 1200, withoutEnlargement: true }) // cap width at 1200px
                    .jpeg({ quality: 80 })                            // clear JPEG output
                    .toBuffer();

                // Upload to Supabase bucket 'regForms'
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('regForms')
                    .upload(`${studentNumber.trim()}/${filename}`, processedBuffer, {
                        contentType: 'image/jpeg',
                        upsert: false
                    });

                if (uploadError) {
                    throw new Error(`Supabase upload failed: ${uploadError.message}`);
                }

                const { data } = supabase.storage
                    .from('regForms')
                    .getPublicUrl(`${studentNumber.trim()}/${filename}`);
                
                registrationFormUrl = data.publicUrl;
                console.log(`[register] File successfully uploaded to Supabase: ${registrationFormUrl}`);

            } catch (procErr: any) {
                console.error('Image processing or upload failed, failing registration:', procErr.message);
                res.status(500).json({ message: 'Failed to process and upload registration form', detail: procErr.message });
                return;
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

        // ── Fire Admin Registration Alert (Async) ──
        if (user.registrationStatus === 'pending') {
            User.find({ 
                role: 'admin', 
                'notificationPreferences.newRegistrations': true 
            }).select('email').lean()
            .then(admins => {
                const adminEmails = admins.map(a => a.email);
                if (adminEmails.length > 0) {
                    sendAdminNewRegistrationEmail(adminEmails, user.email, user.role).catch(err => console.error(err));
                }
            })
            .catch(err => console.error("Error fetching admins for notification:", err));
        }

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

        // Handle Mongo duplicate key (E11000) to provide a friendly message
        const isDupKey = error && (error.code === 11000 || /E11000/.test(error?.message || ''));
        if (isDupKey) {
            // Prefer structured keyValue if provided by mongoose
            let field = 'value';
            let value: any = undefined;
            if (error.keyValue && typeof error.keyValue === 'object') {
                field = Object.keys(error.keyValue)[0] || field;
                value = error.keyValue[field];
            } else {
                // Fallback: try to parse the message for patterns like "studentNumber: \"23-2023\""
                const m = (error.message || '').match(/dup key: \{\s*([^:\s]+)\s*:\s*\"([^\"]+)\"/);
                if (m) {
                    field = m[1];
                    value = m[2];
                } else {
                    // try index name like "studentNumber_1"
                    const idx = (error.message || '').match(/index:\s*([^\s]+)\s/);
                    if (idx) {
                        field = idx[1].replace(/_\d+$/, '') || field;
                    }
                }
            }

            const friendly = `${field} already registered`;
            res.status(400).json({ message: friendly, field, value, detail: error?.message });
            return;
        }

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
                notificationPreferences: user.notificationPreferences || { emailNotif: false, researchUpdates: false },
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
        const { displayName, phoneNumber, notificationPreferences } = req.body;

        const user = await User.findOne({ uid: authReq.user?.uid });

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (displayName !== undefined) user.displayName = displayName.trim();
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber.trim();
        if (notificationPreferences !== undefined) {
            user.notificationPreferences = {
                ...user.notificationPreferences,
                ...notificationPreferences
            };
        }

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
                notificationPreferences: user.notificationPreferences,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
};
