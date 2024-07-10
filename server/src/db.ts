import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoURI = process.env.MONGODB_URI;

const connectDB = async () => {
    try {
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined');
        }
        await mongoose.connect(mongoURI, {
            connectTimeoutMS: 60000, 
        });        
        console.log("MongoDB connected.");
    } catch (err) {
        console.error("Error connecting to MongoDB: " + err);
        process.exit(1);
    }
}; 

const disconnectDB = async () => {
    try {
        await mongoose.disconnect();
        console.log("MongoDB disconnected.");
    } catch (err) {
        console.error("Error disconnecting from MongoDB:", err);
        process.exit(1);
    }
};

export  { connectDB, disconnectDB};
