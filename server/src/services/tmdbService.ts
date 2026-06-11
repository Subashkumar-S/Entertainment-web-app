import axios from "axios";
import config from "../config/env";

// One axios client for TMDB with the server-side v3 API key applied to every
// request, so the key never reaches the browser.
const tmdb = axios.create({
    baseURL: config.tmdb.baseUrl,
    params: {
        api_key: config.tmdb.apiKey,
        language: "en-US",
    },
    timeout: 10000,
});

export const getTrending = async () => {
    const { data } = await tmdb.get("/trending/all/week");
    return data;
};

export const getPopularMovies = async (page = 1) => {
    const { data } = await tmdb.get("/movie/popular", { params: { page } });
    return data;
};

export const getPopularTv = async (page = 1) => {
    const { data } = await tmdb.get("/tv/popular", { params: { page } });
    return data;
};

export const searchMulti = async (query: string, page = 1) => {
    const { data } = await tmdb.get("/search/multi", { params: { query, page } });
    return data;
};

export const getMovie = async (id: string) => {
    const { data } = await tmdb.get(`/movie/${id}`);
    return data;
};

export const getTv = async (id: string) => {
    const { data } = await tmdb.get(`/tv/${id}`);
    return data;
};

export const getVideos = async (mediaType: "movie" | "tv", id: string) => {
    const { data } = await tmdb.get(`/${mediaType}/${id}/videos`);
    return data;
};

// Full detail payload for the details page: one request that also pulls credits,
// videos, images, recommendations/similar, watch providers, and certification.
export const getTitleDetails = async (mediaType: "movie" | "tv", id: string) => {
    const base = "credits,videos,images,recommendations,similar,watch/providers";
    const append = mediaType === "movie" ? `${base},release_dates` : `${base},content_ratings`;
    const { data } = await tmdb.get(`/${mediaType}/${id}`, {
        params: { append_to_response: append, include_image_language: "en,null" },
    });
    return data;
};

export const getMovieRecommendations = async (id: string, page = 1) => {
    const { data } = await tmdb.get(`/movie/${id}/recommendations`, { params: { page } });
    return data;
};

export const getTvRecommendations = async (id: string, page = 1) => {
    const { data } = await tmdb.get(`/tv/${id}/recommendations`, { params: { page } });
    return data;
};

// Blended "popular movies + popular TV" feed for the home "Recommended for you"
// row, so it's populated even when the user has no bookmarks to personalize from.
export const getRecommendedFeed = async (page = 1) => {
    const [movies, tv] = await Promise.all([
        tmdb.get("/movie/popular", { params: { page } }),
        tmdb.get("/tv/popular", { params: { page } }),
    ]);

    const movieResults = (movies.data.results as Record<string, unknown>[]).map((m) => ({
        ...m,
        media_type: "movie",
    }));
    const tvResults = (tv.data.results as Record<string, unknown>[]).map((t) => ({
        ...t,
        media_type: "tv",
    }));

    // Interleave so the row mixes movies and series instead of grouping them.
    const results: Record<string, unknown>[] = [];
    const max = Math.max(movieResults.length, tvResults.length);
    for (let i = 0; i < max; i++) {
        if (movieResults[i]) results.push(movieResults[i]);
        if (tvResults[i]) results.push(tvResults[i]);
    }

    return { page, results };
};
