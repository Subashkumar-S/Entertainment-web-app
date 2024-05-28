import { Request, Response, NextFunction } from "express";
import User from "../models/userModel";
import connectDB from "../db";
import bcrypt from "bcrypt";
import passport from "passport";

export const signup = async (req: Request, res: Response) => {
    try {
        await connectDB();

        let user = await User.findOne({ email: req.body.email });

        if (user) {
            return res.status(400).send("User already exists. Please login");
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        console.log("Password hashed successfully");

        const newUser = new User({
            fullName: req.body.fullName,
            email: req.body.email,
            password: hashedPassword
        });

        await newUser.save();
        console.log("User saved successfully");

        return res.status(201).json({ message: "User registered successfully" });

    } catch (err) {
        console.error("Error during signup:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {

    await connectDB();
    console.log("Login route called");
    passport.authenticate('local', (err: Error | null, user: any, info: any) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(400).json({ message: info.message });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.status(200).json({ message: "Login successful" });
        });
    })(req, res, next);
};
