import { describe, it, expect } from "vitest";
import { fillDailySeries, summarize, DailyActivityRow } from "./insights";

const NOW = new Date("2026-06-12T12:00:00Z");

describe("fillDailySeries", () => {
  it("returns one dense, oldest-first point per day in the window", () => {
    const series = fillDailySeries([], 14, NOW);
    expect(series).toHaveLength(14);
    expect(series[0].date).toBe("2026-05-30");
    expect(series[13].date).toBe("2026-06-12");
    expect(series.every((p) => p.total === 0)).toBe(true);
  });

  it("buckets counts by day and type and computes totals", () => {
    const rows: DailyActivityRow[] = [
      { day: "2026-06-12", type: "view", count: 3 },
      { day: "2026-06-12", type: "search", count: 2 },
      { day: "2026-06-11", type: "bookmark", count: 1 },
    ];
    const series = fillDailySeries(rows, 14, NOW);
    const today = series[13];
    expect(today).toMatchObject({ date: "2026-06-12", view: 3, search: 2, bookmark: 0, total: 5 });
    const yesterday = series[12];
    expect(yesterday).toMatchObject({ date: "2026-06-11", bookmark: 1, total: 1 });
  });

  it("ignores days outside the window and unknown types", () => {
    const rows: DailyActivityRow[] = [
      { day: "2026-01-01", type: "view", count: 99 },
      { day: "2026-06-12", type: "bogus", count: 5 },
    ];
    const series = fillDailySeries(rows, 7, NOW);
    expect(series.reduce((s, p) => s + p.total, 0)).toBe(0);
  });
});

describe("summarize", () => {
  it("fills all three keys, defaulting missing types to 0", () => {
    expect(summarize([{ _id: "view", count: 4 }, { _id: "bookmark", count: 2 }])).toEqual({
      view: 4,
      search: 0,
      bookmark: 2,
    });
  });

  it("ignores unexpected group ids", () => {
    expect(summarize([{ _id: "weird", count: 9 }])).toEqual({ view: 0, search: 0, bookmark: 0 });
  });
});
