import { Router } from "express";
import {signup, login, logout, me} from "../controllers/authController"
import { checkAuthenticated, checkNotAuthenticated } from "../middlewares/authMiddleware";

const router = Router();

router.get("/me", me);
router.post("/signup", checkNotAuthenticated, signup);
router.post("/login", checkNotAuthenticated, login);
router.post("/logout", checkAuthenticated, logout);

export default router;
