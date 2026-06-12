import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User, { IUser } from "../models/userModel";
import bcrypt from "bcrypt";
import config from "./env";
import logger from "./logger";

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    console.log('Authenticating user called: ' + email);
    try {
        const user = await User.findOne({ email });

        if (!user) {
            console.log('User not found:', email);
            return done(null, false, { message: "Email not found" });
        }

        if (!user.password) {
            // Account was created via Google OAuth and has no local password.
            return done(null, false, { message: "This account uses Google sign-in" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            console.log('Incorrect password for user:', email);
            return done(null, false, { message: "Incorrect password" });
        }

        console.log('User authenticated:', email);
        // Hand Passport the full user document; serializeUser persists its _id.
        return done(null, user as IUser);
    } catch (err) {
        console.error('Error finding user:', err);
        return done(err);
    }
}));

// Google OAuth strategy — registered only when credentials are configured.
if (config.google.enabled) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: config.google.clientId,
                clientSecret: config.google.clientSecret,
                callbackURL: config.google.callbackUrl,
            },
            async (_accessToken, _refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;
                    const googleId = profile.id;

                    // 1) returning Google user, 2) link to an existing email
                    // account, 3) create a new passwordless account.
                    let user = await User.findOne({ googleId });
                    if (!user && email) {
                        user = await User.findOne({ email });
                        if (user) {
                            user.googleId = googleId;
                            await user.save();
                        }
                    }
                    if (!user) {
                        user = await User.create({
                            fullName: profile.displayName || email || "Google User",
                            email,
                            googleId,
                            provider: "google",
                        });
                    }
                    return done(null, user as IUser);
                } catch (err) {
                    logger.error({ err }, "Google OAuth verify failed");
                    return done(err as Error);
                }
            }
        )
    );
    logger.info("Google OAuth strategy enabled");
}

passport.serializeUser((user: any, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await User.findById(id);

        if (!user) {
            return done(null, false);
        }

        return done(null, user as IUser); // Explicitly cast to IUser
    } catch (err) {
        done(err, null);
    }
});

export default passport;
