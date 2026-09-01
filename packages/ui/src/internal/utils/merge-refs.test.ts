import { createRef, type RefObject } from "react";
import { describe, expect, it, vi } from "vitest";
import { mergeRefs } from "./merge-refs";

describe("mergeRefs", () => {
  it("forwards the element to object refs", () => {
    const ref = createRef<HTMLInputElement>();
    const element = {} as HTMLInputElement;

    mergeRefs(ref)(element);

    expect(ref.current).toBe(element);
  });

  it("forwards the element to callback refs", () => {
    const callback = vi.fn();
    const element = {} as HTMLInputElement;

    mergeRefs<HTMLInputElement>(callback)(element);

    expect(callback).toHaveBeenCalledWith(element);
  });

  it("forwards the element to every ref in order", () => {
    const first = createRef<HTMLInputElement>();
    const second = vi.fn();
    const third = createRef<HTMLInputElement>();
    const element = {} as HTMLInputElement;

    mergeRefs<HTMLInputElement>(first, second, undefined, third)(element);

    expect(first.current).toBe(element);
    expect(second).toHaveBeenCalledWith(element);
    expect(third.current).toBe(element);
  });

  it("forwards null on detach", () => {
    const ref = createRef<HTMLInputElement>() as RefObject<HTMLInputElement>;
    const callback = vi.fn();
    const element = {} as HTMLInputElement;
    const merged = mergeRefs<HTMLInputElement>(ref, callback);

    merged(element);
    merged(null);

    expect(ref.current).toBeNull();
    expect(callback).toHaveBeenLastCalledWith(null);
  });
});
