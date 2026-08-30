import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlButton from "../button/button";
import GlButtonGroup from "./button-group";

const renderButtonGroup = (
  props: ComponentProps<typeof GlButtonGroup> = {},
  children: ReactNode = <GlButton>Button</GlButton>,
) => renderToStaticMarkup(<GlButtonGroup {...props}>{children}</GlButtonGroup>);

describe("GlButtonGroup", () => {
  it("renders a horizontal button group by default", () => {
    const markup = renderButtonGroup();

    expect(markup).toContain("<div class=\"gl-button-group btn-group\" role=\"group\">");
    expect(markup).toContain("<button");
    expect(markup).toContain("Button");
  });

  it("renders a vertical button group", () => {
    const markup = renderButtonGroup({ vertical: true });

    expect(markup).toContain("class=\"gl-button-group-vertical btn-group-vertical\"");
    expect(markup).not.toContain("class=\"gl-button-group btn-group\"");
  });

  it("renders arbitrary children in their original order", () => {
    const markup = renderButtonGroup({}, (
      <>
        <GlButton>First</GlButton>
        <GlButton>Second</GlButton>
        <GlButton>Third</GlButton>
      </>
    ));

    expect(markup.indexOf("First")).toBeLessThan(markup.indexOf("Second"));
    expect(markup.indexOf("Second")).toBeLessThan(markup.indexOf("Third"));
  });

  it("merges custom classes and forwards native div attributes", () => {
    const markup = renderButtonGroup({
      "aria-describedby": "group-help",
      className: "custom-group",
      id: "actions",
      title: "Grouped actions",
    });

    expect(markup).toContain("class=\"gl-button-group btn-group custom-group\"");
    expect(markup).toContain("aria-describedby=\"group-help\"");
    expect(markup).toContain("id=\"actions\"");
    expect(markup).toContain("title=\"Grouped actions\"");
  });
});
