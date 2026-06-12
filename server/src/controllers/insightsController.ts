import { Request, Response } from "express";
import mongoose from "mongoose";
import Event from "../models/eventModel";
import logger from "../config/logger";
import { fillDailySeries, summarize, DailyActivityRow } from "../utils/insights";

const ACTIVITY_DAYS = 14;

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
        const [summaryAgg, topGenresAgg, activityAgg, recentAgg] = await Promise.all([
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
        });
    } catch (err) {
        logger.error({ err }, "getInsights failed");
        res.status(500).json({ message: "Failed to load insights" });
    }
};
