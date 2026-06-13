// Mirrors the producer's payload in server/src/queue/reminderQueue.ts. Kept in
// sync by hand (small, stable shape); a shared package is the future upgrade.
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
