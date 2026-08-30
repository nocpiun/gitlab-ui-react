import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import GlTooltip from "./tooltip";
import { getGlTooltipDefaultContainer, setGlTooltipDefaultContainer } from "./container";

const renderTooltip = (props: Partial<ComponentProps<typeof GlTooltip>> = {}) => renderToStaticMarkup(
  <GlTooltip title="some tooltip text" {...props}>
    <button type="button">Tooltip</button>
  </GlTooltip>,
);

afterEach(() => {
  setGlTooltipDefaultContainer(null);
});

describe("GlTooltip", () => {
  it("renders the child element as the trigger", () => {
    const markup = renderTooltip();

    expect(markup).toContain("<button");
    expect(markup).toContain(">Tooltip</button>");
  });

  it("does not render the popup or aria-describedby while closed", () => {
    const markup = renderTooltip();

    expect(markup).not.toContain("aria-describedby");
    expect(markup).not.toContain("role=\"tooltip\"");
    expect(markup).not.toContain("some tooltip text");
  });

  it("passes the id to nothing while closed", () => {
    const markup = renderTooltip({ id: "my-tooltip" });

    expect(markup).not.toContain("my-tooltip");
  });
});

describe("tooltip default container", () => {
  it("is unset by default", () => {
    expect(getGlTooltipDefaultContainer()).toBeNull();
  });

  it("respects a custom default container", () => {
    setGlTooltipDefaultContainer("#custom-element");

    expect(getGlTooltipDefaultContainer()).toBe("#custom-element");
  });
});
