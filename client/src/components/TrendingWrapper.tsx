import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { TrendingCard } from "./TrendingCard";

interface Movie {
  id: number;
  title: string;
  release_date: string;
  media_type: string;
  poster_path: string;
  vote_average: number;
  isBookmarked: boolean;
}

export const TrendingWrapper: React.FC = () => {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);

  useEffect(() => {
    const fetchTrendingMovies = async () => {
      try {
        const response = await axios.get(`https://api.themoviedb.org/3/trending/all/week`, {
          params: {
            api_key: import.meta.env.VITE_APP_API_KEY
          },
        });
        console.log(response);
        const movies = response.data.results.map((item: any) => ({
          id: item.id,
          title: item.original_name || item.original_title,
          release_date: item.first_air_date || item.release_date,
          media_type: item.media_type,
          poster_path: `https://image.tmdb.org/t/p/w500${item.backdrop_path}`,
          vote_average: item.vote_average,
          isBookmarked: false, 
        }));

        setTrendingMovies(movies);
        
      } catch (error) {
        console.error('Failed to fetch trending movies', error);
      }
    };

    fetchTrendingMovies();
  }, []);

  return (
    <div className="min-h-60 md:min-h-[40vh] overflow-x-scroll font-outfit">
      <h4 className="text-2xl md:text-3xl text-white pb-6">Trending</h4>
      <div className="flex gap-10 w-fit">
        {trendingMovies.map(movie => (
          <TrendingCard
            key={movie.id}
            title={movie.title}
            year={new Date(movie.release_date).getFullYear()}
            category={movie.media_type}
            thumbnail={movie.poster_path}
            rating={movie.vote_average}
            bookmark={movie.isBookmarked}
          />
        ))}
      </div>
    </div>
  );
};
