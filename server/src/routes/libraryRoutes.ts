import { Router } from "express";
import {
    addToWatchlist,
    removeFromWatchlist,
    toggleWatched,
    setRating,
    removeRating,
} from "../controllers/libraryController";

const router = Router();

router.post("/watchlist/add", addToWatchlist);
router.post("/watchlist/remove", removeFromWatchlist);
router.post("/watched/toggle", toggleWatched);
router.post("/rating", setRating);
router.post("/rating/remove", removeRating);

export default router;
