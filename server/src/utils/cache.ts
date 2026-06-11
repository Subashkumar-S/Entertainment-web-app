import redisClient from "../config/redisClient";
import logger from "../config/logger";

// Cache-aside helper: serve from Redis when present, otherwise run fetchFn,
// store the result with a TTL, and return it. Redis failures degrade
// gracefully to a live fetch instead of erroring the request.
export async function cached<T>(
    key: string,
    ttlSeconds: number,
    fetchFn: () => Promise<T>
): Promise<T> {
    try {
        const hit = await redisClient.get(key);
        if (hit) {
            logger.debug({ cache: "hit", key });
            return JSON.parse(hit) as T;
        }
    } catch (err) {
        logger.error({ err, key }, "cache read failed");
    }

    logger.debug({ cache: "miss", key });
    const data = await fetchFn();

    try {
        await redisClient.set(key, JSON.stringify(data), "EX", ttlSeconds);
    } catch (err) {
        logger.error({ err, key }, "cache write failed");
    }

    return data;
}
