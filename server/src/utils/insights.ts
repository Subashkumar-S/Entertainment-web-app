// Pure shaping helpers for the insights dashboard, separated from the Mongo
// aggregation I/O so the date-bucketing logic can be unit-tested.

export type EventType = "view" | "search" | "bookmark";

export interface DailyActivityRow {
    day: string; // "YYYY-MM-DD" (UTC, matching Mongo's $dateToString default)
    type: string;
    count: number;
}

export interface DailyPoint {
    date: string;
    view: number;
    search: number;
    bookmark: number;
    total: number;
}

// Expand sparse per-(day,type) aggregation rows into a dense series covering the
// last `days` calendar days (UTC), oldest first, zero-filling missing days/types.
export const fillDailySeries = (
    rows: DailyActivityRow[],
    days: number,
    now: Date = new Date()
): DailyPoint[] => {
    const byDay = new Map<string, { view: number; search: number; bookmark: number }>();

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setUTCDate(d.getUTCDate() - i);
        byDay.set(d.toISOString().slice(0, 10), { view: 0, search: 0, bookmark: 0 });
    }

    for (const row of rows) {
        const bucket = byDay.get(row.day);
        if (!bucket) continue; // outside the window
        if (row.type === "view" || row.type === "search" || row.type === "bookmark") {
            bucket[row.type] += row.count;
        }
    }

    return Array.from(byDay, ([date, c]) => ({
        date,
        ...c,
        total: c.view + c.search + c.bookmark,
    }));
};

// Turn the by-type count rows into a complete summary with all three keys present.
export const summarize = (rows: { _id: string; count: number }[]): Record<EventType, number> => {
    const summary: Record<EventType, number> = { view: 0, search: 0, bookmark: 0 };
    for (const row of rows) {
        if (row._id === "view" || row._id === "search" || row._id === "bookmark") {
            summary[row._id] = row.count;
        }
    }
    return summary;
};
