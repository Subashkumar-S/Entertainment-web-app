import { Router } from "express";
import { checkAuthenticated } from "../middlewares/authMiddleware";
import { getInsights, getTrending } from "../controllers/insightsController";

const router = Router();

router.get("/", checkAuthenticated, getInsights);
router.get("/trending", checkAuthenticated, getTrending);

export default router;
