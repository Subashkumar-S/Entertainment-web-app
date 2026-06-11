import IORedis from "ioredis";
import config from "./env";
import logger from "./logger";

const redisClient = new IORedis(config.redisUrl);

redisClient.on("connect", () => {
    logger.info("Connected to Redis");
});

redisClient.on("error", (err) => {
    logger.error({ err }, "Redis error");
});

export default redisClient;
