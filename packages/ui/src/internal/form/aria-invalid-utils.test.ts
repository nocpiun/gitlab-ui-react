import { describe, expect, it } from "vitest";
import { normalizeAriaInvalid } from "./aria-invalid-utils";

describe("normalizeAriaInvalid", () => {
  it.each([true, "true", ""] as const)("returns 'true' when ariaInvalid is %s", (ariaInvalid) => {
    expect(normalizeAriaInvalid(ariaInvalid, null)).toBe("true");
  });

  it("returns 'true' when state is false and ariaInvalid is unset", () => {
    expect(normalizeAriaInvalid(false, false)).toBe("true");
    expect(normalizeAriaInvalid(undefined, false)).toBe("true");
  });

  it("returns undefined by default", () => {
    expect(normalizeAriaInvalid(false, null)).toBeUndefined();
    expect(normalizeAriaInvalid(undefined, null)).toBeUndefined();
    expect(normalizeAriaInvalid(undefined, true)).toBeUndefined();
  });

  it.each(["false", "grammar", "spelling"] as const)("passes through %s", (ariaInvalid) => {
    expect(normalizeAriaInvalid(ariaInvalid, null)).toBe(ariaInvalid);
    expect(normalizeAriaInvalid(ariaInvalid, true)).toBe(ariaInvalid);
  });

  it("state=false forces 'true' unless ariaInvalid is explicitly true-ish", () => {
    expect(normalizeAriaInvalid(true, false)).toBe("true");
    expect(normalizeAriaInvalid("grammar", false)).toBe("true");
  });
});
