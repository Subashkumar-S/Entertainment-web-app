import mongoose, { Schema, Document, Model } from "mongoose";

export type EventType = "view" | "search" | "bookmark";

// One row per user interaction. Kept in its own collection (not on the user
// document) so it stays append-only and cheap to aggregate. This is the Mongo
// analytics store; a ClickHouse table could replace it behind the same
// ingestion/aggregation API later.
export interface IEvent extends Document {
    userId: mongoose.Types.ObjectId;
    type: EventType;
    mediaType?: "movie" | "tv";
    titleId?: string;
    title?: string;
    genres?: string[];
    query?: string;
    createdAt: Date;
}

const eventSchema = new Schema<IEvent>({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["view", "search", "bookmark"], required: true },
    mediaType: { type: String, enum: ["movie", "tv"] },
    titleId: { type: String },
    title: { type: String },
    genres: { type: [String] },
    query: { type: String },
    createdAt: { type: Date, default: Date.now },
});

// Supports the per-user, by-type, time-ordered aggregations in insights.
eventSchema.index({ userId: 1, type: 1, createdAt: -1 });

const Event: Model<IEvent> = mongoose.model<IEvent>("Event", eventSchema);

export default Event;
