import { Request, Response, NextFunction } from "express";
import User from "../models/userModel";
import bcrypt from "bcrypt";
import passport from "passport";
import config from "../config/env";

// Lets the client know which optional auth providers are available, so it can
// conditionally render e.g. the "Continue with Google" button.
export const authProviders = (_req: Request, res: Response) => {
    res.status(200).json({ google: config.google.enabled });
};

export const signup = async (req: Request, res: Response) => {
    try {
        console.log("Signup route called");

        let user = await User.findOne({ email: req.body.email });

        if (user) {
            return res.status(400).send({message: "User already exists. Please login"});
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        console.log("Password hashed successfully");

        const newUser = new User({
            fullName: req.body.fullName,
            email: req.body.email,
            password: hashedPassword
        });

        const savedUser = await newUser.save();
        console.log("User saved successfully");

        const {password , ...userWithoutPassword} = savedUser.toObject();
        return res.status(201).send({ message: "User registered successfully", user: userWithoutPassword });

    } catch (err) {
        console.error("Error during signup:", err);
        return res.status(500).send({ message: "Server error" });
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    console.log("Login route called");

    passport.authenticate('local', (err: Error | null, user: any, info: any) => {
        if (err) {
            console.error('Passport authentication error:', err);
            return next(err);
        }
        if (!user) {
            console.log('Authentication failed:', info.message);
            return res.status(400).json({ message: info.message });
        }
        req.logIn(user, (err) => {
            if (err) {
                console.error('Error during login:', err);
                return next(err);
            }

            console.log('User logged in:', user.email);
            const { password, ...safeUser } = user.toObject();
            return res.status(200).json({ message: "Login successful", user: safeUser });
        });
    })(req, res, next);
};


// Lets the client rehydrate its auth state from the session cookie on load,
// so a page refresh doesn't lose the logged-in user (and loop back to /login).
export const me = async (req: Request, res: Response) => {
    // Session state must never be cached/revalidated — otherwise the browser
    // serves a 304 with an empty body and the client can't rehydrate the user.
    res.set("Cache-Control", "no-store");
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    const { password, ...safeUser } = (req.user as any).toObject
        ? (req.user as any).toObject()
        : (req.user as any);
    return res.status(200).json({ user: safeUser });
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
        req.logout((err) => {
            if (err) {
                console.error('Error during logout:', err);
                return next(err);
            }
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                    return next(err);
                }
                res.clearCookie('connect.sid');
                console.log('User logged out');
                res.status(200).json({ message: "Logged out successfully" });
            });
        });
    } else {
        res.status(400).json({ message: "User is not logged in" });
    }
};
