import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getRecentlyViewed,
  recordRecentlyViewed,
  clearRecentlyViewed,
  RecentItem,
} from "./recentlyViewed";

// Minimal in-memory localStorage so the util can run in the node environment.
const makeStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
};

const make = (id: string, mediaType: "movie" | "tv" = "movie"): RecentItem => ({
  id,
  mediaType,
  title: `Title ${id}`,
  year: "2024",
  rating: 7,
  posterPath: null,
  backdropPath: null,
});

beforeEach(() => {
  vi.stubGlobal("localStorage", makeStorage());
});

describe("recentlyViewed", () => {
  it("starts empty", () => {
    expect(getRecentlyViewed()).toEqual([]);
  });

  it("records most-recent first", () => {
    recordRecentlyViewed(make("1"));
    recordRecentlyViewed(make("2"));
    expect(getRecentlyViewed().map((i) => i.id)).toEqual(["2", "1"]);
  });

  it("de-duplicates by id+mediaType and moves the repeat to the front", () => {
    recordRecentlyViewed(make("1"));
    recordRecentlyViewed(make("2"));
    recordRecentlyViewed(make("1"));
    expect(getRecentlyViewed().map((i) => i.id)).toEqual(["1", "2"]);
  });

  it("treats the same id under a different mediaType as a distinct entry", () => {
    recordRecentlyViewed(make("1", "movie"));
    recordRecentlyViewed(make("1", "tv"));
    expect(getRecentlyViewed()).toHaveLength(2);
  });

  it("caps the history at 12 entries", () => {
    for (let i = 0; i < 20; i++) recordRecentlyViewed(make(String(i)));
    expect(getRecentlyViewed()).toHaveLength(12);
    // Newest kept, oldest dropped.
    expect(getRecentlyViewed()[0].id).toBe("19");
  });

  it("clears the history", () => {
    recordRecentlyViewed(make("1"));
    clearRecentlyViewed();
    expect(getRecentlyViewed()).toEqual([]);
  });

  it("returns [] when stored JSON is corrupt", () => {
    localStorage.setItem("recentlyViewed", "{not json");
    expect(getRecentlyViewed()).toEqual([]);
  });
});
