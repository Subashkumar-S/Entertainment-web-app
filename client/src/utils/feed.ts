import { RegularDataItem } from "../types";

export type FeedMediaType = "movie" | "tv";

// Tag raw TMDB results with a known media_type so the card shows the right
// icon/label and links to the correct details route. Results that already carry
// a media_type (e.g. the blended /recommended feed) keep theirs.
export const tag = (
  results: RegularDataItem[],
  mediaType: FeedMediaType
): RegularDataItem[] =>
  results.map((item) => ({
    ...item,
    media_type: (item.media_type as FeedMediaType) || mediaType,
  }));

// Drop repeated ids, keeping the first occurrence (so personalized picks win
// over the generic popular feed when both contain a title).
export const dedupeById = (items: RegularDataItem[]): RegularDataItem[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = String(item.id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

// Home grid: personalized seed recommendations first, then the blended popular
// feed as a fallback so the row is never empty, de-duplicated end to end.
export const blendRecommendations = (
  personalized: RegularDataItem[],
  recommended: RegularDataItem[]
): RegularDataItem[] => dedupeById([...personalized, ...recommended]);
