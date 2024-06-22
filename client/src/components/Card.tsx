import { MdLocalMovies } from 'react-icons/md';
import { RiTvFill } from 'react-icons/ri';
import { FaBookmark, FaPlay } from 'react-icons/fa';
import { FiBookmark } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { addFavorites, removeFavorites } from '../store/userSlice';
import axios from 'axios';

type CardProps = {
  id: string;
  title: string;
  thumbnail: string;
  year: string;
  category: string;
  rating: string;
  bookmark: boolean;
};

export const Card: React.FC<CardProps> = ({
  id,
  title,
  thumbnail,
  year,
  category,
  rating,
  bookmark,
}) => {
  const dispatch = useDispatch();
  const favorites = useSelector((state: RootState) => state.user.favorites);
  const email = useSelector((state: RootState) => state.user.email);

  const handleBookmarkClick = async () => {
    if (!email) {
      console.error('User email not available');
      return;
    }

    if (favorites.includes(id)) {
      dispatch(removeFavorites(id));
      try {
        await axios.post(
          'http://localhost:5000/api/favorites/removeFavorite',
          { email, id },
          { withCredentials: true }
        );
      } catch (error) {
        console.error('Error removing favorite from the database:', error);
      }
    } else {
      dispatch(addFavorites(id));
      try {
        await axios.post(
          'http://localhost:5000/api/favorites/addFavorite',
          { email, id },
          { withCredentials: true }
        );
      } catch (error) {
        console.error('Error adding favorite to the database:', error);
      }
    }
  };

  return (
    <div className="w-[164px] h-[110px] md:w-[220px] md:h-[140px] lg:w-[280px] lg:h-[174px] font-outfit relative group">
      <div className="w-full h-full flex items-start relative">
        <img
          src={thumbnail}
          alt="thumbnail"
          className="w-full h-full rounded-lg"
        />
        <button
          className="z-20 w-8 h-8 mt-2 md:mt-4 -ml-10 md:-ml-12 bg-vulcan opacity-80 hover:opacity-60 rounded-full hover:cursor-pointer"
          onClick={handleBookmarkClick}
        >
          {bookmark ? (
            <FaBookmark className="w-3 h-3 m-auto text-white" />
          ) : (
            <FiBookmark className="w-4 h-4 m-auto text-white" />
          )}
        </button>
        <div className="absolute z-10 inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="bg-white bg-opacity-30 rounded-full p-2 flex items-center justify-center px-4 gap-2 text-white font-outfit">
            <FaPlay className="w-6 h-6" />
            <p className="text-sm md:text-lg">Play</p>
          </button>
        </div>
      </div>
      <div className="pt-2 text-white text-[11px] md:text-[13px] font-light">
        <div className="flex items-center gap-2">
          <p>{year}</p>•
          <p className="flex items-center gap-2">
            {category === 'Movie' && <MdLocalMovies className="w-4 h-4" />}
            {category === 'TV Series' && <RiTvFill className="w-4 h-4" />}
            {category}
          </p>
          •<p>{rating}</p>
        </div>
        <h2 className="text-sm md:text-lg font-medium">{title}</h2>
      </div>
    </div>
  );
};
