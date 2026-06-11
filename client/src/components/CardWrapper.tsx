import { useEffect, useState } from "react";
import { Card } from "./Card";
import { useLocation } from "react-router-dom";
import api from "../api/axios";
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

          const response = await api.get(
            `/tmdb/movie/${watchedMovieId}/recommendations`
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
          const response = await api.get("/tmdb/movies/popular");

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
          const response = await api.get("/tmdb/tv/popular");

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
            api
              .get(`/tmdb/movie/${id}`)
              .then((response) => ({
                ...response.data,
                category: "movie",
              }))
              .catch((error) => {
                console.error("Error fetching movie details:", error);
                return api
                  .get(`/tmdb/tv/${id}`)
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
