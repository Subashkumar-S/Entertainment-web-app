import { Request, Response } from "express";
import User from "../models/userModel";
import logger from "../config/logger";

// Watchlist ----------------------------------------------------------------

export const addToWatchlist = async (req: Request, res: Response) => {
    try {
        const { email, id } = req.body;
        const user = await User.findOneAndUpdate({ email }, { $addToSet: { watchlist: id } });
        if (!user) return res.status(404).send("User not found");
        res.status(200).send("Added to watchlist");
    } catch (err) {
        logger.error({ err }, "addToWatchlist failed");
        res.status(500).send("Server error");
    }
};

export const removeFromWatchlist = async (req: Request, res: Response) => {
    try {
        const { email, id } = req.body;
        const user = await User.findOneAndUpdate({ email }, { $pull: { watchlist: id } });
        if (!user) return res.status(404).send("User not found");
        res.status(200).send("Removed from watchlist");
    } catch (err) {
        logger.error({ err }, "removeFromWatchlist failed");
        res.status(500).send("Server error");
    }
};

// Watched ------------------------------------------------------------------

export const toggleWatched = async (req: Request, res: Response) => {
    try {
        const { email, id } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).send("User not found");

        const isWatched = user.watchedMovies.includes(id);
        await User.updateOne(
            { email },
            isWatched ? { $pull: { watchedMovies: id } } : { $addToSet: { watchedMovies: id } }
        );
        res.status(200).json({ id, watched: !isWatched });
    } catch (err) {
        logger.error({ err }, "toggleWatched failed");
        res.status(500).send("Server error");
    }
};

// Ratings (1–5) ------------------------------------------------------------

export const setRating = async (req: Request, res: Response) => {
    try {
        const { email, id } = req.body;
        const value = Number(req.body.value);
        if (!Number.isInteger(value) || value < 1 || value > 5) {
            return res.status(400).send("Rating must be an integer from 1 to 5");
        }

        // Update an existing rating in place, otherwise append a new one.
        const updated = await User.updateOne(
            { email, "ratings.id": id },
            { $set: { "ratings.$.value": value } }
        );
        if (updated.matchedCount === 0) {
            const user = await User.findOneAndUpdate({ email }, { $push: { ratings: { id, value } } });
            if (!user) return res.status(404).send("User not found");
        }
        res.status(200).json({ id, value });
    } catch (err) {
        logger.error({ err }, "setRating failed");
        res.status(500).send("Server error");
    }
};

export const removeRating = async (req: Request, res: Response) => {
    try {
        const { email, id } = req.body;
        const user = await User.findOneAndUpdate({ email }, { $pull: { ratings: { id } } });
        if (!user) return res.status(404).send("User not found");
        res.status(200).send("Rating removed");
    } catch (err) {
        logger.error({ err }, "removeRating failed");
        res.status(500).send("Server error");
    }
};
