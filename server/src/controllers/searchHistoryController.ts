import { Request, Response } from "express";
import redisClient from "../config/redisClient";
import logger from "../config/logger";
import { mergeRecent } from "../utils/recentSearches";

// Per-user recent searches, kept in Redis (most-recent first). Small, ephemeral,
// and user-scoped — exactly what Redis is good at, and it keeps this out of the
// MongoDB user document.

const MAX = 8;
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

const keyFor = (userId: string) => `search:recent:${userId}`;

const userIdOf = (req: Request): string | null => {
    const user = req.user as { _id?: unknown } | undefined;
    return user?._id ? String(user._id) : null;
};

export const getRecentSearches = async (req: Request, res: Response) => {
    const userId = userIdOf(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
        const searches = await redisClient.lrange(keyFor(userId), 0, -1);
        res.status(200).json({ searches });
    } catch (err) {
        logger.error({ err }, "getRecentSearches failed");
        // Degrade gracefully — recent searches are a nicety, not critical.
        res.status(200).json({ searches: [] });
    }
};

export const recordSearch = async (req: Request, res: Response) => {
    const userId = userIdOf(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const query = typeof req.body?.query === "string" ? req.body.query.trim() : "";
    if (query.length < 2) return res.status(204).end();

    try {
        const key = keyFor(userId);
        const existing = await redisClient.lrange(key, 0, -1);
        const next = mergeRecent(existing, query, MAX);
        const pipeline = redisClient.multi();
        pipeline.del(key);
        pipeline.rpush(key, ...next);
        pipeline.expire(key, TTL_SECONDS);
        await pipeline.exec();
        res.status(200).json({ searches: next });
    } catch (err) {
        logger.error({ err }, "recordSearch failed");
        res.status(204).end();
    }
};

export const clearRecentSearches = async (req: Request, res: Response) => {
    const userId = userIdOf(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
        await redisClient.del(keyFor(userId));
    } catch (err) {
        logger.error({ err }, "clearRecentSearches failed");
    }
    res.status(204).end();
};
