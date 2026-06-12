import express from "express";
import session from "express-session";
import RedisStore from "connect-redis";
import cors from "cors";
import pinoHttp from "pino-http";
import config from "./config/env";
import logger from "./config/logger";
import { connectDB, disconnectDB } from "./db";
import passport from "./config/passportConfig";
import redisClient from "./config/redisClient";
import { apiLimiter, authLimiter } from "./middlewares/rateLimit";
import authRoutes from "./routes/authRoutes";
import favoriteRoutes from "./routes/favoriteRoutes";
import tmdbRoutes from "./routes/tmdbRoutes";
import libraryRoutes from "./routes/libraryRoutes";
import searchHistoryRoutes from "./routes/searchHistoryRoutes";
import eventRoutes from "./routes/eventRoutes";
import insightsRoutes from "./routes/insightsRoutes";

const app = express();
const sessionStore = new RedisStore({ client: redisClient });

// In production the API sits behind a TLS-terminating proxy (e.g. Render);
// trusting it lets Express set secure cookies correctly over HTTPS.
if (config.isProd) {
    app.set("trust proxy", 1);
}

app.use(
    pinoHttp({
        logger,
        autoLogging: { ignore: (req) => req.url === "/health" },
    })
);
app.use(
    cors({
        origin: config.clientOrigins,
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true,
        optionsSuccessStatus: 204,
    })
);
app.use(express.json());
app.use(
    session({
        store: sessionStore,
        secret: config.secret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            // Cross-site (Vercel client / Render API) needs Secure + SameSite=None
            // over HTTPS in production. localhost dev is same-site, so Lax works
            // without HTTPS and Chrome won't reject the cookie.
            secure: config.isProd,
            httpOnly: true,
            sameSite: config.isProd ? "none" : "lax",
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());

// Liveness probe for load balancers / orchestrators (not rate-limited).
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/search", searchHistoryRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/tmdb", tmdbRoutes);

const start = async () => {
    await connectDB();

    const server = app.listen(config.port, () => {
        logger.info(`App listening on port : ${config.port}`);
    });

    // Close connections cleanly on container stop / Ctrl-C.
    const shutdown = async () => {
        server.close();
        await disconnectDB();
        await redisClient.quit();
        process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
};

start();
