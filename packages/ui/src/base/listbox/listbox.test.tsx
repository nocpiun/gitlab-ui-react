import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import GlListbox, {
  GlListboxContent,
  GlListboxItem,
  GlListboxTrigger,
  resolveListboxOffset,
  resolveListboxPlacement,
  type GlListboxHandle,
  type GlListboxMultipleProps,
  type GlListboxSingleProps,
  type GlListboxValue,
} from "./listbox";
import {
  GlListboxGroup,
  GlListboxGroupLabel,
} from "./listbox-group";
import GlListboxSearchInput from "./listbox-search-input";

vi.mock("@gitlab/svgs/dist/icons.svg", () => ({ default: "/path/to/icons.svg" }));

describe("GlListbox", () => {
  it("renders listbox trigger semantics and default appearance", () => {
    const markup = renderToStaticMarkup(
      <GlListbox>
        <GlListboxTrigger>Select department</GlListboxTrigger>
      </GlListbox>,
    );

    expect(markup).toContain("gl-listbox gl-new-dropdown");
    expect(markup).toContain("gl-new-dropdown-toggle");
    expect(markup).toContain("aria-haspopup=\"listbox\"");
    expect(markup).toContain("aria-controls=\"gl-listbox-");
    expect(markup).toContain("btn-md btn-default");
    expect(markup).toContain("chevron-down-icon");
    expect(markup).not.toContain("aria-expanded=\"true\"");
  });

  it("applies trigger appearance, validation, and accessible icon-only props", () => {
    const markup = renderToStaticMarkup(
      <GlListbox state={false}>
        <GlListboxTrigger
          aria-label="Select project"
          block
          category="tertiary"
          icon="project"
          noCaret
          size="small" />
      </GlListbox>,
    );

    expect(markup).toContain("btn-default-tertiary");
    expect(markup).toContain("btn-sm");
    expect(markup).toContain("btn-block");
    expect(markup).toContain("gl-new-dropdown-icon-only");
    expect(markup).toContain("gl-new-dropdown-toggle-no-caret");
    expect(markup).toContain("is-invalid");
    expect(markup).toContain("aria-invalid=\"true\"");
  });

  it("warns when trigger naming attributes conflict", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const markup = renderToStaticMarkup(
      <GlListbox>
        <GlListboxTrigger
          aria-label="Ignored"
          aria-labelledby="external-label"
          icon="project"
          noCaret />
      </GlListbox>,
    );

    expect(warning).toHaveBeenCalledOnce();
    expect(markup).toContain("aria-labelledby=\"external-label\"");
    expect(markup).not.toContain("aria-label=\"Ignored\"");
    warning.mockRestore();
  });

  it.each([
    ["right-start", { align: "start", side: "right" }],
    ["bottom-start", { align: "start", side: "bottom" }],
    ["bottom-end", { align: "end", side: "bottom" }],
    ["bottom", { align: "center", side: "bottom" }],
    ["left", { align: "start", side: "bottom" }],
    ["center", { align: "center", side: "bottom" }],
    ["right", { align: "end", side: "bottom" }],
  ] as const)("maps the %s placement", (placement, expected) => {
    expect(resolveListboxPlacement(placement)).toEqual(expected);
  });

  it("maps numeric and object offsets", () => {
    expect(resolveListboxOffset(12)).toEqual({ alignOffset: 0, sideOffset: 12 });
    expect(resolveListboxOffset({ crossAxis: -3, mainAxis: 5 })).toEqual({
      alignOffset: -3,
      sideOffset: 5,
    });
    const { alignOffset, sideOffset } = resolveListboxOffset({
      alignmentAxis: 7,
      mainAxis: 9,
    });
    expect(sideOffset).toBe(9);
    expect(typeof alignOffset).toBe("function");
    if(typeof alignOffset === "function") {
      const dimensions = {
        anchor: { height: 20, width: 40 },
        positioner: { height: 100, width: 248 },
        side: "bottom" as const,
      };
      expect(alignOffset({ ...dimensions, align: "start" })).toBe(7);
      expect(alignOffset({ ...dimensions, align: "end" })).toBe(-7);
    }
  });

  it("warns when match-trigger and fluid widths conflict", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderToStaticMarkup(
      <GlListbox defaultOpen>
        <GlListboxTrigger>Width</GlListboxTrigger>
        <GlListboxContent fluidWidth panelMatchTriggerWidth>
          <GlListboxItem value="one">One</GlListboxItem>
        </GlListboxContent>
      </GlListbox>,
    );

    expect(warning).toHaveBeenCalledWith(expect.stringContaining("takes precedence"));
    warning.mockRestore();
  });

  it("renders the search input as a controlled combobox", () => {
    const markup = renderToStaticMarkup(
      <GlListboxSearchInput
        aria-label="Find a department"
        clearLabel="Clear departments"
        value="eng" />,
    );

    expect(markup).toContain("role=\"combobox\"");
    expect(markup).toContain("type=\"search\"");
    expect(markup).toContain("value=\"eng\"");
    expect(markup).toContain("aria-label=\"Find a department\"");
    expect(markup).toContain("aria-label=\"Clear departments\"");
  });

  it("disables the clear action with the search input", () => {
    const markup = renderToStaticMarkup(
      <GlListboxSearchInput disabled value="eng" />,
    );

    expect(markup).toMatch(/<input[^>]*disabled=""/);
    expect(markup).toMatch(/<button[^>]*aria-disabled="true"/);
  });

  it("accepts groups, null values, and the complete imperative contract", () => {
    const handle = createRef<GlListboxHandle>();
    renderToStaticMarkup(
      <GlListbox ref={handle} defaultValue={null}>
        <GlListboxTrigger>Selection</GlListboxTrigger>
        <GlListboxContent>
          <GlListboxGroup>
            <GlListboxGroupLabel textSrOnly>Fallbacks</GlListboxGroupLabel>
            <GlListboxItem value={null}>None</GlListboxItem>
          </GlListboxGroup>
        </GlListboxContent>
      </GlListbox>,
    );

    expectTypeOf<GlListboxValue>().toEqualTypeOf<string | number | null>();
    expectTypeOf<GlListboxHandle>().toMatchTypeOf<{
      close(): void;
      closeAndFocus(): void;
      containsElement(element: Element | null): boolean;
      open(): void;
    }>();
  });

  it("exposes a discriminated single and multiple selection API", () => {
    expectTypeOf<GlListboxSingleProps["multiple"]>().toEqualTypeOf<false | undefined>();
    expectTypeOf<GlListboxMultipleProps["multiple"]>().toEqualTypeOf<true>();
    expectTypeOf<GlListboxMultipleProps["value"]>()
      .toEqualTypeOf<GlListboxValue[] | undefined>();
  });
});
