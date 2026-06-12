import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { TrendingCard } from "./TrendingCard";
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { RecommendationItem } from '../types';

// Trending is computed server-side from real interaction events (most-viewed /
// most-bookmarked), and falls back to TMDB's global trending when there isn't
// enough community data yet. Either way the server returns normalized cards.
export const TrendingWrapper: React.FC = () => {
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [source, setSource] = useState<'community' | 'tmdb'>('tmdb');
  const bookmarked = useSelector((state: RootState) => state.user.favorites);

  useEffect(() => {
    let active = true;
    api
      .get('/insights/trending')
      .then((res) => {
        if (!active) return;
        setItems(res.data?.results ?? []);
        setSource(res.data?.source === 'community' ? 'community' : 'tmdb');
      })
      .catch((error) => console.error('Failed to fetch trending', error));
    return () => {
      active = false;
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="min-h-60 md:min-h-[40vh] overflow-x-scroll font-outfit">
      <h4 className="text-2xl md:text-3xl text-white pb-6">
        {source === 'community' ? 'Trending in the community' : 'Trending'}
      </h4>
      <div className="flex gap-10 w-fit">
        {items.map((item) => (
          <TrendingCard
            key={`${item.mediaType}-${item.id}`}
            id={item.id}
            mediaType={item.mediaType}
            title={item.title}
            year={item.year}
            category={item.mediaType === 'tv' ? 'TV Series' : 'Movie'}
            thumbnail={item.backdropPath || item.posterPath || ''}
            rating={item.rating}
            bookmark={bookmarked.includes(item.id)}
          />
        ))}
      </div>
    </div>
  );
};
