import {TrendingCard} from "./TrendingCard";
import data from "../assets/data.json";




export const TrendingWrapper: React.FC = () => {

  const trendingMovies = data.filter(item => item.isTrending);


  return (
    <div className="min-h-60 md:min-h-[35vh] overflow-x-scroll font-outfit">
      <h4 className="text-2xl md:text-3xl text-white pb-6">Trending</h4>
      <div className="flex gap-10 w-fit">
        {trendingMovies.map((movie, index) => (
          <TrendingCard 
            key = {index}
            title = {movie.title}
            year = {movie.year}
            category = {movie.category}
            thumbnail = {movie.thumbnail.trending?.large}
            rating = {movie.rating}
            bookmark = {movie.isBookmarked}
          />
        ))}
      </div>
    </div>
  );
}
