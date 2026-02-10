import { Request, Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../types';

/**
 * Register new user
 * Called after Firebase account creation to store user in database
 */
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthRequest;
        const { uid, email, displayName, role, yearLevel } = req.body;

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
            displayName,
            role,
            yearLevel,
        });

        await user.save();

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                yearLevel: user.yearLevel,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Failed to register user' });
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

        res.json({
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                yearLevel: user.yearLevel,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Failed to get user' });
    }
};
