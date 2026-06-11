import React from 'react';
import { MdLocalMovies } from 'react-icons/md';
import { RiTvFill } from 'react-icons/ri';
import { FaBookmark, FaPlay } from 'react-icons/fa';
import { FiBookmark } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { RootState } from '../store/store';
import { addFavorites, removeFavorites } from '../store/userSlice';
import { MediaType } from '../types';

type CardProps = {
  id: string;
  title: string;
  thumbnail: string;
  year: string;
  category: string;
  rating: number;
  bookmark: boolean;
  mediaType: MediaType;
};

export const TrendingCard: React.FC<CardProps> = ({
  id,
  title,
  thumbnail,
  year,
  category,
  rating,
  bookmark,
  mediaType,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const favorites = useSelector((state: RootState) => state.user.favorites);
  const email = useSelector((state: RootState) => state.user.email);

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // don't trigger card navigation
    if (!email) {
      console.error('User email not available');
      return;
    }

    if (favorites.includes(id)) {
      dispatch(removeFavorites(id));
      try {
        await api.post('/favorites/removeFavorite', { email, id });
      } catch (error) {
        console.error('Error removing favorite from the database:', error);
      }
    } else {
      dispatch(addFavorites(id));
      try {
        await api.post('/favorites/addFavorite', { email, id });
      } catch (error) {
        console.error('Error adding favorite to the database:', error);
      }
    }
  };

  const openDetails = () => navigate(`/title/${mediaType}/${id}`);

  return (
    <div
      className="relative w-[240px] h-[140px] md:w-[470px] md:h-[230px] font-outfit group rounded-lg overflow-hidden cursor-pointer"
      onClick={openDetails}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover object-center"
        />
      </div>
      <button
        className="absolute top-2 right-2 md:top-4 md:right-4 w-8 h-8 bg-semi-dark-blue opacity-80 hover:opacity-60 rounded-full z-20"
        onClick={handleBookmarkClick}
        aria-label={bookmark ? 'Remove bookmark' : 'Add bookmark'}
      >
        {bookmark ? (
          <FaBookmark className="w-3 h-3 m-auto text-white" />
        ) : (
          <FiBookmark className="w-4 h-4 m-auto text-white" />
        )}
      </button>

      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg z-10">
        <div className="bg-white bg-opacity-30 rounded-full p-2 flex items-center justify-center px-4 gap-2 text-white font-outfit">
          <FaPlay className="w-6 h-6" />
          <p className="text-sm md:text-lg">Play</p>
        </div>
      </div>
      <div className="absolute bottom-4 left-6 text-white text-[15px] font-light z-10">
        <div className="flex items-center gap-2">
          <p>{year}</p>•
          <p className="flex items-center gap-2">
            {category === 'Movie' && <MdLocalMovies className="w-4 h-4" />}
            {category === 'TV Series' && <RiTvFill className="w-4 h-4" />}
            {category}
          </p>•
          <p>{rating.toString()}</p>
        </div>
        <h2 className="text-[15px] md:text-2xl font-medium">{title}</h2>
      </div>
    </div>
  );
};
