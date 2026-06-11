import { Request, Response } from "express";
import axios from "axios";
import { cached } from "../utils/cache";
import * as tmdb from "../services/tmdbService";
import { normalizeTitle, pickTrailer } from "../utils/normalizeTitle";
import logger from "../config/logger";

const HOUR = 3600;
const DAY = 86400;

// TMDB/axios errors carry a huge circular object; log only what's useful.
const describeError = (err: unknown) => {
    if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const tmdbMessage = (err.response?.data as { status_message?: string })?.status_message;
        const hint =
            status === 401
                ? "TMDB rejected the API key — check TMDB_API_KEY in your env."
                : undefined;
        return { status, tmdbMessage, code: err.code, hint };
    }
    return { message: err instanceof Error ? err.message : String(err) };
};

// Shared cache-aside + error handling for every proxied TMDB resource.
const proxy = async (
    res: Response,
    key: string,
    ttl: number,
    fetchFn: () => Promise<unknown>
) => {
    try {
        const data = await cached(key, ttl, fetchFn);
        res.status(200).json(data);
    } catch (err) {
        logger.error({ ...describeError(err), key }, "TMDB proxy request failed");
        res.status(502).json({ message: "Failed to fetch from TMDB" });
    }
};

export const trending = (_req: Request, res: Response) =>
    proxy(res, "tmdb:trending:all:week", HOUR, () => tmdb.getTrending());

export const popularMovies = (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    return proxy(res, `tmdb:movies:popular:p${page}`, HOUR, () => tmdb.getPopularMovies(page));
};

export const popularTv = (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    return proxy(res, `tmdb:tv:popular:p${page}`, HOUR, () => tmdb.getPopularTv(page));
};

export const search = (req: Request, res: Response) => {
    const query = ((req.query.query as string) || "").trim();
    const page = Number(req.query.page) || 1;
    if (!query) {
        return res.status(400).json({ message: "query is required" });
    }
    return proxy(res, `tmdb:search:${query.toLowerCase()}:p${page}`, 10 * 60, () =>
        tmdb.searchMulti(query, page)
    );
};

export const movie = (req: Request, res: Response) =>
    proxy(res, `tmdb:movie:${req.params.id}`, DAY, () => tmdb.getMovie(req.params.id));

export const tv = (req: Request, res: Response) =>
    proxy(res, `tmdb:tv:${req.params.id}`, DAY, () => tmdb.getTv(req.params.id));

export const movieRecommendations = (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    return proxy(res, `tmdb:movie:${req.params.id}:recs:p${page}`, 6 * HOUR, () =>
        tmdb.getMovieRecommendations(req.params.id, page)
    );
};

export const tvRecommendations = (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    return proxy(res, `tmdb:tv:${req.params.id}:recs:p${page}`, 6 * HOUR, () =>
        tmdb.getTvRecommendations(req.params.id, page)
    );
};

export const recommended = (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    return proxy(res, `tmdb:recommended:p${page}`, HOUR, () => tmdb.getRecommendedFeed(page));
};

export const titleDetails = (req: Request, res: Response) => {
    const { mediaType, id } = req.params;
    if (mediaType !== "movie" && mediaType !== "tv") {
        return res.status(400).json({ message: "mediaType must be 'movie' or 'tv'" });
    }
    return proxy(res, `tmdb:title:${mediaType}:${id}`, DAY, async () =>
        normalizeTitle(mediaType, await tmdb.getTitleDetails(mediaType, id))
    );
};

// Lightweight endpoint so a "Play" button can fetch just the trailer key
// without pulling the whole details payload.
export const titleVideos = (req: Request, res: Response) => {
    const { mediaType, id } = req.params;
    if (mediaType !== "movie" && mediaType !== "tv") {
        return res.status(400).json({ message: "mediaType must be 'movie' or 'tv'" });
    }
    return proxy(res, `tmdb:videos:${mediaType}:${id}`, DAY, async () => {
        const data = await tmdb.getVideos(mediaType, id);
        return { trailerKey: pickTrailer(data.results ?? []) };
    });
};
