import { MdLocalMovies } from "react-icons/md";
import { TrendingDataItem } from "../types";
import { RiTvFill } from "react-icons/ri";
import { FaBookmark } from "react-icons/fa";
import { FiBookmark } from "react-icons/fi";
import { FaPlay } from "react-icons/fa";

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
  bookmark,
}) => {
  return (
    <div className="w-[240px] h-[140px] md:w-[470px] md:h-[230px] font-outfit relative group">
      <img
        src={thumbnail}
        alt="thumbnail"
        className="w-full h-full rounded-lg"
      />
      <button className="z-20 absolute top-2 right-2 md:top-4 md:right-4 w-8 h-8 bg-vulcan opacity-80 hover:opacity-60 rounded-full">
        {bookmark ? (
          <FaBookmark className="w-3 h-3 m-auto text-white" />
        ) : (
          <FiBookmark className="w-4 h-4 m-auto text-white" />
        )}
      </button>
      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="bg-white bg-opacity-30 rounded-full p-2 flex items-center justify-center px-4 gap-2 text-white font-outfit">
          <FaPlay className=" w-6 h-6" />
          <p className="text-sm md:text-lg">Play</p>
        </button>
      </div>
      <div className="absolute bottom-4 left-6 text-white text-[15px] font-light">
        <div className="flex items-center gap-2">
          <p>{year}</p>•
          <p className="flex items-center gap-2">
            {category === "Movie" && <MdLocalMovies className="w-4 h-4" />}
            {category === "TV Series" && <RiTvFill className="w-4 h-4" />}
            {category}
          </p>•
          <p>{rating}</p>
        </div>
        <h2 className="text-[15px] md:text-2xl font-medium">{title}</h2>
      </div>
    </div>
  );
};
