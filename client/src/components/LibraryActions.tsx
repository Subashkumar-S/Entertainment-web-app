import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FaBookmark,
  FaCheck,
  FaPlus,
  FaEye,
  FaRegEye,
  FaStar,
  FaRegStar,
  FaBell,
  FaTimes,
} from "react-icons/fa";
import { FiBookmark } from "react-icons/fi";
import api from "../api/axios";
import { RootState } from "../store/store";
import {
  addFavorites,
  removeFavorites,
  toggleWatched as toggleWatchedAction,
  setRating as setRatingAction,
  removeRating as removeRatingAction,
} from "../store/userSlice";
import { upsertWatchlistItem, removeWatchlistItem } from "../store/watchlistSlice";
import { MediaType, WatchlistItem } from "../types";

// All library actions for one title. Bookmark / watched / rating still persist
// via the legacy /favorites + /library endpoints (User arrays). Watchlist uses
// the new per-item API so a title can carry an optional email reminder.
export default function LibraryActions({
  id,
  mediaType,
  title,
  posterPath,
}: {
  id: string;
  mediaType: MediaType;
  title: string;
  posterPath?: string;
}) {
  const dispatch = useDispatch();
  const email = useSelector((s: RootState) => s.user.email);
  const favorites = useSelector((s: RootState) => s.user.favorites);
  const watchedMovies = useSelector((s: RootState) => s.user.watchedMovies);
  const ratings = useSelector((s: RootState) => s.user.ratings);
  const watchlistItems = useSelector((s: RootState) => s.watchlist.items);

  const isBookmarked = favorites.includes(id);
  const watchlistItem = watchlistItems.find((i) => i.titleId === id && i.mediaType === mediaType);
  const isInWatchlist = Boolean(watchlistItem);
  const isWatched = watchedMovies.includes(id);
  const myRating = ratings.find((r) => r.id === id)?.value ?? 0;

  const [showReminder, setShowReminder] = useState(false);
  const [remindAt, setRemindAt] = useState("");

  // "now" in the input's local-datetime format, to block past times.
  const minLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

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

  const addToWatchlist = async () => {
    if (!ready()) return;
    const body: Record<string, unknown> = { mediaType, titleId: id, title, posterPath };
    if (remindAt) {
      body.remindAt = new Date(remindAt).toISOString();
      body.remindTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    try {
      const res = await api.post("/library/watchlist", body);
      dispatch(upsertWatchlistItem(res.data.item as WatchlistItem));
    } catch (e) {
      console.error("add to watchlist failed", e);
    }
    setShowReminder(false);
    setRemindAt("");
  };

  const removeFromWatchlist = async () => {
    if (!watchlistItem) return;
    dispatch(removeWatchlistItem(watchlistItem._id));
    try {
      await api.delete(`/library/watchlist/${watchlistItem._id}`);
    } catch (e) {
      console.error("remove from watchlist failed", e);
    }
  };

  const onWatchlistClick = () => {
    if (isInWatchlist) removeFromWatchlist();
    else setShowReminder((v) => !v);
  };

  const toggleWatched = () => {
    if (!ready()) return;
    dispatch(toggleWatchedAction(id));
    post("/library/watched/toggle", { email, id });
  };

  const rate = (value: number) => {
    if (!ready()) return;
    if (value === myRating) {
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

      <div className="relative">
        <button onClick={onWatchlistClick} className={`${pill} ${isInWatchlist ? active : idle}`}>
          {isInWatchlist ? <FaCheck className="w-3 h-3" /> : <FaPlus className="w-3 h-3" />}
          {isInWatchlist ? "In Watchlist" : "Watchlist"}
        </button>

        {showReminder && !isInWatchlist && (
          <div className="absolute z-30 mt-2 w-72 bg-semi-dark-blue text-white rounded-lg p-4 shadow-lg font-outfit">
            <p className="text-sm mb-2 flex items-center gap-2">
              <FaBell className="w-3 h-3 text-red" /> Remind me to watch (optional)
            </p>
            <input
              type="datetime-local"
              value={remindAt}
              min={minLocal}
              onChange={(e) => setRemindAt(e.target.value)}
              className="w-full bg-dark-blue rounded px-3 py-2 text-sm text-white [color-scheme:dark] outline-none mb-3"
            />
            <div className="flex items-center gap-2">
              <button onClick={addToWatchlist} className="flex-1 bg-red rounded-full py-2 text-sm hover:opacity-90">
                Add to watchlist
              </button>
              <button
                onClick={() => {
                  setShowReminder(false);
                  setRemindAt("");
                }}
                aria-label="Cancel"
                className="px-3 py-2 text-greyish-blue hover:text-white"
              >
                <FaTimes />
              </button>
            </div>
            <p className="text-[11px] text-greyish-blue mt-2">
              We'll email you at the time you pick. Leave blank to just save it.
            </p>
          </div>
        )}
      </div>

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
