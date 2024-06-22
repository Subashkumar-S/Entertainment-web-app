import { Request, Response } from 'express';
import User from '../models/userModel';

export const addFavorite = async (req: Request, res : Response) => {
    try {
        const { email, id } = req.body;
        console.log("Email from addFavorite",email);
        console.log("id from addFavorite",id);
        const user = await User.findOneAndUpdate(
            { email },
            { $addToSet: { favorites: id } }
        );

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.status(200).send('Added to favorites');
    } catch (error) {
        res.status(500).send('Server error');
    }
};

export const removeFavorite = async (req : Request, res : Response) => {
    try {
        const { email, id } = req.body;
        console.log("Email from removeFavorite",email);
        console.log("Email from removeFavorite",id);
        const user = await User.findOneAndUpdate(
            { email },
            { $pull: { favorites: id } }
        );

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.status(200).send('Removed from favorites');
    } catch (error) {
        res.status(500).send('Server error');
    }
};
