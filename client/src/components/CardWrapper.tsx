import { useEffect, useState } from "react";
import data from "../assets/data.json";
import { Card } from "./Card";
import { useLocation } from "react-router-dom";
import { RegularDataItem } from "../types";

export const CardWrapper: React.FC = () => {
  const [movies, setMovies] = useState<RegularDataItem[]>([]);
  const location = useLocation();  
  const isHomePage = location.pathname === '/';
  const isMoviesPage = location.pathname === '/movies';
  const isTvSeriesPage = location.pathname === '/tv-series';
  const isBookmarkPage = location.pathname === '/bookmark';

  useEffect(() => {
    if (isHomePage) {
      setMovies(data.filter((item : RegularDataItem) => item.isTrending === false));
    } else if (isMoviesPage) {
      setMovies(data.filter((item : RegularDataItem) => item.category === 'Movie'));
    } else if (isTvSeriesPage) {
      setMovies(data.filter((item : RegularDataItem) => item.category === 'TV Series'));
    } else if(isBookmarkPage){
      setMovies(data.filter((item : RegularDataItem) => item.isBookmarked))
    }
  }, [isHomePage, isMoviesPage, isTvSeriesPage, isBookmarkPage])
  

   

  return (
    <div className="w-full py-2 ">
      <h2 className="text-2xl md:text-3xl text-white font-outfit py-8">
        {isHomePage && ("Recommended for you")}
        {isMoviesPage && ("Movies")}
        {isTvSeriesPage && ("TV Series")}
        {isBookmarkPage && ("Bookmarks")}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3  xl:grid-cols-4 gap-x-4 gap-y-24">
        {movies.map((movie, index) => (
          <Card
            key={index}
            title={movie.title}
            year={movie.year}
            category={movie.category}
            thumbnail={movie.thumbnail.regular.large}
            rating={movie.rating}
            bookmark={movie.isBookmarked}
          />
        ))}
      </div>
    </div>
  );
};
