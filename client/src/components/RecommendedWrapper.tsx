import data from "../assets/data.json";
import { Card } from "./Card";

export const RecommendedWrapper: React.FC = () => {
  const recommendedMovies = data.filter((item) => item.isTrending === false);

  return (
    <div className="w-full py-2">
      <h2 className="text-3xl text-white font-outfit py-8">Recommended for you</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-y-24">
        {recommendedMovies.map((movie, index) => (
          <Card
            key={index}
            title={movie.title}
            year={movie.year}
            category={movie.category}
            thumbnail={movie.thumbnail.regular.large}
            rating={movie.rating}
          />
        ))}
      </div>
    </div>
  );
};
