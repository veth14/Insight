import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/database';
import { initializeFirebase } from './config/firebase';
import authRoutes from './routes/auth.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 3000;

/**
 * Middleware
 */
app.use(helmet()); // Security headers
app.use(morgan('dev')); // Request logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// CORS configuration
// For development, allow all origins or specifically your mobile dev setup
app.use(cors({
    origin: true, // Reflects the request origin
    credentials: true,
}));

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
// TODO: Add more routes
// app.use('/api/studies', studyRoutes);
// app.use('/api/bookmarks', bookmarkRoutes);
// app.use('/api/reading-history', readingHistoryRoutes);
// app.use('/api/analytics', analyticsRoutes);

/**
 * Error Handlers
 */
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Start Server
 */
const startServer = async () => {
    try {
        // Initialize Firebase Admin
        initializeFirebase();

        // Connect to MongoDB
        await connectDB();

        // Start listening
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌍 CORS enabled`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    process.exit(0);
});

// Start the server
startServer();

export default app;
