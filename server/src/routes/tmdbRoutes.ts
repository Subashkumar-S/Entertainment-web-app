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
    titleDetails,
    titleVideos,
    genres,
    discoverTitles,
    tvSeason,
} from "../controllers/tmdbController";

const router = Router();

router.get("/trending", trending);
router.get("/recommended", recommended);
router.get("/movies/popular", popularMovies);
router.get("/tv/popular", popularTv);
router.get("/genres/:mediaType", genres);
router.get("/discover/:mediaType", discoverTitles);
router.get("/search", search);
router.get("/title/:mediaType/:id/videos", titleVideos);
router.get("/title/:mediaType/:id", titleDetails);
// More specific routes first so they aren't shadowed by /movie/:id and /tv/:id.
router.get("/movie/:id/recommendations", movieRecommendations);
router.get("/movie/:id", movie);
router.get("/tv/:id/recommendations", tvRecommendations);
router.get("/tv/:id/season/:season", tvSeason);
router.get("/tv/:id", tv);

export default router;
