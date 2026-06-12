import { Request, Response } from "express";
import Event, { EventType } from "../models/eventModel";
import logger from "../config/logger";

const TYPES = new Set<EventType>(["view", "search", "bookmark"]);

const userIdOf = (req: Request): string | null => {
    const user = req.user as { _id?: unknown } | undefined;
    return user?._id ? String(user._id) : null;
};

// Ingest a single interaction. Fire-and-forget from the client: it always
// returns quickly and never surfaces an error to the UI, since analytics must
// not break the product. Validates the type and trims/caps the free-text fields.
export const recordEvent = async (req: Request, res: Response) => {
    const userId = userIdOf(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const type = req.body?.type;
    if (!TYPES.has(type)) return res.status(400).json({ message: "Invalid event type" });

    try {
        await Event.create({
            userId,
            type,
            mediaType: req.body.mediaType === "tv" || req.body.mediaType === "movie" ? req.body.mediaType : undefined,
            titleId: req.body.titleId != null ? String(req.body.titleId) : undefined,
            title: typeof req.body.title === "string" ? req.body.title.slice(0, 200) : undefined,
            genres: Array.isArray(req.body.genres)
                ? req.body.genres.filter((g: unknown) => typeof g === "string").slice(0, 10)
                : undefined,
            query: typeof req.body.query === "string" ? req.body.query.trim().slice(0, 100) : undefined,
        });
        res.status(202).end();
    } catch (err) {
        logger.error({ err }, "recordEvent failed");
        res.status(202).end();
    }
};
