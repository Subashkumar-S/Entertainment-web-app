import { Router } from "express";
import { checkAuthenticated } from "../middlewares/authMiddleware";
import { recordEvent } from "../controllers/eventController";

const router = Router();

// Single ingestion endpoint for all interaction events (view, search, bookmark).
router.post("/", checkAuthenticated, recordEvent);

export default router;
