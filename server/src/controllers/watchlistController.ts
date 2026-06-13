import { Request, Response } from "express";
import mongoose from "mongoose";
import WatchlistItem, { IWatchlistItem } from "../models/watchlistItemModel";
import logger from "../config/logger";
import { normalizeAdd, parseRemindAt } from "../utils/watchlist";
import { scheduleReminder, cancelReminder, ReminderJobData } from "../queue/reminderQueue";

const userIdOf = (req: Request): string | null => {
  const user = req.user as { _id?: unknown } | undefined;
  return user?._id ? String(user._id) : null;
};

const userEmailOf = (req: Request): string =>
  String((req.user as { email?: string } | undefined)?.email ?? "");

// Keep the queued reminder in sync with the item's state: schedule a job for a
// planned item that has an unsent reminder time, otherwise ensure none lingers.
const syncReminder = async (item: IWatchlistItem, email: string): Promise<void> => {
  const itemId = String(item._id);
  if (item.status === "planned" && item.remindAt && !item.reminderSent && email) {
    const data: ReminderJobData = {
      itemId,
      userId: String(item.userId),
      email,
      title: item.title,
      mediaType: item.mediaType,
      titleId: item.titleId,
      posterPath: item.posterPath,
      remindAtISO: new Date(item.remindAt).toISOString(),
      remindTz: item.remindTz,
    };
    await scheduleReminder(data, new Date(item.remindAt));
  } else {
    await cancelReminder(itemId);
  }
};

// GET /api/library/watchlist — the signed-in user's items, soonest reminder first.
export const listWatchlist = async (req: Request, res: Response) => {
  const userId = userIdOf(req);
  if (!userId) return res.status(401).json({ message: "Not authenticated" });
  try {
    const items = await WatchlistItem.find({ userId })
      .sort({ remindAt: 1, createdAt: -1 })
      .lean();
    res.status(200).json({ items });
  } catch (err) {
    logger.error({ err }, "listWatchlist failed");
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/library/watchlist — add (or update) a title, optionally with a reminder.
// Upserts on (userId, mediaType, titleId) so re-adding doesn't duplicate.
export const addWatchlistItem = async (req: Request, res: Response) => {
  const userId = userIdOf(req);
  if (!userId) return res.status(401).json({ message: "Not authenticated" });

  let data;
  try {
    data = normalizeAdd(req.body);
  } catch (e) {
    return res.status(400).json({ message: (e as Error).message });
  }

  try {
    const set: Record<string, unknown> = { title: data.title, remindAt: data.remindAt };
    if (data.posterPath !== undefined) set.posterPath = data.posterPath;
    if (data.remindTz !== undefined) set.remindTz = data.remindTz;
    // (Re)setting the schedule means it hasn't been sent for this time yet.
    set.reminderSent = false;

    const item = await WatchlistItem.findOneAndUpdate(
      { userId, mediaType: data.mediaType, titleId: data.titleId },
      { $set: set, $setOnInsert: { status: "planned", createdAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (!item) return res.status(500).json({ message: "Server error" });
    await syncReminder(item, userEmailOf(req));
    res.status(200).json({ item });
  } catch (err) {
    logger.error({ err }, "addWatchlistItem failed");
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/library/watchlist/:id — change the reminder time and/or status.
export const updateWatchlistItem = async (req: Request, res: Response) => {
  const userId = userIdOf(req);
  if (!userId) return res.status(401).json({ message: "Not authenticated" });

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Item not found" });
  }

  const set: Record<string, unknown> = {};
  if ("remindAt" in req.body) {
    try {
      set.remindAt = parseRemindAt(req.body.remindAt);
    } catch {
      return res.status(400).json({ message: "Invalid remindAt" });
    }
    set.reminderSent = false;
  }
  if ("status" in req.body) {
    if (req.body.status !== "planned" && req.body.status !== "watched") {
      return res.status(400).json({ message: "status must be 'planned' or 'watched'" });
    }
    set.status = req.body.status;
  }
  if (Object.keys(set).length === 0) {
    return res.status(400).json({ message: "Nothing to update" });
  }

  try {
    const item = await WatchlistItem.findOneAndUpdate({ _id: id, userId }, { $set: set }, { new: true });
    if (!item) return res.status(404).json({ message: "Item not found" });

    await syncReminder(item, userEmailOf(req));
    res.status(200).json({ item });
  } catch (err) {
    logger.error({ err }, "updateWatchlistItem failed");
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/library/watchlist/:id — remove a title from the watchlist.
export const deleteWatchlistItem = async (req: Request, res: Response) => {
  const userId = userIdOf(req);
  if (!userId) return res.status(401).json({ message: "Not authenticated" });

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Item not found" });
  }

  try {
    const item = await WatchlistItem.findOneAndDelete({ _id: id, userId });
    if (!item) return res.status(404).json({ message: "Item not found" });

    await cancelReminder(id);
    res.status(200).json({ message: "Removed" });
  } catch (err) {
    logger.error({ err }, "deleteWatchlistItem failed");
    res.status(500).json({ message: "Server error" });
  }
};
