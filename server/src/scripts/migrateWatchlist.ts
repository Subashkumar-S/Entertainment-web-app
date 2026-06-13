// One-off backfill: turn the legacy User.watchlist[] / watchedMovies[] id arrays
// into WatchlistItem documents. The old arrays stored only TMDB ids (no media
// type or title), so each id is resolved against TMDB (movie first, tv fallback).
// Safe to re-run — upserts on (userId, mediaType, titleId).
//
//   cd server && npm run migrate:watchlist
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../db";
import User from "../models/userModel";
import WatchlistItem from "../models/watchlistItemModel";
import { getMovie, getTv } from "../services/tmdbService";

type Resolved = { mediaType: "movie" | "tv"; title: string; posterPath?: string };

const resolveTitle = async (id: string): Promise<Resolved | null> => {
  try {
    const m = await getMovie(id);
    if (m?.id) {
      return { mediaType: "movie", title: m.title || m.original_title || `Movie ${id}`, posterPath: m.poster_path || undefined };
    }
  } catch {
    /* not a movie — try tv */
  }
  try {
    const t = await getTv(id);
    if (t?.id) {
      return { mediaType: "tv", title: t.name || t.original_name || `Show ${id}`, posterPath: t.poster_path || undefined };
    }
  } catch {
    /* unresolved */
  }
  return null;
};

const upsert = async (
  userId: mongoose.Types.ObjectId,
  id: string,
  status: "planned" | "watched"
): Promise<boolean> => {
  const resolved = await resolveTitle(id);
  if (!resolved) return false;
  await WatchlistItem.findOneAndUpdate(
    { userId, mediaType: resolved.mediaType, titleId: id },
    {
      $set: { title: resolved.title, posterPath: resolved.posterPath, status },
      $setOnInsert: { createdAt: new Date(), reminderSent: false },
    },
    { upsert: true, setDefaultsOnInsert: true }
  );
  return true;
};

const main = async () => {
  await connectDB();
  const users = await User.find({}, { watchlist: 1, watchedMovies: 1 }).lean();

  let upserted = 0;
  let skipped = 0;
  for (const u of users) {
    const userId = u._id as mongoose.Types.ObjectId;
    // watchlist first (planned), then watched — so a title in both ends up "watched".
    for (const id of u.watchlist ?? []) (await upsert(userId, id, "planned")) ? upserted++ : skipped++;
    for (const id of u.watchedMovies ?? []) (await upsert(userId, id, "watched")) ? upserted++ : skipped++;
  }

  console.log(`Watchlist migration complete. Upserted: ${upserted}, skipped (unresolved): ${skipped}`);
  await disconnectDB();
};

main().catch(async (err) => {
  console.error("Watchlist migration failed:", err);
  await disconnectDB();
  process.exit(1);
});
