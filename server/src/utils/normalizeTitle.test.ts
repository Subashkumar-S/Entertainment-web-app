import { describe, it, expect } from "vitest";
import { normalizeTitle, pickTrailer } from "./normalizeTitle";

const movieFixture = {
  id: 550,
  title: "Fight Club",
  original_title: "Fight Club",
  tagline: "Mischief. Mayhem. Soap.",
  overview: "An insomniac office worker and a soap maker form an underground fight club.",
  release_date: "1999-10-15",
  runtime: 139,
  status: "Released",
  genres: [
    { id: 18, name: "Drama" },
    { id: 53, name: "Thriller" },
  ],
  vote_average: 8.4,
  vote_count: 26000,
  backdrop_path: "/backdrop.jpg",
  poster_path: "/poster.jpg",
  videos: {
    results: [
      { site: "YouTube", type: "Teaser", key: "teaserKey", official: false },
      { site: "YouTube", type: "Trailer", key: "officialKey", official: true },
    ],
  },
  credits: {
    // 15 cast members — normalizer should cap at 12.
    cast: Array.from({ length: 15 }, (_, i) => ({
      id: i,
      name: `Actor ${i}`,
      character: `Role ${i}`,
      profile_path: `/p${i}.jpg`,
    })),
  },
  recommendations: {
    results: [
      {
        id: 807,
        title: "Se7en",
        release_date: "1995-09-22",
        vote_average: 8.3,
        backdrop_path: "/se7en-b.jpg",
        poster_path: "/se7en-p.jpg",
      },
    ],
  },
  similar: { results: [] },
  "watch/providers": {
    results: {
      US: {
        link: "https://www.justwatch.com/us/movie/fight-club",
        flatrate: [{ provider_name: "Hulu", logo_path: "/hulu.jpg" }],
        rent: [{ provider_name: "Apple TV", logo_path: "/apple.jpg" }],
        buy: [],
      },
    },
  },
  release_dates: {
    results: [
      {
        iso_3166_1: "US",
        release_dates: [{ certification: "R" }],
      },
    ],
  },
};

const tvFixture = {
  id: 1399,
  name: "Game of Thrones",
  first_air_date: "2011-04-17",
  episode_run_time: [60],
  number_of_seasons: 8,
  number_of_episodes: 73,
  status: "Ended",
  genres: [{ id: 10765, name: "Sci-Fi & Fantasy" }],
  vote_average: 8.4,
  vote_count: 20000,
  backdrop_path: "/got-b.jpg",
  poster_path: "/got-p.jpg",
  videos: { results: [] },
  credits: { cast: [] },
  seasons: [
    { season_number: 0, name: "Specials", episode_count: 5 },
    { season_number: 1, name: "Season 1", episode_count: 10 },
    { season_number: 2, name: "Season 2", episode_count: 10 },
  ],
  recommendations: { results: [] },
  similar: {
    results: [
      { id: 1396, name: "Breaking Bad", first_air_date: "2008-01-20", vote_average: 8.9 },
    ],
  },
  content_ratings: {
    results: [{ iso_3166_1: "US", rating: "TV-MA" }],
  },
  "watch/providers": { results: {} },
};

describe("normalizeTitle — movie", () => {
  const t = normalizeTitle("movie", movieFixture);

  it("flattens core fields with a string id", () => {
    expect(t.id).toBe("550");
    expect(t.mediaType).toBe("movie");
    expect(t.title).toBe("Fight Club");
    expect(t.year).toBe("1999");
  });

  it("maps runtime and leaves TV-only fields null", () => {
    expect(t.runtime).toBe(139);
    expect(t.seasons).toBeNull();
    expect(t.episodes).toBeNull();
    expect(t.seasonList).toEqual([]);
  });

  it("flattens genre names", () => {
    expect(t.genres).toEqual(["Drama", "Thriller"]);
  });

  it("reads the US certification from release_dates", () => {
    expect(t.certification).toBe("R");
  });

  it("prefers the official YouTube trailer key", () => {
    expect(t.trailerKey).toBe("officialKey");
  });

  it("builds absolute image URLs at the right sizes", () => {
    expect(t.backdropPath).toBe("https://image.tmdb.org/t/p/original/backdrop.jpg");
    expect(t.posterPath).toBe("https://image.tmdb.org/t/p/w500/poster.jpg");
  });

  it("caps cast at 12", () => {
    expect(t.cast).toHaveLength(12);
    expect(t.cast[0]).toMatchObject({ id: "0", name: "Actor 0", character: "Role 0" });
  });

  it("maps watch providers and the JustWatch link", () => {
    expect(t.providers.link).toBe("https://www.justwatch.com/us/movie/fight-club");
    expect(t.providers.flatrate[0]).toEqual({
      name: "Hulu",
      logoPath: "https://image.tmdb.org/t/p/w92/hulu.jpg",
    });
    expect(t.providers.rent[0].name).toBe("Apple TV");
    expect(t.providers.buy).toEqual([]);
  });

  it("normalizes recommendations into cards", () => {
    expect(t.recommendations).toHaveLength(1);
    expect(t.recommendations[0]).toMatchObject({ id: "807", mediaType: "movie", title: "Se7en", year: "1995" });
  });
});

describe("normalizeTitle — tv", () => {
  const t = normalizeTitle("tv", tvFixture);

  it("uses the TV title, runtime, seasons and episode counts", () => {
    expect(t.mediaType).toBe("tv");
    expect(t.title).toBe("Game of Thrones");
    expect(t.runtime).toBe(60);
    expect(t.seasons).toBe(8);
    expect(t.episodes).toBe(73);
  });

  it("reads certification from content_ratings", () => {
    expect(t.certification).toBe("TV-MA");
  });

  it("excludes season 0 (specials) from seasonList", () => {
    expect(t.seasonList.map((s) => s.seasonNumber)).toEqual([1, 2]);
    expect(t.seasonList[0]).toEqual({ seasonNumber: 1, name: "Season 1", episodeCount: 10 });
  });

  it("falls back to 'similar' when recommendations are empty", () => {
    expect(t.recommendations).toHaveLength(1);
    expect(t.recommendations[0]).toMatchObject({ id: "1396", mediaType: "tv", title: "Breaking Bad" });
  });

  it("returns empty provider groups and a null link when none exist", () => {
    expect(t.providers).toEqual({ link: null, flatrate: [], rent: [], buy: [] });
  });
});

describe("pickTrailer", () => {
  it("prefers an official Trailer", () => {
    expect(
      pickTrailer([
        { site: "YouTube", type: "Trailer", key: "a", official: false },
        { site: "YouTube", type: "Trailer", key: "b", official: true },
      ])
    ).toBe("b");
  });

  it("falls back to a non-official Trailer over a Teaser", () => {
    expect(
      pickTrailer([
        { site: "YouTube", type: "Teaser", key: "teaser", official: true },
        { site: "YouTube", type: "Trailer", key: "trailer", official: false },
      ])
    ).toBe("trailer");
  });

  it("uses a Teaser when there is no Trailer", () => {
    expect(pickTrailer([{ site: "YouTube", type: "Teaser", key: "teaser" }])).toBe("teaser");
  });

  it("ignores non-YouTube videos", () => {
    expect(pickTrailer([{ site: "Vimeo", type: "Trailer", key: "v" }])).toBeNull();
  });

  it("returns null for an empty list", () => {
    expect(pickTrailer([])).toBeNull();
  });
});
