import { bookmarkEmpty, categoryMovie, categoryTV } from "../assets";
import { TrendingDataItem } from "../types";
type CardProps = Pick<
  TrendingDataItem,
  "title" | "thumbnail" | "year" | "category" | "rating"
>;

export const TrendingCard: React.FC<CardProps> = ({
  title,
  thumbnail,
  year,
  category,
  rating,
}) => {

  return (
    <div className={`w-[240px] h-[140px] md:w-[470px] md:h-[230px] font-outfit`}>
      <div className="w-full h-full flex items-start">
        <img
          src={thumbnail}
          alt="thumbnail"
          className="w-full h-full  rounded-lg "
        />
        <button className="w-8 h-8 mt-4 -ml-12  bg-vulcan opacity-50 hover:opacity-40 rounded-full">
          <img src={bookmarkEmpty} alt="bookmark" className="w-3 h-3 m-auto" />
        </button>
      </div>
      <div className=" -mt-16 ml-6 text-white text-[15px] font-light">
        <div className=" flex items-center gap-2">
          <p>{year}</p>•
          <p className="flex items-center gap-2">
            {category === 'Movie' &&(<img src={categoryMovie} alt="movie" className="w-4 h-4"/>)}
            {category === 'TV Series' &&(<img src={categoryTV} alt="tv series" className="w-4 h-4" />)}
            {category}
            </p> •<p>{rating}</p>
        </div>
        <h2 className="text-2xl font-medium">{title}</h2>
      </div>
    </div>
  );
};
