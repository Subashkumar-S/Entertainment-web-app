import { useEffect, useState } from "react";
import { Card } from "./Card";
import { useLocation } from "react-router-dom";
import api from "../api/axios";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { Genre, RegularDataItem } from "../types";
import { tag, dedupeById, blendRecommendations } from "../utils/feed";

type MediaType = "movie" | "tv";

// Favorites don't store a media_type yet, so personalize off the most recent
// bookmark by trying movie recommendations first, then tv.
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

const browseUrl = (mediaType: MediaType, page: number, genreId: number | null) =>
  genreId
    ? `/tmdb/discover/${mediaType}?genre=${genreId}&page=${page}`
    : `/tmdb/${mediaType === "movie" ? "movies" : "tv"}/popular?page=${page}`;

export const CardWrapper: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isMoviesPage = location.pathname === "/movies";
  const isTvSeriesPage = location.pathname === "/tv-series";
  const isBookmarkPage = location.pathname === "/bookmark";
  const browseMediaType: MediaType | null = isMoviesPage ? "movie" : isTvSeriesPage ? "tv" : null;

  const favorites = useSelector((state: RootState) => state.user.favorites);
  const watchlist = useSelector((state: RootState) => state.user.watchlist);

  const [items, setItems] = useState<RegularDataItem[]>([]);
  const [bookmarkTab, setBookmarkTab] = useState<"bookmarks" | "watchlist">("bookmarks");

  // Browse (movies/tv) genre filter + pagination.
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genreId, setGenreId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Clear the grid on navigation so stale items from another page don't flash.
  useEffect(() => {
    setItems([]);
  }, [location.pathname]);

  // Load the genre list (and reset the active filter) for the current browse page.
  useEffect(() => {
    if (!browseMediaType) return;
    setGenreId(null);
    api
      .get(`/tmdb/genres/${browseMediaType}`)
      .then((r) => setGenres(r.data?.genres ?? []))
      .catch(() => setGenres([]));
  }, [browseMediaType]);

  // Home: blended recommended feed, personalized when the user has bookmarks.
  useEffect(() => {
    if (!isHomePage) return;
    let active = true;
    (async () => {
      const recommendedReq = api.get("/tmdb/recommended");
      let personalized: RegularDataItem[] = [];
      if (favorites.length > 0) {
        personalized = await fetchSeedRecommendations(favorites[favorites.length - 1]);
      }
      const recommended: RegularDataItem[] = (await recommendedReq).data?.results ?? [];
      if (active) setItems(blendRecommendations(personalized, recommended));
    })().catch((e) => console.error("Error loading recommended:", e));
    return () => {
      active = false;
    };
  }, [isHomePage, favorites]);

  // Movies / TV: first page of popular (or discover-by-genre). Not tied to
  // favorites, so bookmarking a card here doesn't reset the grid/pagination.
  useEffect(() => {
    if (!browseMediaType) return;
    let active = true;
    (async () => {
      const { data } = await api.get(browseUrl(browseMediaType, 1, genreId));
      if (!active) return;
      setItems(tag(data?.results ?? [], browseMediaType));
      setPage(1);
      setHasMore(1 < (data?.total_pages ?? 1));
    })().catch((e) => console.error("Error loading browse page:", e));
    return () => {
      active = false;
    };
  }, [browseMediaType, genreId]);

  // Bookmarks / Watchlist: resolve the selected id list to full items.
  useEffect(() => {
    if (!isBookmarkPage) return;
    let active = true;
    (async () => {
      const sourceIds = bookmarkTab === "watchlist" ? watchlist : favorites;
      const resolved = await fetchBookmarkedItems(sourceIds);
      if (active) setItems(resolved);
    })().catch((e) => console.error("Error resolving bookmarks:", e));
    return () => {
      active = false;
    };
  }, [isBookmarkPage, bookmarkTab, favorites, watchlist]);

  const loadMore = async () => {
    if (!browseMediaType || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const { data } = await api.get(browseUrl(browseMediaType, next, genreId));
      setItems((prev) => dedupeById([...prev, ...tag(data?.results ?? [], browseMediaType)]));
      setPage(next);
      setHasMore(next < (data?.total_pages ?? 1));
    } catch (e) {
      console.error("Error loading more:", e);
    } finally {
      setLoadingMore(false);
    }
  };

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

      {browseMediaType && genres.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-8 font-outfit">
          <button
            onClick={() => setGenreId(null)}
            className={`text-xs rounded-full px-3 py-1 ${
              genreId === null ? "bg-red text-white" : "bg-semi-dark-blue text-greyish-blue hover:text-white"
            }`}
          >
            All
          </button>
          {genres.map((g) => (
            <button
              key={g.id}
              onClick={() => setGenreId(g.id)}
              className={`text-xs rounded-full px-3 py-1 ${
                genreId === g.id ? "bg-red text-white" : "bg-semi-dark-blue text-greyish-blue hover:text-white"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
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

      {browseMediaType && hasMore && (
        <div className="flex justify-center pt-10">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="bg-semi-dark-blue text-white font-outfit rounded-full px-8 py-3 hover:bg-greyish-blue/30 disabled:opacity-60"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
};
