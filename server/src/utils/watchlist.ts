// Pure validation/normalization for watchlist requests, kept out of the
// controller so it can be unit-tested without a DB.

export type MediaType = "movie" | "tv";

export const isMediaType = (v: unknown): v is MediaType => v === "movie" || v === "tv";

// undefined / null / "" → null (no reminder / clear it). A valid date string or
// Date → a Date. Anything else throws so the caller can return a 400.
export function parseRemindAt(value: unknown): Date | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" && !(value instanceof Date)) {
    throw new Error("Invalid remindAt");
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid remindAt");
  return d;
}

export interface NormalizedAdd {
  mediaType: MediaType;
  titleId: string;
  title: string;
  posterPath?: string;
  remindAt: Date | null;
  remindTz?: string;
}

// Validate + normalize an "add to watchlist" body. Throws Error (with a
// user-safe message) on bad input.
export function normalizeAdd(body: Record<string, unknown> | undefined): NormalizedAdd {
  const b = body ?? {};
  if (!isMediaType(b.mediaType)) throw new Error("mediaType must be 'movie' or 'tv'");

  const titleId = String(b.titleId ?? "").trim();
  if (!titleId) throw new Error("titleId is required");

  const title = typeof b.title === "string" ? b.title.trim() : "";
  if (!title) throw new Error("title is required");

  const out: NormalizedAdd = {
    mediaType: b.mediaType,
    titleId,
    title,
    remindAt: parseRemindAt(b.remindAt),
  };

  if (typeof b.posterPath === "string" && b.posterPath.trim()) {
    out.posterPath = b.posterPath.trim();
  }
  if (typeof b.remindTz === "string" && b.remindTz.trim()) {
    out.remindTz = b.remindTz.trim();
  }
  return out;
}
