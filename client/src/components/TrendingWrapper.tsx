import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { TrendingCard } from "./TrendingCard";
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { RegularDataItem } from '../types';

export const TrendingWrapper: React.FC = () => {
  const [trendingMovies, setTrendingMovies] = useState<RegularDataItem[]>([]);
  const bookmarkedMovies = useSelector((state: RootState) => state.user.favorites);

  useEffect(() => {
    const fetchTrendingMovies = async () => {
      try {
        const response = await axios.get(`https://api.themoviedb.org/3/trending/all/week`, {
          params: {
            api_key: import.meta.env.VITE_APP_API_KEY
          },
        });

        const movies: RegularDataItem[] = response.data.results.map((item : RegularDataItem) => {
          const thumbnail = item.backdrop_path
            ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
            : item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : ''; 

          return {
            id: item.id.toString(),
            original_name: item.original_name || '',
            original_title: item.original_title || '',
            first_air_date: item.first_air_date || '',
            release_date: item.release_date || '',
            backdrop_path: item.backdrop_path || '',
            poster_path: thumbnail,
            vote_average: typeof item.vote_average === 'number' ? item.vote_average : 0,
            category: item.media_type === 'movie' ? 'Movie' : 'TV Series',
          };
        });

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
            id={movie.id}
            title={movie.original_name || movie.original_title || ""}
            year={
              (movie.first_air_date && new Date(movie.first_air_date).getFullYear().toString()) ||
              (movie.release_date && new Date(movie.release_date).getFullYear().toString()) ||
              ""
            }
            category={movie.category}
            thumbnail={movie.poster_path || ""}
            rating={movie.vote_average}
            bookmark={bookmarkedMovies.includes(movie.id)}
          />
        ))}
      </div>
    </div>
  );
};
