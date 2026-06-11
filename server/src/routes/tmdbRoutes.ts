import { Router } from "express";
import {
    trending,
    popularMovies,
    popularTv,
    search,
    movie,
    tv,
    movieRecommendations,
    tvRecommendations,
    recommended,
} from "../controllers/tmdbController";

const router = Router();

router.get("/trending", trending);
router.get("/recommended", recommended);
router.get("/movies/popular", popularMovies);
router.get("/tv/popular", popularTv);
router.get("/search", search);
// More specific routes first so they aren't shadowed by /movie/:id and /tv/:id.
router.get("/movie/:id/recommendations", movieRecommendations);
router.get("/movie/:id", movie);
router.get("/tv/:id/recommendations", tvRecommendations);
router.get("/tv/:id", tv);

export default router;
