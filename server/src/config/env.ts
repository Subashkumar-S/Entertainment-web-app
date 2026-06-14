import dotenv from "dotenv";
import path from "path";

// Single source of truth: the repo-root .env (three levels up from both
// server/src/config and server/dist/config). Inside Docker no such file exists
// and Compose injects the vars directly, so dotenv just no-ops on the miss.
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// That root .env is CINEPLAN_-prefixed so it never clashes with the sibling
// projects on a shared host. Alias each CINEPLAN_FOO to the plain FOO the app
// reads. Blanks are skipped so the code defaults below still apply, and an
// existing FOO (e.g. injected by Compose in Docker) is never overwritten.
for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("CINEPLAN_") && value && !process.env[key.slice(9)]) {
        process.env[key.slice(9)] = value;
    }
}

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

const port = Number(process.env.PORT) || 5000;

// Public origin of the app. Behind Caddy in production the client and /api are
// same-origin, so this single knob (APP_URL) drives the CORS allowlist and the
// Google callback. Leave unset for local dev — the localhost defaults below apply.
// appUrl = public base; apiBase = where /api lives (appUrl in prod, localhost:PORT
// in dev). Empty strings (e.g. blank Compose defaults) are treated as unset.
const appUrl = process.env.APP_URL?.replace(/\/+$/, "") || undefined;
const apiBase = appUrl ?? `http://localhost:${port}`;

// CLIENT_ORIGIN may be a single origin or a comma-separated allowlist (CORS); it
// falls back to APP_URL, then the localhost dev origins.
const clientOrigins = (process.env.CLIENT_ORIGIN || appUrl || "http://localhost:5173,http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

// Google OAuth is optional: the strategy and routes only activate when both
// client id and secret are provided, so the app runs fine without them.
const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";

const config = {
    isProd,
    port,
    secret: process.env.SECRET ?? "dev-insecure-secret",
    clientOrigins,
    mongoUri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/cineplan",
    redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
    tmdb: {
        apiKey: tmdbApiKey,
        baseUrl: process.env.TMDB_BASE_URL ?? "https://api.themoviedb.org/3",
    },
    google: {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        enabled: Boolean(googleClientId && googleClientSecret),
        // Must exactly match an Authorized redirect URI in the Google console.
        callbackUrl:
            process.env.GOOGLE_CALLBACK_URL || `${apiBase}/api/auth/google/callback`,
    },
    logLevel: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
};

export default config;
