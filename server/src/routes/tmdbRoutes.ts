import { Router } from "express";
import {
    trending,
    popularMovies,
    popularTv,
    search,
    movie,
    tv,
    movieRecommendations,
} from "../controllers/tmdbController";

const router = Router();

router.get("/trending", trending);
router.get("/movies/popular", popularMovies);
router.get("/tv/popular", popularTv);
router.get("/search", search);
// More specific route first so it isn't shadowed by /movie/:id.
router.get("/movie/:id/recommendations", movieRecommendations);
router.get("/movie/:id", movie);
router.get("/tv/:id", tv);

export default router;
