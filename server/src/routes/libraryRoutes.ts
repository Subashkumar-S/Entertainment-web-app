import { Router } from "express";
import {
    addToWatchlist,
    removeFromWatchlist,
    toggleWatched,
    setRating,
    removeRating,
} from "../controllers/libraryController";
import {
    listWatchlist,
    addWatchlistItem,
    updateWatchlistItem,
    deleteWatchlistItem,
} from "../controllers/watchlistController";
import { checkAuthenticated } from "../middlewares/authMiddleware";

const router = Router();

// New session-secured watchlist API — items carry status + an optional reminder.
router.get("/watchlist", checkAuthenticated, listWatchlist);
router.post("/watchlist", checkAuthenticated, addWatchlistItem);
router.patch("/watchlist/:id", checkAuthenticated, updateWatchlistItem);
router.delete("/watchlist/:id", checkAuthenticated, deleteWatchlistItem);

// Legacy endpoints (User.watchlist array) — kept working until the client moves
// fully to the new API; see WATCH-REMINDERS-PLAN.md.
router.post("/watchlist/add", addToWatchlist);
router.post("/watchlist/remove", removeFromWatchlist);
router.post("/watched/toggle", toggleWatched);
router.post("/rating", setRating);
router.post("/rating/remove", removeRating);

export default router;
