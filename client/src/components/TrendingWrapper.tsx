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
        const response = await axios.get(`https://api.themoviedb.org/3/trending/movie/week`, {
          params: {
            api_key: "5c0e86122f0d1ef418aefff0baafc6dd"
          },
        });

        const movies = response.data.results.map((movie: any) => ({
          id: movie.id,
          title: movie.title,
          release_date: movie.release_date,
          media_type: movie.media_type,
          poster_path: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
          vote_average: movie.vote_average,
          isBookmarked: false, 
        }));

        setTrendingMovies(movies);
        console.log(trendingMovies)
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
