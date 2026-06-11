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

export const getMovieRecommendations = async (id: string, page = 1) => {
    const { data } = await tmdb.get(`/movie/${id}/recommendations`, { params: { page } });
    return data;
};
