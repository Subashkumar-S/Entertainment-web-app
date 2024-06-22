import IORedis from "ioredis";
import dotenv from 'dotenv';

dotenv.config();
const redisClient = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
    console.error('Redis error: ', err);
});

export default redisClient;
