import { Router } from "express";
import passport from "../config/passportConfig";
import config from "../config/env";
import { signup, login, logout, me, authProviders } from "../controllers/authController";
import { checkAuthenticated, checkNotAuthenticated } from "../middlewares/authMiddleware";

const router = Router();

router.get("/me", me);
router.get("/config", authProviders);
router.post("/signup", checkNotAuthenticated, signup);
router.post("/login", checkNotAuthenticated, login);
router.post("/logout", checkAuthenticated, logout);

// Google OAuth — only wired up when credentials are configured. The browser is
// redirected to Google, then back to the callback, which establishes the session
// and redirects to the client app.
if (config.google.enabled) {
    const clientOrigin = config.clientOrigins[0] || "http://localhost:5173";

    router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

    router.get(
        "/google/callback",
        passport.authenticate("google", { failureRedirect: `${clientOrigin}/login?error=google` }),
        (_req, res) => res.redirect(clientOrigin + "/")
    );
}

export default router;
