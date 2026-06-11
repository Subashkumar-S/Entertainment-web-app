// Collapses TMDB's large, inconsistent movie/tv detail payload (with
// append_to_response extras) into one flat, client-ready shape. Keeping this on
// the server means the client renders a single predictable object and the cached
// value is smaller than the raw TMDB response.

const IMG = "https://image.tmdb.org/t/p";
const img = (path: string | null | undefined, size: string) =>
    path ? `${IMG}/${size}${path}` : null;

export type MediaType = "movie" | "tv";

export interface NormalizedCard {
    id: string;
    mediaType: MediaType;
    title: string;
    year: string;
    rating: number;
    backdropPath: string | null;
    posterPath: string | null;
}

export interface NormalizedTitle {
    id: string;
    mediaType: MediaType;
    title: string;
    tagline: string;
    overview: string;
    year: string;
    releaseDate: string;
    runtime: number | null;
    seasons: number | null;
    episodes: number | null;
    status: string;
    genres: string[];
    rating: number;
    voteCount: number;
    certification: string;
    backdropPath: string | null;
    posterPath: string | null;
    trailerKey: string | null;
    cast: { id: string; name: string; character: string; profilePath: string | null }[];
    seasonList: { seasonNumber: number; name: string; episodeCount: number }[];
    providers: {
        link: string | null;
        flatrate: { name: string; logoPath: string | null }[];
        rent: { name: string; logoPath: string | null }[];
        buy: { name: string; logoPath: string | null }[];
    };
    recommendations: NormalizedCard[];
}

const yearOf = (date: string) => (date ? new Date(date).getFullYear().toString() : "");

const normalizeCard = (item: any): NormalizedCard => {
    const date = item.release_date || item.first_air_date || "";
    const mediaType: MediaType = item.media_type === "tv" || (!item.title && item.name) ? "tv" : "movie";
    return {
        id: String(item.id),
        mediaType,
        title: item.title || item.name || "",
        year: yearOf(date),
        rating: typeof item.vote_average === "number" ? item.vote_average : 0,
        backdropPath: img(item.backdrop_path, "w500"),
        posterPath: img(item.poster_path, "w500"),
    };
};

export const pickTrailer = (videos: any[]): string | null => {
    const yt = videos.filter((v) => v.site === "YouTube");
    const trailer =
        yt.find((v) => v.type === "Trailer" && v.official) ||
        yt.find((v) => v.type === "Trailer") ||
        yt.find((v) => v.type === "Teaser") ||
        yt[0];
    return trailer?.key ?? null;
};

const pickCertification = (mediaType: MediaType, data: any): string => {
    if (mediaType === "movie") {
        const us = (data.release_dates?.results ?? []).find((r: any) => r.iso_3166_1 === "US");
        const rated = (us?.release_dates ?? []).find((d: any) => d.certification);
        return rated?.certification ?? "";
    }
    const us = (data.content_ratings?.results ?? []).find((r: any) => r.iso_3166_1 === "US");
    return us?.rating ?? "";
};

const mapProviders = (arr: any[] | undefined) =>
    (arr ?? []).map((p) => ({ name: p.provider_name, logoPath: img(p.logo_path, "w92") }));

export const normalizeTitle = (mediaType: MediaType, data: any): NormalizedTitle => {
    const releaseDate = data.release_date || data.first_air_date || "";
    // Prefer TMDB recommendations, fall back to "similar" when empty.
    const recsRaw =
        (data.recommendations?.results?.length ? data.recommendations.results : data.similar?.results) ?? [];
    const us = data["watch/providers"]?.results?.US ?? {};

    return {
        id: String(data.id),
        mediaType,
        title: data.title || data.name || data.original_title || data.original_name || "",
        tagline: data.tagline || "",
        overview: data.overview || "",
        year: yearOf(releaseDate),
        releaseDate,
        runtime: mediaType === "movie" ? data.runtime ?? null : data.episode_run_time?.[0] ?? null,
        seasons: mediaType === "tv" ? data.number_of_seasons ?? null : null,
        episodes: mediaType === "tv" ? data.number_of_episodes ?? null : null,
        status: data.status || "",
        genres: (data.genres ?? []).map((g: any) => g.name),
        rating: typeof data.vote_average === "number" ? data.vote_average : 0,
        voteCount: data.vote_count ?? 0,
        certification: pickCertification(mediaType, data),
        backdropPath: img(data.backdrop_path, "original"),
        posterPath: img(data.poster_path, "w500"),
        trailerKey: pickTrailer(data.videos?.results ?? []),
        cast: (data.credits?.cast ?? []).slice(0, 12).map((c: any) => ({
            id: String(c.id),
            name: c.name,
            character: c.character || "",
            profilePath: img(c.profile_path, "w185"),
        })),
        seasonList:
            mediaType === "tv"
                ? (data.seasons ?? [])
                      .filter((s: any) => s.season_number > 0)
                      .map((s: any) => ({
                          seasonNumber: s.season_number,
                          name: s.name,
                          episodeCount: s.episode_count,
                      }))
                : [],
        providers: {
            link: us.link ?? null,
            flatrate: mapProviders(us.flatrate),
            rent: mapProviders(us.rent),
            buy: mapProviders(us.buy),
        },
        recommendations: recsRaw.slice(0, 12).map(normalizeCard),
    };
};
