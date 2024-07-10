import express from 'express';
import { addFavorite, removeFavorite } from '../controllers/favoriteController';
// import { checkAuthenticated } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/addFavorite', addFavorite);
router.post('/removeFavorite', removeFavorite);

export default router;
