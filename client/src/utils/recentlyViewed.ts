import { MediaType } from "../types";

// Device-local "recently viewed" history, recorded when a details page loads.
// Honest for an Option-A (trailers + providers) streaming surface: no fake
// playback, just the titles this browser has opened.

export interface RecentItem {
  id: string;
  mediaType: MediaType;
  title: string;
  year: string;
  rating: number;
  posterPath: string | null;
  backdropPath: string | null;
}

const KEY = "recentlyViewed";
const MAX = 12;

export const getRecentlyViewed = (): RecentItem[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentItem[]) : [];
  } catch {
    return [];
  }
};

export const recordRecentlyViewed = (item: RecentItem) => {
  try {
    // Most-recent first, de-duplicated by id+mediaType, capped at MAX.
    const list = getRecentlyViewed().filter(
      (i) => !(i.id === item.id && i.mediaType === item.mediaType)
    );
    list.unshift(item);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* ignore storage errors (private mode, quota) */
  }
};

export const clearRecentlyViewed = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};
