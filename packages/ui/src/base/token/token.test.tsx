import { createRef, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, expectTypeOf, it } from "vitest";
import GlToken, { type GlTokenProps, type GlTokenVariant } from "./token";

const renderToken = (props: Partial<ComponentProps<typeof GlToken>> = {}) => (
  renderToStaticMarkup(<GlToken {...props}>Token content</GlToken>)
);

describe("GlToken", () => {
  it("renders the default token and accessible remove button", () => {
    const markup = renderToken();

    expect(markup).toContain("class=\"gl-token\"");
    expect(markup).toContain("class=\"gl-token-content\"");
    expect(markup).toContain("Token content");
    expect(markup).toContain("aria-label=\"Remove\"");
    expect(markup).toContain("gl-token-close");
    expect(markup).toContain("data-testid=\"close-icon\"");
    expect(markup).toContain("<path");
  });

  it.each([
    ["default", ""],
    ["search-type", "gl-token-search-type-variant"],
    ["search-value", "gl-token-search-value-variant"],
  ] as const)("renders the %s variant", (variant, expectedClass) => {
    const markup = renderToken({ variant });

    if(expectedClass) expect(markup).toContain(expectedClass);
    else expect(markup).not.toContain("gl-token-search-");
  });

  it("uses a custom remove label", () => {
    expect(renderToken({ removeLabel: "Remove assignee" }))
      .toContain("aria-label=\"Remove assignee\"");
  });

  it("hides the remove action in view-only mode", () => {
    const markup = renderToken({ viewOnly: true });

    expect(markup).toContain("gl-token-view-only");
    expect(markup).not.toContain("gl-token-close");
    expect(markup).not.toContain("<button");
  });

  it("forwards native span attributes and merges presentation props", () => {
    const markup = renderToStaticMarkup(
      <GlToken
        className="custom-token"
        data-testid="token"
        id="token-id"
        style={{ color: "red" }}
        title="Details">
        Token content
      </GlToken>,
    );

    expect(markup).toContain("class=\"gl-token custom-token\"");
    expect(markup).toContain("data-testid=\"token\"");
    expect(markup).toContain("id=\"token-id\"");
    expect(markup).toContain("style=\"color:red\"");
    expect(markup).toContain("title=\"Details\"");
  });

  it("exports the fixed variant and span-ref contracts", () => {
    const ref = createRef<HTMLSpanElement>();
    const props: ComponentProps<typeof GlToken> = { ref, variant: "search-value" };

    expectTypeOf<GlTokenVariant>()
      .toEqualTypeOf<"default" | "search-type" | "search-value">();
    expectTypeOf(props).toMatchTypeOf<GlTokenProps>();
  });
});
