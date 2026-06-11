import { useEffect, useState } from "react";
import { Card } from "./Card";
import { useLocation } from "react-router-dom";
import api from "../api/axios";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { RegularDataItem } from "../types";

type MediaType = "movie" | "tv";

// Tag raw TMDB results with a known media_type so the card shows the right
// icon/label (and, later, links to the correct details route). Results that
// already carry a media_type (e.g. the blended /recommended feed) keep theirs.
const tag = (results: RegularDataItem[], mediaType: MediaType): RegularDataItem[] =>
  results.map((item) => ({ ...item, media_type: (item.media_type as MediaType) || mediaType }));

const dedupeById = (items: RegularDataItem[]): RegularDataItem[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = String(item.id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

// Favorites don't store a media_type yet, so personalize off the most recent
// bookmark by trying movie recommendations first, then tv. Empty if neither hits.
const fetchSeedRecommendations = async (id: string): Promise<RegularDataItem[]> => {
  try {
    const { data } = await api.get(`/tmdb/movie/${id}/recommendations`);
    if (data?.results?.length) return tag(data.results, "movie");
  } catch {
    /* fall through to tv */
  }
  try {
    const { data } = await api.get(`/tmdb/tv/${id}/recommendations`);
    if (data?.results?.length) return tag(data.results, "tv");
  } catch {
    /* no recommendations for this seed */
  }
  return [];
};

// Resolve each bookmarked id to its full detail (movie first, tv fallback).
const fetchBookmarkedItems = async (ids: string[]): Promise<RegularDataItem[]> => {
  if (ids.length === 0) return [];
  const items = await Promise.all(
    ids.map(async (id) => {
      try {
        const { data } = await api.get(`/tmdb/movie/${id}`);
        return { ...data, media_type: "movie" } as RegularDataItem;
      } catch {
        try {
          const { data } = await api.get(`/tmdb/tv/${id}`);
          return { ...data, media_type: "tv" } as RegularDataItem;
        } catch {
          return null;
        }
      }
    })
  );
  return items.filter((item): item is RegularDataItem => item !== null);
};

export const CardWrapper: React.FC = () => {
  const [items, setItems] = useState<RegularDataItem[]>([]);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isMoviesPage = location.pathname === "/movies";
  const isTvSeriesPage = location.pathname === "/tv-series";
  const isBookmarkPage = location.pathname === "/bookmark";

  const favorites = useSelector((state: RootState) => state.user.favorites);
  const watchlist = useSelector((state: RootState) => state.user.watchlist);
  const [bookmarkTab, setBookmarkTab] = useState<"bookmarks" | "watchlist">("bookmarks");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isHomePage) {
          // Always load the blended popular feed so the row is never empty,
          // then prepend personalized picks when the user has bookmarks.
          const recommendedReq = api.get("/tmdb/recommended");

          let personalized: RegularDataItem[] = [];
          if (favorites.length > 0) {
            personalized = await fetchSeedRecommendations(favorites[favorites.length - 1]);
          }

          const recommended: RegularDataItem[] = (await recommendedReq).data?.results ?? [];
          setItems(dedupeById([...personalized, ...recommended]));
        } else if (isMoviesPage) {
          const { data } = await api.get("/tmdb/movies/popular");
          setItems(tag(data?.results ?? [], "movie"));
        } else if (isTvSeriesPage) {
          const { data } = await api.get("/tmdb/tv/popular");
          setItems(tag(data?.results ?? [], "tv"));
        } else if (isBookmarkPage) {
          const sourceIds = bookmarkTab === "watchlist" ? watchlist : favorites;
          setItems(await fetchBookmarkedItems(sourceIds));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [isHomePage, isMoviesPage, isTvSeriesPage, isBookmarkPage, favorites, watchlist, bookmarkTab]);

  return (
    <div className="w-full py-2">
      {isBookmarkPage ? (
        <div className="flex items-center gap-6 py-8 font-outfit">
          {(["bookmarks", "watchlist"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setBookmarkTab(tab)}
              className={`text-2xl md:text-3xl capitalize ${
                bookmarkTab === tab ? "text-white" : "text-greyish-blue hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      ) : (
        <h2 className="text-2xl md:text-3xl text-white font-outfit py-8">
          {isHomePage && "Recommended for you"}
          {isMoviesPage && "Movies"}
          {isTvSeriesPage && "TV Series"}
        </h2>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-24">
        {items.map((item) => {
          const mediaType: MediaType = item.media_type === "tv" ? "tv" : "movie";
          const date = item.release_date || item.first_air_date || "";
          return (
            <Card
              key={String(item.id)}
              id={String(item.id)}
              mediaType={mediaType}
              title={item.title || item.name || item.original_title || item.original_name || ""}
              year={date ? new Date(date).getFullYear().toString() : ""}
              category={mediaType === "tv" ? "TV Series" : "Movie"}
              thumbnail={`https://image.tmdb.org/t/p/w500${
                item.backdrop_path || item.poster_path || ""
              }`}
              rating={item.vote_average ? item.vote_average.toFixed(1).toString() : ""}
              bookmark={favorites.includes(String(item.id))}
            />
          );
        })}
      </div>
      {isBookmarkPage && items.length === 0 && (
        <p className="text-greyish-blue font-outfit">
          {bookmarkTab === "watchlist"
            ? "Your watchlist is empty."
            : "You haven't bookmarked anything yet."}
        </p>
      )}
    </div>
  );
};
