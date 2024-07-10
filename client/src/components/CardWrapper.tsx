import { useEffect, useState } from "react";
import { Card } from "./Card";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { RegularDataItem } from "../types";

export const CardWrapper: React.FC = () => {
  const [movies, setMovies] = useState<RegularDataItem[]>([]);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isMoviesPage = location.pathname === "/movies";
  const isTvSeriesPage = location.pathname === "/tv-series";
  const isBookmarkPage = location.pathname === "/bookmark";

  const favorites = useSelector((state: RootState) => state.user.favorites);
  const bookmarkedItems = useSelector((state: RootState) => state.user.favorites);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isHomePage && favorites.length > 0) {
          const watchedMovieId = parseInt(favorites[0]);

          const response = await axios.get(
            `https://api.themoviedb.org/3/movie/${watchedMovieId}/recommendations`,
            {
              params: {
                api_key: import.meta.env.VITE_APP_API_KEY,
                language: "en-US",
                page: 1,
              },
            }
          );

          if (response.data && response.data.results) {
            setMovies(
              response.data.results.map((movie: RegularDataItem) => ({
                ...movie,
                category: "movie",
              }))
            );
          } else {
            console.error("Unexpected recommended movies API response structure:", response);
          }
        } else if (isMoviesPage) {
          const response = await axios.get("https://api.themoviedb.org/3/movie/popular", {
            params: {
              api_key: import.meta.env.VITE_APP_API_KEY,
              language: "en-US",
              page: 1,
            },
          });

          if (response.data && response.data.results) {
            setMovies(
              response.data.results.map((movie: RegularDataItem) => ({
                ...movie,
                category: "movie",
              }))
            );
          } else {
            console.error("Unexpected Movies API response structure:", response);
          }
        } else if (isTvSeriesPage) {
          const response = await axios.get("https://api.themoviedb.org/3/tv/popular", {
            params: {
              api_key: import.meta.env.VITE_APP_API_KEY,
              language: "en-US",
              page: 1,
            },
          });

          if (response.data && response.data.results) {
            setMovies(
              response.data.results.map((tvSeries: RegularDataItem) => ({
                ...tvSeries,
                category: "tv",
              }))
            );
          } else {
            console.error("Unexpected TV Series API response structure:", response);
          }
        } else if (isBookmarkPage && bookmarkedItems.length > 0) {
          const movieDetailsPromises = bookmarkedItems.map((id) =>
            axios
              .get(`https://api.themoviedb.org/3/movie/${id}`, {
                params: {
                  api_key: import.meta.env.VITE_APP_API_KEY,
                  language: "en-US",
                },
              })
              .then((response) => ({
                ...response.data,
                category: "movie",
              }))
              .catch((error) => {
                console.error("Error fetching movie details:", error);
                return axios
                  .get(`https://api.themoviedb.org/3/tv/${id}`, {
                    params: {
                      api_key: import.meta.env.VITE_APP_API_KEY,
                      language: "en-US",
                    },
                  })
                  .then((response) => ({
                    ...response.data,
                    category: "tv",
                  }))
                  .catch((error) => {
                    console.error("Error fetching TV series details:", error);
                    return null; // Handle if necessary
                  });
              })
          );

          const movieDetailsResponses = await Promise.all(movieDetailsPromises);
          setMovies(movieDetailsResponses.filter((item) => item !== null) as RegularDataItem[]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [isHomePage, isMoviesPage, isTvSeriesPage, isBookmarkPage, favorites, bookmarkedItems]);

  return (
    <div className="w-full py-2">
      <h2 className="text-2xl md:text-3xl text-white font-outfit py-8">
        {isHomePage && "Recommended for you"}
        {isMoviesPage && "Movies"}
        {isTvSeriesPage && "TV Series"}
        {isBookmarkPage && "Bookmarks"}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-24">
        {movies.map((movie) => (
          <Card
            key={movie.id.toString()}
            id={movie.id.toString()}
            title={movie.original_name || movie.original_title || ""}
            year={
              (movie.first_air_date && new Date(movie.first_air_date).getFullYear().toString()) ||
              (movie.release_date && new Date(movie.release_date).getFullYear().toString()) ||
              ""
            }
            category={movie.category || ""}
            thumbnail={`https://image.tmdb.org/t/p/w500${
              movie.backdrop_path || movie.poster_path || ""
            }`}
            rating={movie.vote_average ? movie.vote_average.toFixed(1).toString() : ""}
            bookmark={bookmarkedItems.includes(movie.id.toString())}
          />
        ))}
      </div>
    </div>
  );
};
