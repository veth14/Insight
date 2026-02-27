import './config/env'; // ⚠️ Must be first — loads .env before any other module
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { connectDB } from './config/database';
import { initializeFirebase } from './config/firebase';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import studiesRoutes from './routes/studies.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 3000;

/**
 * Middleware
 */
app.use(helmet()); // Security headers
app.use(morgan('dev')); // Request logging
app.use(express.json({ limit: '5mb' })); // Parse JSON bodies
app.use(express.urlencoded({ limit: '5mb', extended: true })); // Parse URL-encoded bodies

// CORS configuration
// For development, allow all origins or specifically your mobile dev setup
app.use(cors({
    origin: true, // Reflects the request origin
    credentials: true,
}));

// Ensure uploads directory exists and serve it as static
const uploadsDir = path.join(__dirname, '..', 'uploads');
const regFormsDir = path.join(uploadsDir, 'registrationForms');
const tmpDir = path.join(uploadsDir, 'tmp');
if (!fs.existsSync(regFormsDir)) {
    fs.mkdirSync(regFormsDir, { recursive: true });
}
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

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
app.use('/api/admin', adminRoutes);
app.use('/api/studies', studiesRoutes);

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
