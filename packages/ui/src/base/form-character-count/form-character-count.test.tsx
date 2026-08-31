import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlFormCharacterCount from "./form-character-count";

const remainingCountText = (count: number) => (
  count === 1 ? `${count} character remaining.` : `${count} characters remaining.`
);
const overLimitText = (count: number) => (
  count === 1 ? `${count} character over limit.` : `${count} characters over limit.`
);

const defaultProps: ComponentProps<typeof GlFormCharacterCount> = {
  limit: 10,
  countTextId: "character-count-text",
  remainingCountText,
  overLimitText,
};

const renderCount = (props: Partial<ComponentProps<typeof GlFormCharacterCount>> = {}) => (
  renderToStaticMarkup(<GlFormCharacterCount {...defaultProps} {...props} />)
);

describe("GlFormCharacterCount", () => {
  describe("rendering", () => {
    it("renders the visible count in an aria-hidden small element", () => {
      const markup = renderCount({ value: "a".repeat(5) });

      expect(markup).toMatch(/<small[^>]*aria-hidden="true"/);
      expect(markup).toMatch(/<small[^>]*class="[^"]*form-text[^"]*gl-text-subtle[^"]*"/);
    });

    it("renders the screen-reader-only live region with the given id", () => {
      const markup = renderCount();

      expect(markup).toMatch(/<div[^>]*id="character-count-text"/);
      expect(markup).toMatch(/<div[^>]*aria-live="polite"/);
      expect(markup).toMatch(/<div[^>]*class="[^"]*gl-sr-only[^"]*"/);
      expect(markup).toContain("data-testid=\"count-text-sr-only\"");
    });
  });

  describe("when the character count is under the limit", () => {
    it("displays the remaining characters", () => {
      const markup = renderCount({ value: "a".repeat(5) });

      // Visible text and the initial screen-reader-only text
      expect(markup.match(/5 characters remaining\./g)).toHaveLength(2);
    });
  });

  describe("when the character count equals the limit", () => {
    it("displays zero remaining characters without the over-limit styling", () => {
      const markup = renderCount({ value: "a".repeat(10) });

      expect(markup).toContain("0 characters remaining.");
      expect(markup).not.toContain("gl-text-danger");
    });
  });

  describe("when the character count is over the limit", () => {
    it("displays the number of characters over with the danger class", () => {
      const markup = renderCount({ value: "a".repeat(15) });

      expect(markup.match(/5 characters over limit\./g)).toHaveLength(2);
      expect(markup).toMatch(/<small[^>]*class="[^"]*gl-text-danger[^"]*"/);
      expect(markup).not.toMatch(/<small[^>]*class="[^"]*gl-text-subtle[^"]*"/);
    });

    it("uses the singular render prop result for a single character", () => {
      const markup = renderCount({ value: "a".repeat(11) });

      expect(markup).toContain("1 character over limit.");
    });
  });

  describe("when the value is null", () => {
    it("counts it as empty", () => {
      const markup = renderCount({ value: null });

      expect(markup.match(/10 characters remaining\./g)).toHaveLength(2);
    });
  });
});
