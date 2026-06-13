import dotenv from "dotenv";
import path from "path";

// Single source of truth: the repo-root .env (two levels up from worker/src and
// worker/dist alike). Inside Docker no such file exists and Compose injects the
// vars directly, so dotenv just no-ops on the miss.
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const config = {
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  mongoUri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/entertainment",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  // Dev default is Resend's onboarding sender; set EMAIL_FROM to a verified
  // domain address for production.
  emailFrom: process.env.EMAIL_FROM ?? "Cineplan <onboarding@resend.dev>",
  // First origin in the (possibly comma-separated) CLIENT_ORIGIN list, for email links.
  clientOrigin: (process.env.CLIENT_ORIGIN ?? "http://localhost:5173").split(",")[0].trim(),
  logLevel: process.env.LOG_LEVEL ?? "info",
};

export default config;
