import { describe, it, expect } from "vitest";
import { parseRemindAt, normalizeAdd, isMediaType } from "./watchlist";

describe("isMediaType", () => {
  it("accepts movie and tv only", () => {
    expect(isMediaType("movie")).toBe(true);
    expect(isMediaType("tv")).toBe(true);
    expect(isMediaType("film")).toBe(false);
    expect(isMediaType(undefined)).toBe(false);
  });
});

describe("parseRemindAt", () => {
  it("treats undefined / null / empty string as no reminder", () => {
    expect(parseRemindAt(undefined)).toBeNull();
    expect(parseRemindAt(null)).toBeNull();
    expect(parseRemindAt("")).toBeNull();
  });

  it("parses a valid ISO string to a Date", () => {
    const d = parseRemindAt("2026-07-01T18:30:00.000Z");
    expect(d).toBeInstanceOf(Date);
    expect((d as Date).toISOString()).toBe("2026-07-01T18:30:00.000Z");
  });

  it("passes a Date through unchanged", () => {
    const input = new Date("2026-07-01T18:30:00.000Z");
    expect(parseRemindAt(input)).toEqual(input);
  });

  it("throws on an unparseable value", () => {
    expect(() => parseRemindAt("not-a-date")).toThrow();
    expect(() => parseRemindAt(12345)).toThrow();
  });
});

describe("normalizeAdd", () => {
  const base = { mediaType: "movie", titleId: "550", title: "Fight Club" };

  it("normalizes a minimal valid body", () => {
    expect(normalizeAdd(base)).toEqual({
      mediaType: "movie",
      titleId: "550",
      title: "Fight Club",
      remindAt: null,
    });
  });

  it("trims titleId, title, posterPath and remindTz", () => {
    const out = normalizeAdd({
      mediaType: "tv",
      titleId: "  1399 ",
      title: "  Game of Thrones ",
      posterPath: " /poster.jpg ",
      remindTz: " Asia/Kolkata ",
    });
    expect(out.titleId).toBe("1399");
    expect(out.title).toBe("Game of Thrones");
    expect(out.posterPath).toBe("/poster.jpg");
    expect(out.remindTz).toBe("Asia/Kolkata");
  });

  it("parses remindAt when present", () => {
    const out = normalizeAdd({ ...base, remindAt: "2026-07-01T18:30:00.000Z" });
    expect((out.remindAt as Date).toISOString()).toBe("2026-07-01T18:30:00.000Z");
  });

  it("rejects a bad media type", () => {
    expect(() => normalizeAdd({ ...base, mediaType: "film" })).toThrow(/mediaType/);
  });

  it("requires titleId and title", () => {
    expect(() => normalizeAdd({ mediaType: "movie", title: "X" })).toThrow(/titleId/);
    expect(() => normalizeAdd({ mediaType: "movie", titleId: "1" })).toThrow(/title/);
  });

  it("coerces a numeric titleId to a string", () => {
    expect(normalizeAdd({ mediaType: "movie", titleId: 550, title: "Fight Club" }).titleId).toBe("550");
  });

  it("omits posterPath / remindTz when blank", () => {
    const out = normalizeAdd({ ...base, posterPath: "   ", remindTz: "" });
    expect(out.posterPath).toBeUndefined();
    expect(out.remindTz).toBeUndefined();
  });
});
