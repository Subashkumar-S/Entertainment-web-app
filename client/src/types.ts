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
