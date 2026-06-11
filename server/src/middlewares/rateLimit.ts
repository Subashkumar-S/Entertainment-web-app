import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient from "../config/redisClient";

// Redis-backed store so limits are shared across multiple API instances.
const store = (prefix: string) =>
    new RedisStore({
        sendCommand: (...args: string[]): Promise<any> =>
            redisClient.call(args[0], ...args.slice(1)),
        prefix,
    });

// General per-IP limit across the whole API.
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: store("rl:api:"),
});

// Tighter limit on auth endpoints to slow credential stuffing / brute force.
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: store("rl:auth:"),
});
