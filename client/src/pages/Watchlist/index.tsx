import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaBell, FaRegClock, FaCheck, FaTrash, FaTimes, FaEye } from "react-icons/fa";
import Navbar from "../../components/Navbar";
import api from "../../api/axios";
import { RootState } from "../../store/store";
import { upsertWatchlistItem, removeWatchlistItem } from "../../store/watchlistSlice";
import { WatchlistItem } from "../../types";

// ISO → value for a <input type="datetime-local"> (local wall-clock, no zone).
const toLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const formatWhen = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "";

const nowLocalInput = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

function WatchlistRow({ item }: { item: WatchlistItem }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [remindAt, setRemindAt] = useState(toLocalInput(item.remindAt));

  const patch = async (body: Record<string, unknown>) => {
    try {
      const res = await api.patch(`/library/watchlist/${item._id}`, body);
      dispatch(upsertWatchlistItem(res.data.item as WatchlistItem));
    } catch (e) {
      console.error("update watchlist item failed", e);
    }
  };

  const saveReminder = async () => {
    await patch({ remindAt: remindAt ? new Date(remindAt).toISOString() : null });
    setEditing(false);
  };

  const clearReminder = async () => {
    setRemindAt("");
    await patch({ remindAt: null });
    setEditing(false);
  };

  const toggleWatched = () => patch({ status: item.status === "watched" ? "planned" : "watched" });

  const remove = async () => {
    dispatch(removeWatchlistItem(item._id));
    try {
      await api.delete(`/library/watchlist/${item._id}`);
    } catch (e) {
      console.error("remove watchlist item failed", e);
    }
  };

  const open = () => navigate(`/title/${item.mediaType}/${item.titleId}`);

  return (
    <div className="flex gap-4 bg-semi-dark-blue rounded-lg p-3 font-outfit">
      {item.posterPath ? (
        <img
          src={item.posterPath}
          alt={item.title}
          onClick={open}
          className="w-20 h-28 object-cover rounded cursor-pointer shrink-0"
        />
      ) : (
        <div className="w-20 h-28 bg-dark-blue rounded shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <button onClick={open} className="text-white text-lg text-left hover:text-red truncate block w-full">
          {item.title}
        </button>
        <p className="text-greyish-blue text-xs mt-1">
          {item.mediaType === "tv" ? "TV Series" : "Movie"}
          {item.status === "watched" && " · watched"}
        </p>

        {item.remindAt && !editing && item.status === "planned" && (
          <p className="text-sm text-white mt-2 flex items-center gap-2">
            <FaBell className="w-3 h-3 text-red" /> {formatWhen(item.remindAt)}
            {item.reminderSent && <span className="text-greyish-blue text-xs">(sent)</span>}
          </p>
        )}

        {editing && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              type="datetime-local"
              value={remindAt}
              min={nowLocalInput()}
              onChange={(e) => setRemindAt(e.target.value)}
              className="bg-dark-blue rounded px-2 py-1 text-sm text-white [color-scheme:dark] outline-none"
            />
            <button onClick={saveReminder} className="bg-red rounded-full px-3 py-1 text-sm text-white hover:opacity-90">
              Save
            </button>
            {item.remindAt && (
              <button onClick={clearReminder} className="text-greyish-blue hover:text-white text-sm">
                Clear
              </button>
            )}
            <button
              onClick={() => {
                setEditing(false);
                setRemindAt(toLocalInput(item.remindAt));
              }}
              aria-label="Cancel"
              className="text-greyish-blue hover:text-white"
            >
              <FaTimes />
            </button>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
          {!editing && (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-greyish-blue hover:text-white">
              <FaRegClock /> {item.remindAt ? "Edit reminder" : "Set reminder"}
            </button>
          )}
          <button onClick={toggleWatched} className="flex items-center gap-1 text-greyish-blue hover:text-white">
            {item.status === "watched" ? <FaEye /> : <FaCheck />}{" "}
            {item.status === "watched" ? "Mark planned" : "Mark watched"}
          </button>
          <button onClick={remove} className="flex items-center gap-1 text-greyish-blue hover:text-red">
            <FaTrash /> Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, list }: { title: string; list: WatchlistItem[] }) {
  if (list.length === 0) return null;
  return (
    <section className="mb-10">
      <h3 className="text-white text-xl md:text-2xl font-outfit mb-4">{title}</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {list.map((i) => (
          <WatchlistRow key={i._id} item={i} />
        ))}
      </div>
    </section>
  );
}

export default function WatchlistPage() {
  const items = useSelector((s: RootState) => s.watchlist.items);

  const now = Date.now();
  const upcoming = items
    .filter((i) => i.status === "planned" && i.remindAt && Date.parse(i.remindAt) >= now)
    .sort((a, b) => Date.parse(a.remindAt as string) - Date.parse(b.remindAt as string));
  const upcomingIds = new Set(upcoming.map((i) => i._id));
  const planned = items.filter((i) => i.status === "planned" && !upcomingIds.has(i._id));
  const watched = items.filter((i) => i.status === "watched");

  return (
    <section className="w-full h-screen bg-dark-blue lg:flex gap-6">
      <Navbar />
      <div className="w-full bg-dark-blue flex flex-col lg:pt-8 px-4 sm:px-6 overflow-y-scroll">
        <h2 className="text-2xl md:text-3xl text-white font-outfit py-8">My Watchlist</h2>
        {items.length === 0 ? (
          <p className="text-greyish-blue font-outfit">
            Your watchlist is empty. Open a title and hit <span className="text-white">Watchlist</span> — you can set a
            reminder and we'll email you when it's time to watch.
          </p>
        ) : (
          <>
            <Section title="Upcoming reminders" list={upcoming} />
            <Section title="Planned" list={planned} />
            <Section title="Watched" list={watched} />
          </>
        )}
      </div>
    </section>
  );
}
