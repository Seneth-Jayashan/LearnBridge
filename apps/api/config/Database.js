import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI;

        if (!MONGO_URI) {
            console.error('Error: MONGO_URI is not defined in .env file');
            process.exit(1);
        }

        const conn = await mongoose.connect(MONGO_URI, {
            dbName: process.env.DB_NAME || 'LearnBridge_DB',
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
};

export default connectDB;