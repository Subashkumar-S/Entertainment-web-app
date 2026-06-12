import { Router } from "express";
import { checkAuthenticated } from "../middlewares/authMiddleware";
import {
    getRecentSearches,
    recordSearch,
    clearRecentSearches,
} from "../controllers/searchHistoryController";

const router = Router();

// All per-user, so require an authenticated session.
router.get("/recent", checkAuthenticated, getRecentSearches);
router.post("/recent", checkAuthenticated, recordSearch);
router.delete("/recent", checkAuthenticated, clearRecentSearches);

export default router;
