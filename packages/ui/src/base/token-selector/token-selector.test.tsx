import { createRef, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, expectTypeOf, it } from "vitest";
import GlTokenSelector, {
  type GlTokenSelectorInputProps,
  type GlTokenSelectorItem,
  type GlTokenSelectorItemId,
  type GlTokenSelectorProps,
} from "./token-selector";
import { getAvailableItems, tokenSelectorItemKey } from "./token-selector-helpers";

const selectedItems: GlTokenSelectorItem[] = [
  { id: 1, name: "One", owner: "GitLab" },
  { id: "2", name: "Two", className: "custom-token", style: { color: "red" } },
];

const renderSelector = (props: GlTokenSelectorProps = {}) => renderToStaticMarkup(
  <GlTokenSelector aria-label="Projects" {...props} />,
);

describe("GlTokenSelector", () => {
  it("renders an uncontrolled selector with selected tokens", () => {
    const markup = renderSelector({ defaultValue: selectedItems });

    expect(markup).toContain("gl-token-selector gl-form-input");
    expect(markup).toContain("role=\"combobox\"");
    expect(markup).toContain("aria-label=\"Projects\"");
    expect(markup).toContain("aria-autocomplete=\"list\"");
    expect(markup).toContain("aria-controls=\"token-selector-");
    expect(markup).toContain("aria-expanded=\"false\"");
    expect(markup).toContain("One");
    expect(markup).toContain("Two");
    expect(markup).toContain("custom-token");
    expect(markup).toContain("color:red");
  });

  it("uses a controlled value instead of the uncontrolled default", () => {
    const markup = renderSelector({
      defaultValue: [{ id: "default", name: "Default" }],
      value: [{ id: "controlled", name: "Controlled" }],
    });

    expect(markup).toContain("Controlled");
    expect(markup).not.toContain(">Default<");
  });

  it("applies validation state to the container and input", () => {
    const invalidMarkup = renderSelector({ state: false });
    const validMarkup = renderSelector({ state: true });

    expect(invalidMarkup).toContain("is-invalid");
    expect(invalidMarkup).toContain("aria-invalid=\"true\"");
    expect(validMarkup).toContain("is-valid");
    expect(validMarkup).not.toContain("aria-invalid");
  });

  it("makes the input and tokens view-only while retaining clear all", () => {
    const markup = renderSelector({
      allowClearAll: true,
      defaultValue: selectedItems,
      viewOnly: true,
    });

    expect(markup).toContain("gl-token-selector-view-only");
    expect(markup).toMatch(/<input[^>]*disabled=""/);
    expect(markup).toContain("gl-token-view-only");
    expect(markup).not.toContain("gl-token-close");
    expect(markup).toContain("aria-label=\"Clear all\"");
  });

  it("merges supported native input presentation and data attributes", () => {
    const markup = renderSelector({
      autoComplete: "email",
      className: "custom-selector",
      id: "project-selector",
      inputProps: {
        className: "custom-input",
        "data-testid": "selector-input",
        name: "projects",
        style: { minWidth: 120 },
      },
      placeholder: "Choose a project",
    });

    expect(markup).toContain("custom-selector");
    expect(markup).toContain("custom-input");
    expect(markup).toContain("data-testid=\"selector-input\"");
    expect(markup).toContain("id=\"project-selector\"");
    expect(markup).toContain("name=\"projects\"");
    expect(markup).toContain("min-width:120px");
    expect(markup).toContain("placeholder=\"Choose a project\"");
    expect(markup).toContain("autoComplete=\"email\"");
  });

  it("lets aria-labelledby take precedence over aria-label", () => {
    const markup = renderToStaticMarkup(
      <GlTokenSelector
        aria-label="Ignored"
        aria-labelledby="selector-label" />,
    );

    expect(markup).toContain("aria-labelledby=\"selector-label\"");
    expect(markup).not.toContain("aria-label=\"Ignored\"");
  });

  it("supports custom token content and additional item fields", () => {
    const markup = renderSelector({
      defaultValue: selectedItems,
      renderToken: (item) => <strong>{String(item.owner ?? item.name)}</strong>,
    });

    expect(markup).toContain("<strong>GitLab</strong>");
    expect(markup).toContain("<strong>Two</strong>");
  });

  it("renders the empty placeholder only while idle without tokens", () => {
    expect(renderSelector({ emptyPlaceholder: <span>No projects</span> }))
      .toContain("No projects");
    expect(renderSelector({
      defaultValue: selectedItems,
      emptyPlaceholder: <span>No projects</span>,
    })).not.toContain("No projects");
  });

  it("excludes selected candidates by strictly equal IDs", () => {
    const available = getAvailableItems(
      [
        { id: 1, name: "Number" },
        { id: "1", name: "String" },
        { id: 2, name: "Other" },
      ],
      [{ id: 1, name: "Selected" }],
    );

    expect(available.map(({ id }) => id)).toEqual(["1", 2]);
  });

  it("creates stable keys that preserve the ID type", () => {
    expect(tokenSelectorItemKey({ id: 1, name: "Before" })).toBe("number:1");
    expect(tokenSelectorItemKey({ id: 1, name: "After" })).toBe("number:1");
    expect(tokenSelectorItemKey({ id: "1" })).toBe("string:1");
  });

  it("exports fixed item, input, callback, and input-ref contracts", () => {
    const ref = createRef<HTMLInputElement>();
    const item: GlTokenSelectorItem = { id: 1, name: "One", custom: true };
    const inputProps: GlTokenSelectorInputProps = { "data-source": "test", name: "tokens" };
    const props: ComponentProps<typeof GlTokenSelector> = { inputProps, ref, value: [item] };

    expectTypeOf<GlTokenSelectorItemId>().toEqualTypeOf<string | number>();
    expectTypeOf(item).toMatchTypeOf<GlTokenSelectorItem>();
    expectTypeOf(props.onValueChange)
      .toEqualTypeOf<((value: GlTokenSelectorItem[]) => void) | undefined>();
  });
});
