import mongoose, { Schema, Model } from "mongoose";

// Minimal mirror of the API's WatchlistItem. The worker only re-validates the
// item's state and flips reminderSent, so it declares just those fields;
// strict:false leaves everything else untouched. Collection name matches the
// API model's pluralization ("WatchlistItem" -> "watchlistitems").
export interface IWatchlistItemLite {
  _id: mongoose.Types.ObjectId;
  status?: "planned" | "watched";
  reminderSent?: boolean;
  remindAt?: Date | null;
}

const schema = new Schema(
  {
    status: String,
    reminderSent: Boolean,
    remindAt: Date,
  },
  { strict: false, collection: "watchlistitems" }
);

const WatchlistItem: Model<IWatchlistItemLite> =
  mongoose.model<IWatchlistItemLite>("WatchlistItem", schema);

export default WatchlistItem;
