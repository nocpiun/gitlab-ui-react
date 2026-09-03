import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("combines supported class name values", () => {
    expect(cn("base", ["nested", null], { enabled: true, disabled: false })).toBe(
      "base nested enabled",
    );
  });

  it("omits falsey class name values", () => {
    expect(cn(undefined, null, false, "", "visible")).toBe("visible");
  });
});
