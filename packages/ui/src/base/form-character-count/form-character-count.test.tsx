import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlFormCharacterCount from "./form-character-count";

describe("GlFormCharacterCount", () => {
  const defaultProps = {
    countTextId: "character-count-text",
    limit: 10,
    overLimitText: "1 character over limit.",
    remainingCountText: "10 characters remaining.",
  } satisfies ComponentProps<typeof GlFormCharacterCount>;

  const renderCharacterCount = (
    props: Partial<ComponentProps<typeof GlFormCharacterCount>> = {},
  ) => renderToStaticMarkup(<GlFormCharacterCount {...defaultProps} {...props} />);

  it("renders remaining text visibly and in the polite live region", () => {
    const markup = renderCharacterCount();

    expect(markup.match(/10 characters remaining\./g)).toHaveLength(2);
    expect(markup).toContain(
      "<small class=\"form-text gl-text-subtle\" aria-hidden=\"true\">",
    );
    expect(markup).toContain(
      "<div id=\"character-count-text\" class=\"gl-sr-only\" aria-live=\"polite\" data-testid=\"count-text-sr-only\">",
    );
  });

  it("continues to use remaining text when the value is exactly at the limit", () => {
    const markup = renderCharacterCount({
      remainingCountText: "0 characters remaining.",
      value: "a".repeat(10),
    });

    expect(markup.match(/0 characters remaining\./g)).toHaveLength(2);
    expect(markup).toContain("form-text gl-text-subtle");
    expect(markup).not.toContain("1 character over limit.");
  });

  it("renders over-limit text with the danger class", () => {
    const markup = renderCharacterCount({ value: "a".repeat(11) });

    expect(markup.match(/1 character over limit\./g)).toHaveLength(2);
    expect(markup).toContain("form-text gl-text-danger");
    expect(markup).not.toContain("10 characters remaining.");
  });

  it.each([undefined, null])("treats a %s value as empty", (value) => {
    expect(renderCharacterCount({ value }).match(/10 characters remaining\./g)).toHaveLength(2);
  });

  it("accepts renderable values through the two named text props", () => {
    const markup = renderCharacterCount({
      remainingCountText: <strong>Characters are available.</strong>,
    });

    expect(markup.match(/<strong>Characters are available\.<\/strong>/g)).toHaveLength(2);
  });

  it("passes root attributes through and merges className with the component marker", () => {
    const markup = renderCharacterCount({
      className: "consumer-class",
      title: "Character count",
    });

    expect(markup).toMatch(
      /^<div title="Character count" class="gl-form-character-count consumer-class">/,
    );
  });
});
