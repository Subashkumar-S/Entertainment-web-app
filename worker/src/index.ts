import mongoose from "mongoose";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import config from "./config";
import logger from "./logger";
import WatchlistItem from "./models/watchlistItem";
import { sendReminderEmail } from "./email";
import { ReminderJobData } from "./types";

// Must match the producer (server/src/queue/reminderQueue.ts).
const REMINDERS_QUEUE = "reminders";

const connection = new IORedis(config.redisUrl, { maxRetriesPerRequest: null });

const start = async () => {
  if (!config.resendApiKey) {
    logger.warn("RESEND_API_KEY is not set — reminder emails will fail until it is configured.");
  }

  await mongoose.connect(config.mongoUri);
  logger.info("reminder-worker connected to MongoDB");

  const worker = new Worker<ReminderJobData>(
    REMINDERS_QUEUE,
    async (job) => {
      const data = job.data;

      // Re-check current state: the item may have been watched, deleted, or
      // rescheduled since this job was queued. Skipping keeps stale jobs harmless.
      const item = await WatchlistItem.findById(data.itemId).lean();
      if (!item) {
        logger.info({ itemId: data.itemId }, "watchlist item gone — skipping reminder");
        return;
      }
      if (item.status !== "planned" || item.reminderSent) {
        logger.info({ itemId: data.itemId }, "reminder no longer due — skipping");
        return;
      }

      await sendReminderEmail(data);

      // Idempotent mark: only the first worker to flip it from false wins.
      await WatchlistItem.updateOne(
        { _id: data.itemId, reminderSent: false },
        { $set: { reminderSent: true } }
      );
      logger.info({ itemId: data.itemId, to: data.email }, "reminder email sent");
    },
    { connection }
  );

  worker.on("failed", (job, err) =>
    logger.error({ jobId: job?.id, err: err.message }, "reminder job failed")
  );
  worker.on("completed", (job) => logger.debug({ jobId: job.id }, "reminder job completed"));

  logger.info("reminder-worker listening on the 'reminders' queue");

  const shutdown = async () => {
    await worker.close();
    await connection.quit();
    await mongoose.disconnect();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

start().catch((err) => {
  logger.error({ err }, "reminder-worker failed to start");
  process.exit(1);
});
