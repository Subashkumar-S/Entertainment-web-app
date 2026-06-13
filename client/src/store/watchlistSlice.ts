import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { WatchlistItem } from "../types";

// The user's watchlist items (with status + optional reminder), loaded from
// GET /library/watchlist on auth. Source of truth for "is it on my watchlist"
// and the dedicated Watchlist page.
interface WatchlistState {
  items: WatchlistItem[];
}

const initialState: WatchlistState = { items: [] };

const watchlistSlice = createSlice({
  name: "watchlist",
  initialState,
  reducers: {
    setWatchlist(state, action: PayloadAction<WatchlistItem[]>) {
      state.items = action.payload;
    },
    clearWatchlist(state) {
      state.items = [];
    },
    upsertWatchlistItem(state, action: PayloadAction<WatchlistItem>) {
      const i = state.items.findIndex((x) => x._id === action.payload._id);
      if (i >= 0) state.items[i] = action.payload;
      else state.items.push(action.payload);
    },
    removeWatchlistItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((x) => x._id !== action.payload);
    },
  },
});

export const { setWatchlist, clearWatchlist, upsertWatchlistItem, removeWatchlistItem } =
  watchlistSlice.actions;

export default watchlistSlice.reducer;
