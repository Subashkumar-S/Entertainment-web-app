import dotenv from "dotenv";
import path from "path";

// Single source of truth: the repo-root .env (two levels up from worker/src and
// worker/dist alike). Inside Docker no such file exists and Compose injects the
// vars directly, so dotenv just no-ops on the miss.
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// That root .env is CINEPLAN_-prefixed; alias each CINEPLAN_FOO to the plain FOO
// this worker reads (blanks skipped, existing vars never overwritten). In Docker
// Compose injects the unprefixed names directly, so this just no-ops.
for (const [key, value] of Object.entries(process.env)) {
  if (key.startsWith("CINEPLAN_") && value && !process.env[key.slice(9)]) {
    process.env[key.slice(9)] = value;
  }
}

// Email deep-links are built from the public origin: CLIENT_ORIGIN wins, then
// APP_URL (the single prod knob), then the localhost dev default. Empty strings
// (e.g. blank Compose defaults) fall through.
const appUrl = process.env.APP_URL?.replace(/\/+$/, "") || undefined;
const clientOrigin = (process.env.CLIENT_ORIGIN || appUrl || "http://localhost:5173")
  .split(",")[0]
  .trim();

const config = {
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  mongoUri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/cineplan",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  // Dev default is Resend's onboarding sender; set EMAIL_FROM to a verified
  // domain address for production.
  emailFrom: process.env.EMAIL_FROM ?? "Cineplan <onboarding@resend.dev>",
  // First origin in the (possibly comma-separated) CLIENT_ORIGIN list, for email links.
  clientOrigin,
  logLevel: process.env.LOG_LEVEL ?? "info",
};

export default config;
