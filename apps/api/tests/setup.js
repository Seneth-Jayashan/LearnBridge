import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export const connectDBForTesting = async () => {
    // Prevent creating a new server if one already exists
    if (mongoServer) return;
    
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Disconnect any existing connections before connecting
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    
    await mongoose.connect(uri);
};

export const disconnectDBForTesting = async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
};

export const clearDBForTesting = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
};