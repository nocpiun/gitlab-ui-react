import { describe, expect, it } from "vitest";
import { mergeAriaIds } from "./merge-aria-ids";

describe("mergeAriaIds", () => {
  it("merges, normalizes, and deduplicates ID reference lists", () => {
    expect(mergeAriaIds(" first   second ", undefined, "second third"))
      .toBe("first second third");
  });

  it("returns undefined when no IDs are provided", () => {
    expect(mergeAriaIds(undefined, "  ")).toBeUndefined();
  });
});
