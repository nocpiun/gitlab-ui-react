import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import GlFormTextarea, { type GlFormTextareaSize } from "./form-textarea";
import { observeVisibility, resetVisibilityObserver } from "./visible";

describe("GlFormTextarea", () => {
  const renderTextarea = (
    props: Partial<ComponentProps<typeof GlFormTextarea>> = {},
  ) => renderToStaticMarkup(<GlFormTextarea {...props} />);

  describe("defaults", () => {
    it("renders the native textarea with the upstream classes and defaults", () => {
      const markup = renderTextarea();

      expect(markup).toMatch(/^<textarea/);
      expect(markup).toContain("class=\"gl-form-input gl-form-textarea form-control\"");
      expect(markup).toContain("rows=\"4\"");
      expect(markup).toContain("style=\"resize:none\"");
      expect(markup).toMatch(/id="gl-form-textarea-[^"]+"/);
      expect(markup).not.toContain("aria-invalid");
      expect(markup).not.toContain("aria-required");
    });

    it("renders the controlled value and treats null as empty", () => {
      expect(renderTextarea({ value: "Description" })).toContain(">Description</textarea>");
      expect(renderTextarea({ value: null })).toContain("></textarea>");
    });

    it("generates an ID and omits upstream-empty optional attributes", () => {
      const markup = renderTextarea({
        autoComplete: "",
        form: "",
        id: "",
        name: "",
        placeholder: "",
      });

      expect(markup).toMatch(/id="gl-form-textarea-[^"]+"/);
      expect(markup).not.toContain("autoComplete=");
      expect(markup).not.toContain(" form=");
      expect(markup).not.toContain(" name=");
      expect(markup).not.toContain(" placeholder=");
    });
  });

  describe("rows and resize", () => {
    it.each([
      [10, "10"],
      ["6", "6"],
      [1, "2"],
      [-10, "2"],
    ])("normalizes rows=%s to %s", (rows, expectedRows) => {
      expect(renderTextarea({ rows })).toContain(`rows="${expectedRows}"`);
    });

    it("keeps fixed rows when maxRows is less than or equal to rows", () => {
      expect(renderTextarea({ maxRows: 5, rows: 10 })).toContain("rows=\"10\"");
      expect(renderTextarea({ maxRows: 5, rows: 5 })).toContain("rows=\"5\"");
    });

    it("enables automatic height when maxRows exceeds rows", () => {
      const markup = renderTextarea({ maxRows: 10, rows: 2 });

      expect(markup).not.toContain("rows=");
      expect(markup).toContain("style=\"resize:none;overflow-y:scroll\"");
    });

    it("does not add an inline resize rule when resizing is enabled", () => {
      expect(renderTextarea({ noResize: false })).not.toContain("style=");
    });

    it("lets component-owned resize behavior override a consumer style", () => {
      const markup = renderTextarea({
        style: { height: 100, resize: "horizontal" },
      });

      expect(markup).toContain("height:100px");
      expect(markup).toContain("resize:none");
    });
  });

  describe("character count", () => {
    it("wraps and associates the textarea when characterCountLimit is set", () => {
      const markup = renderTextarea({
        characterCountLimit: 10,
        remainingCharacterCountText: "10 characters remaining.",
      });
      const describedBy = markup.match(/aria-describedby="([^"]+)"/)?.[1];

      expect(markup).toMatch(/^<div><textarea/);
      expect(describedBy).toMatch(/^form-textarea-character-count-/);
      expect(markup).toContain(`id="${describedBy}"`);
      expect(markup.match(/10 characters remaining\./g)).toHaveLength(2);
    });

    it("renders the over-limit value prop through GlFormCharacterCount", () => {
      const markup = renderTextarea({
        characterCountLimit: 10,
        characterCountOverLimitText: "1 character over limit.",
        remainingCharacterCountText: "0 characters remaining.",
        value: "a".repeat(11),
      });

      expect(markup.match(/1 character over limit\./g)).toHaveLength(2);
      expect(markup).toContain("form-text gl-text-danger");
      expect(markup).not.toContain("0 characters remaining.");
    });

    it("preserves a consumer aria-describedby value without a character count", () => {
      expect(renderTextarea({ "aria-describedby": "help-text" }))
        .toContain("aria-describedby=\"help-text\"");
    });
  });

  describe("classes and state", () => {
    it("merges className and every supported textareaClasses shape", () => {
      const markup = renderTextarea({
        className: "consumer-class",
        textareaClasses: ["rounded", { bordered: true, hidden: false }],
      });

      expect(markup).toContain(
        "class=\"gl-form-input gl-form-textarea form-control rounded bordered consumer-class\"",
      );
    });

    it.each([
      ["sm", "form-control-sm"],
      ["lg", "form-control-lg"],
    ] as [GlFormTextareaSize, string][])("applies the %s size class", (size, expectedClass) => {
      expect(renderTextarea({ size })).toContain(expectedClass);
    });

    it.each([
      [true, "is-valid", false],
      [false, "is-invalid", true],
      [null, null, false],
    ] as const)("maps state=%s to validation classes and ARIA", (state, expectedClass, invalid) => {
      const markup = renderTextarea({ state });

      if(expectedClass) expect(markup).toContain(expectedClass);
      else expect(markup).not.toMatch(/is-(?:in)?valid/);
      expect(markup.includes("aria-invalid=\"true\"")).toBe(invalid);
    });

    it("normalizes explicit ariaInvalid values", () => {
      expect(renderTextarea({ ariaInvalid: "spelling" }))
        .toContain("aria-invalid=\"spelling\"");
      expect(renderTextarea({ ariaInvalid: true }))
        .toContain("aria-invalid=\"true\"");
    });
  });

  it("forwards native attributes to the textarea", () => {
    const markup = renderTextarea({
      autoComplete: "off",
      disabled: true,
      form: "issue-form",
      maxLength: 2048,
      name: "description",
      placeholder: "Enter a description",
      readOnly: true,
      required: true,
      title: "Issue description",
    });

    for(const attribute of [
      "autoComplete=\"off\"",
      "disabled",
      "form=\"issue-form\"",
      "maxLength=\"2048\"",
      "name=\"description\"",
      "placeholder=\"Enter a description\"",
      "readOnly=\"\"",
      "required=\"\"",
      "aria-required=\"true\"",
      "title=\"Issue description\"",
    ]) {
      expect(markup).toContain(attribute);
    }
  });

  describe("visibility observer", () => {
    afterEach(() => {
      resetVisibilityObserver();
      vi.unstubAllGlobals();
    });

    it("shares the upstream observer, invokes intersecting handlers, and detaches cleanly", () => {
      const observe = vi.fn();
      const unobserve = vi.fn();
      const disconnect = vi.fn();
      const callbacks: IntersectionObserverCallback[] = [];
      const options: IntersectionObserverInit[] = [];

      class MockIntersectionObserver {
        constructor(callback: IntersectionObserverCallback, init: IntersectionObserverInit) {
          callbacks.push(callback);
          options.push(init);
        }

        disconnect = disconnect;
        observe = observe;
        takeRecords = () => [];
        unobserve = unobserve;
        root = null;
        rootMargin = "640px";
        thresholds = [0];
      }

      vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
      const firstElement = {} as Element;
      const secondElement = {} as Element;
      const firstHandler = vi.fn();
      const secondHandler = vi.fn();
      const detachFirst = observeVisibility(firstElement, firstHandler);
      observeVisibility(secondElement, secondHandler);

      expect(callbacks).toHaveLength(1);
      expect(options).toEqual([{ rootMargin: "640px" }]);
      expect(observe).toHaveBeenCalledTimes(2);

      callbacks[0]([
        { isIntersecting: false, target: firstElement } as IntersectionObserverEntry,
        { isIntersecting: true, target: secondElement } as IntersectionObserverEntry,
      ], {} as IntersectionObserver);
      expect(firstHandler).not.toHaveBeenCalled();
      expect(secondHandler).toHaveBeenCalledOnce();

      detachFirst();
      expect(unobserve).toHaveBeenCalledWith(firstElement);
      callbacks[0]([
        { isIntersecting: true, target: firstElement } as IntersectionObserverEntry,
      ], {} as IntersectionObserver);
      expect(firstHandler).not.toHaveBeenCalled();

      resetVisibilityObserver();
      expect(disconnect).toHaveBeenCalledOnce();
    });
  });
});
