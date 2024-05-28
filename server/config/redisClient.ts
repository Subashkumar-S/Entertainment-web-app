import redis from "redis";
const url = process.env.REDIS_URL   
const redisClient = redis.createClient({
    url: url,
})

export default redisClient;