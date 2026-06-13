import { Queue } from "bullmq";
import IORedis from "ioredis";
import config from "../config/env";
import logger from "../config/logger";

// The queue the API produces to and the reminder-worker consumes from. The
// schedule (delay) lives in Redis, so reminders survive an API/worker restart.
export const REMINDERS_QUEUE = "reminders";

// BullMQ requires a connection with maxRetriesPerRequest: null. Kept separate
// from the session/cache Redis clients so queue traffic is isolated.
const connection = new IORedis(config.redisUrl, { maxRetriesPerRequest: null });

const queue = new Queue(REMINDERS_QUEUE, { connection });

export interface ReminderJobData {
  itemId: string;
  userId: string;
  email: string;
  title: string;
  mediaType: "movie" | "tv";
  titleId: string;
  posterPath?: string;
  remindAtISO: string;
  remindTz?: string;
}

// Deterministic per-item id so re-scheduling replaces rather than duplicates.
const jobIdFor = (itemId: string) => `reminder:${itemId}`;

// Remove any pending job for an item (on cancel / delete / mark-watched, and
// before a reschedule — BullMQ ignores add() for an existing jobId, so the old
// job must go first for a new delay to take effect).
export const cancelReminder = async (itemId: string): Promise<void> => {
  try {
    const job = await queue.getJob(jobIdFor(itemId));
    if (job) await job.remove();
  } catch (err) {
    logger.error({ err, itemId }, "cancelReminder failed");
  }
};

// Schedule (or reschedule) the email reminder for an item at remindAt.
export const scheduleReminder = async (data: ReminderJobData, remindAt: Date): Promise<void> => {
  try {
    await cancelReminder(data.itemId);
    const delay = Math.max(0, remindAt.getTime() - Date.now());
    await queue.add("send", data, {
      jobId: jobIdFor(data.itemId),
      delay,
      attempts: 3,
      backoff: { type: "exponential", delay: 60_000 },
      removeOnComplete: true,
      removeOnFail: 50,
    });
    logger.info({ itemId: data.itemId, delayMs: delay }, "reminder scheduled");
  } catch (err) {
    logger.error({ err, itemId: data.itemId }, "scheduleReminder failed");
  }
};

export const closeReminderQueue = async (): Promise<void> => {
  await queue.close();
  await connection.quit();
};
