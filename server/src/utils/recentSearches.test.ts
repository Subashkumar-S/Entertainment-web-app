import { describe, it, expect } from "vitest";
import { mergeRecent } from "./recentSearches";

describe("mergeRecent", () => {
  it("puts the newest query first", () => {
    expect(mergeRecent(["batman", "joker"], "dune", 8)).toEqual(["dune", "batman", "joker"]);
  });

  it("trims the incoming query", () => {
    expect(mergeRecent([], "  dune  ", 8)).toEqual(["dune"]);
  });

  it("moves a repeated query to the front without duplicating it", () => {
    expect(mergeRecent(["batman", "joker"], "joker", 8)).toEqual(["joker", "batman"]);
  });

  it("de-duplicates case-insensitively", () => {
    expect(mergeRecent(["Batman"], "batman", 8)).toEqual(["batman"]);
  });

  it("caps the list at max, dropping the oldest", () => {
    const existing = ["a", "b", "c"];
    expect(mergeRecent(existing, "new", 3)).toEqual(["new", "a", "b"]);
  });
});
