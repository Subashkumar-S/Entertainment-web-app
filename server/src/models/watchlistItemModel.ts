import mongoose, { Schema, Document, Model, Types } from "mongoose";

// A single watchlist entry. Replaces the bare id strings that used to live in
// User.watchlist so each title can carry a status and an optional scheduled
// reminder. The reminder schedule itself lives in the BullMQ "reminders" queue
// (Redis); `reminderSent` is the DB-side guard against a duplicate send.
export interface IWatchlistItem extends Document {
  userId: Types.ObjectId;
  mediaType: "movie" | "tv";
  titleId: string;
  title: string;
  posterPath?: string;
  status: "planned" | "watched";
  remindAt?: Date | null;
  remindTz?: string;
  reminderSent: boolean;
  createdAt: Date;
}

const watchlistItemSchema: Schema<IWatchlistItem> = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  mediaType: { type: String, enum: ["movie", "tv"], required: true },
  titleId: { type: String, required: true },
  title: { type: String, required: true },
  posterPath: { type: String },
  status: { type: String, enum: ["planned", "watched"], default: "planned" },
  // Stored in UTC; remindTz keeps the user's IANA zone so the email can render
  // the time they actually chose.
  remindAt: { type: Date, default: null },
  remindTz: { type: String },
  reminderSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// One row per user+title.
watchlistItemSchema.index({ userId: 1, mediaType: 1, titleId: 1 }, { unique: true });
// Listing the watchlist / filtering by status.
watchlistItemSchema.index({ userId: 1, status: 1 });
// Backstop/admin scans only — the queue, not a DB poll, drives delivery.
watchlistItemSchema.index({ remindAt: 1 });

const WatchlistItem: Model<IWatchlistItem> =
  mongoose.model<IWatchlistItem>("WatchlistItem", watchlistItemSchema);

export default WatchlistItem;
