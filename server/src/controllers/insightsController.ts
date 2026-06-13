import { Request, Response } from "express";
import mongoose from "mongoose";
import Event from "../models/eventModel";
import WatchlistItem from "../models/watchlistItemModel";
import logger from "../config/logger";
import { cached } from "../utils/cache";
import * as tmdb from "../services/tmdbService";
import { normalizeCard } from "../utils/normalizeTitle";
import { fillDailySeries, summarize, DailyActivityRow } from "../utils/insights";

const ACTIVITY_DAYS = 14;
const HOUR = 3600;
const DAY = 86400;

// Community trending tuning.
const TREND_DAYS = 14;
const TREND_LIMIT = 12;
const MIN_COMMUNITY = 4; // below this, fall back to TMDB's global trending

const userIdOf = (req: Request): string | null => {
    const user = req.user as { _id?: unknown } | undefined;
    return user?._id ? String(user._id) : null;
};

// Per-user viewing insights, computed with MongoDB aggregation:
//   • summary   — lifetime counts of views / searches / bookmarks
//   • topGenres — most-viewed genres (from view events' genre lists)
//   • activity  — a dense daily series for the last 14 days
//   • recentTitles — the most recently viewed distinct titles
export const getInsights = async (req: Request, res: Response) => {
    const id = userIdOf(req);
    if (!id) return res.status(401).json({ message: "Not authenticated" });
    const userId = new mongoose.Types.ObjectId(id);
    const since = new Date(Date.now() - ACTIVITY_DAYS * 24 * 60 * 60 * 1000);

    try {
        const now = new Date();
        const [summaryAgg, topGenresAgg, activityAgg, recentAgg, watchlistAgg] = await Promise.all([
            Event.aggregate([
                { $match: { userId } },
                { $group: { _id: "$type", count: { $sum: 1 } } },
            ]),
            Event.aggregate([
                { $match: { userId, type: "view", genres: { $exists: true, $ne: [] } } },
                { $unwind: "$genres" },
                { $group: { _id: "$genres", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 8 },
            ]),
            Event.aggregate([
                { $match: { userId, createdAt: { $gte: since } } },
                {
                    $group: {
                        _id: {
                            day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                            type: "$type",
                        },
                        count: { $sum: 1 },
                    },
                },
            ]),
            Event.aggregate([
                { $match: { userId, type: "view", titleId: { $ne: null } } },
                { $sort: { createdAt: -1 } },
                {
                    $group: {
                        _id: "$titleId",
                        title: { $first: "$title" },
                        mediaType: { $first: "$mediaType" },
                        lastViewed: { $first: "$createdAt" },
                    },
                },
                { $sort: { lastViewed: -1 } },
                { $limit: 6 },
            ]),
            WatchlistItem.aggregate([
                { $match: { userId } },
                {
                    $group: {
                        _id: null,
                        planned: { $sum: { $cond: [{ $eq: ["$status", "planned"] }, 1, 0] } },
                        watched: { $sum: { $cond: [{ $eq: ["$status", "watched"] }, 1, 0] } },
                        upcoming: {
                            $sum: {
                                $cond: [
                                    { $and: [{ $eq: ["$status", "planned"] }, { $gte: ["$remindAt", now] }] },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]),
        ]);

        const activityRows: DailyActivityRow[] = activityAgg.map((r) => ({
            day: r._id.day,
            type: r._id.type,
            count: r.count,
        }));

        res.status(200).json({
            summary: summarize(summaryAgg),
            topGenres: topGenresAgg.map((g) => ({ genre: g._id, count: g.count })),
            activity: fillDailySeries(activityRows, ACTIVITY_DAYS),
            recentTitles: recentAgg.map((t) => ({
                titleId: t._id,
                title: t.title ?? "",
                mediaType: t.mediaType ?? "movie",
            })),
            watchlist: {
                planned: watchlistAgg[0]?.planned ?? 0,
                watched: watchlistAgg[0]?.watched ?? 0,
                upcoming: watchlistAgg[0]?.upcoming ?? 0,
            },
        });
    } catch (err) {
        logger.error({ err }, "getInsights failed");
        res.status(500).json({ message: "Failed to load insights" });
    }
};

// Map TMDB's global trending list into the same card shape as community trending.
const tmdbTrendingCards = async () => {
    const trend = (await cached("tmdb:trending:all:week", HOUR, () => tmdb.getTrending())) as {
        results?: unknown[];
    };
    return (trend.results ?? []).slice(0, TREND_LIMIT).map((item) => normalizeCard(item));
};

// "Trending" computed from real interaction events across all users (views + 2×
// bookmarks over the last 14 days), enriched with cached TMDB data into cards.
// Falls back to TMDB's global trending when there isn't enough community data —
// so a fresh database still shows a populated, good-looking row. The whole
// response is cached briefly so the per-title enrichment fan-out is rare.
export const getTrending = async (_req: Request, res: Response) => {
    try {
        const data = await cached("insights:trending", 10 * 60, async () => {
            const since = new Date(Date.now() - TREND_DAYS * 24 * 60 * 60 * 1000);
            const ranked = await Event.aggregate([
                { $match: { type: { $in: ["view", "bookmark"] }, titleId: { $ne: null }, createdAt: { $gte: since } } },
                {
                    $group: {
                        _id: { titleId: "$titleId", mediaType: "$mediaType" },
                        views: { $sum: { $cond: [{ $eq: ["$type", "view"] }, 1, 0] } },
                        bookmarks: { $sum: { $cond: [{ $eq: ["$type", "bookmark"] }, 1, 0] } },
                    },
                },
                { $addFields: { score: { $add: ["$views", { $multiply: ["$bookmarks", 2] }] } } },
                { $sort: { score: -1 } },
                { $limit: TREND_LIMIT },
            ]);

            const enriched = await Promise.all(
                ranked.map(async (r) => {
                    const mediaType = r._id.mediaType === "tv" ? "tv" : "movie";
                    const id = String(r._id.titleId);
                    try {
                        // Reuses the same per-title cache keys as the detail proxy.
                        const raw = await cached(`tmdb:${mediaType}:${id}`, DAY, () =>
                            mediaType === "movie" ? tmdb.getMovie(id) : tmdb.getTv(id)
                        );
                        return normalizeCard({ ...(raw as object), media_type: mediaType });
                    } catch {
                        return null;
                    }
                })
            );
            const community = enriched.filter((c): c is NonNullable<typeof c> => c !== null);

            return community.length >= MIN_COMMUNITY
                ? { source: "community", results: community }
                : { source: "tmdb", results: await tmdbTrendingCards() };
        });

        res.status(200).json(data);
    } catch (err) {
        logger.error({ err }, "getTrending failed");
        // Last resort so Home's Trending row still renders.
        try {
            res.status(200).json({ source: "tmdb", results: await tmdbTrendingCards() });
        } catch {
            res.status(200).json({ source: "tmdb", results: [] });
        }
    }
};
