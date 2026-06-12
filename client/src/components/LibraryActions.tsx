import { useDispatch, useSelector } from "react-redux";
import {
  FaBookmark,
  FaCheck,
  FaPlus,
  FaEye,
  FaRegEye,
  FaStar,
  FaRegStar,
} from "react-icons/fa";
import { FiBookmark } from "react-icons/fi";
import api from "../api/axios";
import { RootState } from "../store/store";
import {
  addFavorites,
  removeFavorites,
  addToWatchlist,
  removeFromWatchlist,
  toggleWatched as toggleWatchedAction,
  setRating as setRatingAction,
  removeRating as removeRatingAction,
} from "../store/userSlice";
import { MediaType } from "../types";

// All library actions for one title (bookmark / watchlist / watched / rating),
// optimistically updating the store and persisting via /favorites + /library.
export default function LibraryActions({ id }: { id: string; mediaType: MediaType }) {
  const dispatch = useDispatch();
  const email = useSelector((s: RootState) => s.user.email);
  const favorites = useSelector((s: RootState) => s.user.favorites);
  const watchlist = useSelector((s: RootState) => s.user.watchlist);
  const watchedMovies = useSelector((s: RootState) => s.user.watchedMovies);
  const ratings = useSelector((s: RootState) => s.user.ratings);

  const isBookmarked = favorites.includes(id);
  const isInWatchlist = watchlist.includes(id);
  const isWatched = watchedMovies.includes(id);
  const myRating = ratings.find((r) => r.id === id)?.value ?? 0;

  const ready = () => {
    if (!email) {
      console.error("User email not available");
      return false;
    }
    return true;
  };

  const post = async (url: string, body: Record<string, unknown>) => {
    try {
      await api.post(url, body);
    } catch (e) {
      console.error(`${url} failed`, e);
    }
  };

  const toggleBookmark = () => {
    if (!ready()) return;
    if (isBookmarked) {
      dispatch(removeFavorites(id));
      post("/favorites/removeFavorite", { email, id });
    } else {
      dispatch(addFavorites(id));
      post("/favorites/addFavorite", { email, id });
    }
  };

  const toggleWatchlist = () => {
    if (!ready()) return;
    if (isInWatchlist) {
      dispatch(removeFromWatchlist(id));
      post("/library/watchlist/remove", { email, id });
    } else {
      dispatch(addToWatchlist(id));
      post("/library/watchlist/add", { email, id });
    }
  };

  const toggleWatched = () => {
    if (!ready()) return;
    dispatch(toggleWatchedAction(id));
    post("/library/watched/toggle", { email, id });
  };

  const rate = (value: number) => {
    if (!ready()) return;
    if (value === myRating) {
      // Re-clicking the current rating clears it.
      dispatch(removeRatingAction(id));
      post("/library/rating/remove", { email, id });
    } else {
      dispatch(setRatingAction({ id, value }));
      post("/library/rating", { email, id, value });
    }
  };

  const pill = "flex items-center gap-2 rounded-full px-5 py-2 text-white text-sm";
  const active = "bg-greyish-blue/40";
  const idle = "bg-semi-dark-blue hover:bg-greyish-blue/30";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button onClick={toggleBookmark} className={`${pill} ${isBookmarked ? active : idle}`}>
        {isBookmarked ? <FaBookmark className="w-3 h-3" /> : <FiBookmark className="w-4 h-4" />}
        {isBookmarked ? "Bookmarked" : "Bookmark"}
      </button>

      <button onClick={toggleWatchlist} className={`${pill} ${isInWatchlist ? active : idle}`}>
        {isInWatchlist ? <FaCheck className="w-3 h-3" /> : <FaPlus className="w-3 h-3" />}
        {isInWatchlist ? "In Watchlist" : "Watchlist"}
      </button>

      <button onClick={toggleWatched} className={`${pill} ${isWatched ? active : idle}`}>
        {isWatched ? <FaEye className="w-4 h-4" /> : <FaRegEye className="w-4 h-4" />}
        {isWatched ? "Watched" : "Mark watched"}
      </button>

      <div
        className="flex items-center gap-1 bg-semi-dark-blue rounded-full px-4 py-2"
        role="group"
        aria-label="Rate this title"
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => rate(star)}
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            className="text-red hover:scale-110 transition-transform"
          >
            {star <= myRating ? <FaStar className="w-4 h-4" /> : <FaRegStar className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </div>
  );
}
