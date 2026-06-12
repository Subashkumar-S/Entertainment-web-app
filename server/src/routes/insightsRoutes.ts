import { Router } from "express";
import { checkAuthenticated } from "../middlewares/authMiddleware";
import { getInsights } from "../controllers/insightsController";

const router = Router();

router.get("/", checkAuthenticated, getInsights);

export default router;
