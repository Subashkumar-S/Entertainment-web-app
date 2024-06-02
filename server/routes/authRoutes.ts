import { Router } from "express";
import {signup, login, logout} from "../controllers/authController"
import { checkAuthenticated, checkNotAuthenticated } from "../middlewares/authMiddleware";

const router = Router();

router.post("/signup", checkNotAuthenticated, signup);
router.post("/login", checkNotAuthenticated, login);
router.post("/logout", checkAuthenticated, logout);

export default router;
