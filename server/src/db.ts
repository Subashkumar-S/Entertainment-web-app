import mongoose from "mongoose";
import config from "./config/env";
import logger from "./config/logger";

const connectDB = async () => {
    try {
        if (!config.mongoUri) {
            throw new Error("MONGODB_URI is not defined");
        }
        await mongoose.connect(config.mongoUri, {
            connectTimeoutMS: 60000,
        });
        logger.info("MongoDB connected.");
    } catch (err) {
        logger.error({ err }, "Error connecting to MongoDB");
        process.exit(1);
    }
};

const disconnectDB = async () => {
    try {
        await mongoose.disconnect();
        logger.info("MongoDB disconnected.");
    } catch (err) {
        logger.error({ err }, "Error disconnecting from MongoDB");
        process.exit(1);
    }
};

export { connectDB, disconnectDB };
