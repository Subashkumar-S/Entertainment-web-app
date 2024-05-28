import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoURI = process.env.MONGODB_URI;

const connectDB = async () => {
    try {
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined');
        }
        await mongoose.connect(mongoURI);
        console.log("MongoDB connected.");
    } catch (err) {
        console.error("Error connecting to MongoDB: " + err);
        process.exit(1);
    }
}; 

export default connectDB;
