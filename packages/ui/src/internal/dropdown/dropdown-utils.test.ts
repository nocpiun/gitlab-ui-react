import type { GlDropdownOffset } from "./dropdown-types";
import { describe, expect, it } from "vitest";
import { resolveDropdownOffset } from "./dropdown-utils";

const dimensions = {
  anchor: { height: 20, width: 40 },
  positioner: { height: 100, width: 248 },
  side: "bottom" as const,
};

function resolveAlignOffset(
  offset: GlDropdownOffset,
  align: "start" | "center" | "end",
): number {
  const { alignOffset } = resolveDropdownOffset(offset);
  expect(alignOffset).toBeTypeOf("function");
  if(typeof alignOffset !== "function") throw new Error("Expected an offset function.");
  return alignOffset({ ...dimensions, align });
}

describe("resolveDropdownOffset", () => {
  it("maps numeric offsets to the side axis", () => {
    expect(resolveDropdownOffset(12)).toEqual({ alignOffset: 0, sideOffset: 12 });
  });

  it("maps main-axis offsets to the side axis", () => {
    expect(resolveDropdownOffset({ mainAxis: 9 }).sideOffset).toBe(9);
  });

  it("preserves physical cross-axis offsets for every alignment", () => {
    const offset = { crossAxis: -3, mainAxis: 5 };

    expect(resolveDropdownOffset(offset).sideOffset).toBe(5);
    expect(resolveAlignOffset(offset, "start")).toBe(-3);
    expect(resolveAlignOffset(offset, "center")).toBe(-3);
    expect(resolveAlignOffset(offset, "end")).toBe(3);
  });

  it("uses alignment-axis overrides only for aligned placements", () => {
    const offset = { alignmentAxis: 10, crossAxis: 3, mainAxis: 8 };

    expect(resolveDropdownOffset(offset).sideOffset).toBe(8);
    expect(resolveAlignOffset(offset, "start")).toBe(10);
    expect(resolveAlignOffset(offset, "end")).toBe(10);
    expect(resolveAlignOffset(offset, "center")).toBe(3);
    expect(resolveAlignOffset({ alignmentAxis: 10 }, "center")).toBe(0);
  });
});
