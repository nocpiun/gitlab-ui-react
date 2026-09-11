import { describe, expect, it } from "vitest";
import {
  mapOverlayOpenChangeDetails,
  mapOverlayOpenChangeReason,
} from "./overlay-utils";

describe("overlay lifecycle adapters", () => {
  it.each([
    ["trigger-focus", "trigger"],
    ["trigger-hover", "trigger"],
    ["trigger-press", "trigger"],
    ["outside-press", "outside"],
    ["escape-key", "escape"],
    ["close-watcher", "escape"],
    ["item-press", "item"],
    ["close-press", "close"],
    ["focus-out", "focus-out"],
    ["disabled", "disabled"],
    ["imperative-action", "imperative"],
    ["none", "imperative"],
  ] as const)("maps %s to %s", (reason, expected) => {
    expect(mapOverlayOpenChangeReason(reason)).toBe(expected);
  });

  it("preserves the source event", () => {
    const event = new Event("click");

    expect(mapOverlayOpenChangeDetails({ event, reason: "trigger-press" })).toEqual({
      event,
      reason: "trigger",
    });
  });
});
