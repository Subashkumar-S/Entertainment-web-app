export interface RegularDataItem {
  id: string;
  // TMDB returns `title` for movies and `name` for tv; the `original_*` variants
  // are non-localized and only used as a fallback.
  title?: string;
  name?: string;
  original_name?: string;
  original_title?: string;
  first_air_date?: string;
  release_date?: string;
  backdrop_path?: string;
  poster_path?: string;
  vote_average: number;
  category?: string;
  media_type?: 'movie' | 'tv';
}

export type MediaType = 'movie' | 'tv';

export interface CastMember {
  id: string;
  name: string;
  character: string;
  profilePath: string | null;
}

export interface Provider {
  name: string;
  logoPath: string | null;
}

export interface RecommendationItem {
  id: string;
  mediaType: MediaType;
  title: string;
  year: string;
  rating: number;
  backdropPath: string | null;
  posterPath: string | null;
}

export interface Genre {
  id: number;
  name: string;
}

export interface SeasonSummary {
  seasonNumber: number;
  name: string;
  episodeCount: number;
}

// Matches the server's normalized /tmdb/title/:mediaType/:id payload.
export interface TitleDetailsData {
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
  cast: CastMember[];
  seasonList: SeasonSummary[];
  providers: {
    link: string | null;
    flatrate: Provider[];
    rent: Provider[];
    buy: Provider[];
  };
  recommendations: RecommendationItem[];
}
