import pino from "pino";
import config from "./env";

// Structured (JSON) logger. Cookies / auth headers are stripped so request
// logs never leak session tokens.
const logger = pino({
    level: config.logLevel,
    redact: {
        paths: ["req.headers.cookie", "req.headers.authorization"],
        remove: true,
    },
});

export default logger;
