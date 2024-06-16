import IORedis from "ioredis";
import dotenv from 'dotenv';

dotenv.config();  
const redisClient =new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

export default redisClient;