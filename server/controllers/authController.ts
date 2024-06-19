import { Request, Response, NextFunction } from "express";
import User from "../models/userModel";
import connectDB from "../db";
import bcrypt from "bcrypt";
import passport from "passport";

export const signup = async (req: Request, res: Response) => {
    try {
        console.log("Signup route called");
        await connectDB();

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
    await connectDB();
    
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
            return res.status(200).json({ message: "Login successful", user });
        });
    })(req, res, next);
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
        if(err) res.status(500).json({message: "Error logging out"});
        res.json({ message: "Logged out successfully"})
    })
}
