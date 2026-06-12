import { describe, it, expect } from "vitest";
import { tag, dedupeById, blendRecommendations } from "./feed";
import { RegularDataItem } from "../types";

const item = (id: number, extra: Partial<RegularDataItem> = {}): RegularDataItem =>
  ({ id, ...extra } as RegularDataItem);

describe("tag", () => {
  it("stamps the given media_type onto untagged results", () => {
    const tagged = tag([item(1), item(2)], "movie");
    expect(tagged.map((i) => i.media_type)).toEqual(["movie", "movie"]);
  });

  it("keeps an existing media_type (e.g. from the blended feed)", () => {
    const tagged = tag([item(1, { media_type: "tv" }), item(2)], "movie");
    expect(tagged.map((i) => i.media_type)).toEqual(["tv", "movie"]);
  });

  it("does not mutate the input items", () => {
    const input = item(1);
    tag([input], "movie");
    expect(input.media_type).toBeUndefined();
  });
});

describe("dedupeById", () => {
  it("removes later duplicates, keeping the first occurrence", () => {
    const deduped = dedupeById([item(1, { title: "first" }), item(1, { title: "second" }), item(2)]);
    expect(deduped.map((i) => i.id)).toEqual([1, 2]);
    expect(deduped[0].title).toBe("first");
  });

  it("treats numeric and string ids as the same id", () => {
    const deduped = dedupeById([item(1), { id: "1" } as RegularDataItem]);
    expect(deduped).toHaveLength(1);
  });
});

describe("blendRecommendations", () => {
  it("puts personalized picks before the popular feed and de-dupes overlap", () => {
    const personalized = [item(10), item(20)];
    const recommended = [item(20), item(30)];
    const blended = blendRecommendations(personalized, recommended);
    expect(blended.map((i) => i.id)).toEqual([10, 20, 30]);
  });

  it("falls back to the popular feed when there are no personalized picks", () => {
    const blended = blendRecommendations([], [item(1), item(2)]);
    expect(blended.map((i) => i.id)).toEqual([1, 2]);
  });
});
