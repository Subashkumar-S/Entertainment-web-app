import { Request, Response, NextFunction } from "express";
import User from "../models/userModel";
import { connectDB, disconnectDB} from "../db";
import bcrypt from "bcrypt";
import passport from "passport";

export const signup = async (req: Request, res: Response) => {
    try {
        console.log("Signup route called");
        await connectDB();

        let user = await User.findOne({ email: req.body.email });

        if (user) {
            await disconnectDB();
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

        await disconnectDB();

        const {password , ...userWithoutPassword} = savedUser.toObject();
        return res.status(201).send({ message: "User registered successfully", user: userWithoutPassword });

    } catch (err) {
        console.error("Error during signup:", err);
        await disconnectDB();
        return res.status(500).send({ message: "Server error" });
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    console.log("Login route called");
    await connectDB();
    
    passport.authenticate('local', (err: Error | null, user: any, info: any) => {
        if (err) {
            console.error('Passport authentication error:', err);
            disconnectDB();
            return next(err);
        }
        if (!user) {
            console.log('Authentication failed:', info.message);
            disconnectDB();
            return res.status(400).json({ message: info.message });
        }
        req.logIn(user, (err) => {
            if (err) {
                console.error('Error during login:', err);
                disconnectDB();
                return next(err);
            }

            console.log('User logged in:', user.email);
            disconnectDB();
            return res.status(200).json({ message: "Login successful", user });
        });
    })(req, res, next);
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