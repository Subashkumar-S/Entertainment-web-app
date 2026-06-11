import dotenv from "dotenv";
import path from "path";

// Single source of truth: the repo-root .env (three levels up from both
// server/src/config and server/dist/config). Inside Docker no such file exists
// and Compose injects the vars directly, so dotenv just no-ops on the miss.
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const isProd = process.env.NODE_ENV === "production";

// The .env.example ships placeholders; treat them as "not set" so a copied-
// but-unedited template doesn't silently look configured.
const PLACEHOLDERS = new Set(["your-tmdb-v3-api-key", "replace-with-a-long-random-string"]);
const isUnset = (value: string | undefined) => !value || PLACEHOLDERS.has(value);

const tmdbApiKey = process.env.TMDB_API_KEY ?? "";

// Fail fast in production for required secrets rather than running with
// guessable or missing values.
if (isProd) {
    for (const key of ["SECRET", "TMDB_API_KEY"] as const) {
        if (isUnset(process.env[key])) {
            throw new Error(`${key} environment variable is required in production (and must not be the placeholder)`);
        }
    }
} else if (isUnset(tmdbApiKey)) {
    // Dev: warn loudly instead of crashing — auth/library still work without TMDB.
    console.warn(
        "\n⚠️  TMDB_API_KEY is missing or still the placeholder in your .env.\n" +
            "    /api/tmdb/* routes will return 502 until you set a real TMDB v3 key.\n" +
            "    Get one at https://www.themoviedb.org/settings/api\n"
    );
}

// CLIENT_ORIGIN may be a single origin or a comma-separated allowlist (CORS).
const clientOrigins = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173,http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const config = {
    isProd,
    port: Number(process.env.PORT) || 5000,
    secret: process.env.SECRET ?? "dev-insecure-secret",
    clientOrigins,
    mongoUri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/entertainment",
    redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
    tmdb: {
        apiKey: tmdbApiKey,
        baseUrl: process.env.TMDB_BASE_URL ?? "https://api.themoviedb.org/3",
    },
    logLevel: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
};

export default config;
