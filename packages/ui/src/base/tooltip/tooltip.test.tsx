import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import GlTooltip, {
  GlTooltipContent,
  GlTooltipTrigger,
  resolveTooltipBoundary,
  resolveTooltipContainer,
  type GlTooltipContentProps,
  type GlTooltipProps,
} from "./tooltip";
import { getGlTooltipDefaultContainer, setGlTooltipDefaultContainer } from "./container";

type RootProps = Omit<GlTooltipProps, "children">;

function renderTooltip(
  rootProps: RootProps = {},
  trigger: ReactElement = <button type="button">Tooltip</button>,
) {
  return renderToStaticMarkup(
    <GlTooltip {...rootProps}>
      <GlTooltipTrigger>{trigger}</GlTooltipTrigger>
      <GlTooltipContent>some tooltip text</GlTooltipContent>
    </GlTooltip>,
  );
}

afterEach(() => {
  setGlTooltipDefaultContainer(null);
  vi.unstubAllGlobals();
});

describe("GlTooltip", () => {
  it("renders the composed child element as the trigger", () => {
    const markup = renderTooltip();

    expect(markup).toContain("<button");
    expect(markup).toContain(">Tooltip</button>");
  });

  it("does not render the popup or tooltip description while closed", () => {
    const markup = renderTooltip();

    expect(markup).not.toContain("aria-describedby");
    expect(markup).not.toContain("role=\"tooltip\"");
    expect(markup).not.toContain("some tooltip text");
  });

  it("describes the trigger with a custom id when initially open", () => {
    const markup = renderTooltip({ defaultOpen: true, id: "my-tooltip" });

    expect(markup).toContain("aria-describedby=\"my-tooltip\"");
  });

  it("generates an id when initially open", () => {
    const markup = renderTooltip({ defaultOpen: true });

    expect(markup).toMatch(/aria-describedby="gl-tooltip-[^"]+"/);
  });

  it("lets the controlled open state override the uncontrolled default", () => {
    const openMarkup = renderTooltip({ id: "controlled-tooltip", open: true });
    const closedMarkup = renderTooltip({ defaultOpen: true, id: "controlled-tooltip", open: false });

    expect(openMarkup).toContain("aria-describedby=\"controlled-tooltip\"");
    expect(closedMarkup).not.toContain("aria-describedby");
  });

  it("preserves and deduplicates the trigger's existing descriptions", () => {
    const markup = renderTooltip(
      { defaultOpen: true, id: "my-tooltip" },
      <button aria-describedby="existing my-tooltip" type="button">Tooltip</button>,
    );

    expect(markup).toContain("aria-describedby=\"existing my-tooltip\"");
  });

  it("keeps an initially open tooltip closed when disabled", () => {
    const markup = renderTooltip({ defaultOpen: true, disabled: true, id: "my-tooltip" });

    expect(markup).not.toContain("aria-describedby");
    expect(markup).not.toContain("data-popup-open");
  });

  it("does not disable the composed trigger element", () => {
    const markup = renderTooltip({ disabled: true });

    expect(markup).not.toMatch(/<button[^>]*\sdisabled=""/);
    expect(markup).toContain("data-trigger-disabled=\"\"");
  });

  it("requires the trigger to be inside GlTooltip", () => {
    expect(() => renderToStaticMarkup(
      <GlTooltipTrigger>
        <button type="button">Tooltip</button>
      </GlTooltipTrigger>,
    )).toThrowError("GlTooltipTrigger must be used inside GlTooltip.");
  });

  it("requires the content to be inside GlTooltip", () => {
    expect(() => renderToStaticMarkup(
      <GlTooltipContent>Tooltip content</GlTooltipContent>,
    )).toThrowError("GlTooltipContent must be used inside GlTooltip.");
  });

  it("exposes popup element attributes on the content type", () => {
    expectTypeOf<GlTooltipContentProps["title"]>().toEqualTypeOf<string | undefined>();
  });
});

describe("tooltip positioning", () => {
  it("uses clipping ancestors by default", () => {
    expect(resolveTooltipBoundary()).toBe("clipping-ancestors");
  });

  it("maps the viewport boundary to an empty Floating UI boundary list", () => {
    expect(resolveTooltipBoundary("viewport")).toEqual([]);
  });

  it("passes an element boundary through", () => {
    const boundary = {} as Element;

    expect(resolveTooltipBoundary(boundary)).toBe(boundary);
  });
});

describe("tooltip default container", () => {
  it("can be cleared", () => {
    setGlTooltipDefaultContainer(null);

    expect(getGlTooltipDefaultContainer()).toBeNull();
    expect(resolveTooltipContainer(undefined)).toBeNull();
  });

  it("resolves a custom default container selector", () => {
    const element = {} as HTMLElement;
    const querySelector = vi.fn(() => element);
    vi.stubGlobal("document", { querySelector });
    setGlTooltipDefaultContainer("#custom-element");

    expect(resolveTooltipContainer(undefined)).toBe(element);
    expect(querySelector).toHaveBeenCalledWith("#custom-element");
  });

  it("returns null for an invalid selector", () => {
    vi.stubGlobal("document", {
      querySelector() {
        throw new DOMException("Invalid selector");
      },
    });

    expect(resolveTooltipContainer("[invalid")).toBeNull();
  });
});
