export interface RegularDataItem {
  id: string;
  original_name?: string;
  original_title?: string;
  first_air_date?: string;
  release_date?: string;
  backdrop_path?: string;
  poster_path?: string;
  vote_average: number;
  category: string;
  media_type: 'movie' | 'tv'; 
}
