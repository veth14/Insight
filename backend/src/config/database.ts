import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
    try {
        const uri = process.env.MONGODB_URI;

        if (!uri) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        await mongoose.connect(uri, {
            family: 4,
        });

        console.log('✅ MongoDB connected successfully');

        // Handle connection events
        mongoose.connection.on('error', (error) => {
            console.error('MongoDB connection error:', error);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected');
        });

    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        console.error('⚠️  SSL ERROR: Your IP address is likely not whitelisted in MongoDB Atlas.');
        console.error('👉 ACTION: Go to MongoDB Atlas > Network Access > Add IP Address > "Add Current IP Address".');
        process.exit(1);
    }
};

export const closeDB = async (): Promise<void> => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
    }
};
