/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/accordion/accordion.spec.js
 * packages/gitlab-ui/src/components/base/accordion/accordion_item.spec.js
 *
 * Browser interactions and sibling auto-collapse are covered by the
 * colocated Storybook play functions.
 */

import type { ComponentProps } from "react";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import GlAccordion, { GlAccordionItem } from "./accordion";

vi.mock("@gitlab/svgs/dist/icons.svg", () => ({ default: "/path/to/icons.svg" }));

const renderAccordion = (
  itemProps: Partial<ComponentProps<typeof GlAccordionItem>> = {},
  accordionProps: Partial<ComponentProps<typeof GlAccordion>> = {},
) => renderToStaticMarkup(
  <GlAccordion headerLevel={3} {...accordionProps}>
    <GlAccordionItem title="Item 1" value="item-1" {...itemProps}>
      Accordion content
    </GlAccordionItem>
  </GlAccordion>,
);

describe("GlAccordion", () => {
  it("renders the accordion container and passes native attributes", () => {
    const markup = renderAccordion({}, { className: "custom-accordion", id: "details" });

    expect(markup).toContain("class=\"gl-accordion custom-accordion\"");
    expect(markup).toContain("id=\"details\"");
  });

  it("provides the default heading level to items", () => {
    expect(renderAccordion({}, { headerLevel: 4 })).toMatch(
      /<h4[^>]*class="gl-accordion-item-header"/u,
    );
  });
});

describe("GlAccordionItem", () => {
  it("renders an accessible collapsed trigger and its content", () => {
    const markup = renderAccordion();
    const panelId = markup.match(/aria-controls="([^"]+)"/u)?.[1];

    expect(markup).toContain("aria-expanded=\"false\"");
    expect(panelId).toBeDefined();
    expect(markup).toContain(`id="${panelId}"`);
    expect(markup).toContain("data-testid=\"accordion-item-collapse-item-1\"");
    expect(markup).toContain("Accordion content");
    expect(markup).toContain("data-testid=\"chevron-right-icon\"");
  });

  it("generates the panel ID independently from the item value", () => {
    const markup = renderAccordion({ value: "release notes" });
    const panelId = markup.match(/aria-controls="([^"]+)"/u)?.[1];

    expect(panelId).toBeDefined();
    expect(panelId).not.toContain("release notes");
    expect(panelId).not.toMatch(/\s/u);
    expect(markup).toContain(`id="${panelId}"`);
  });

  it("renders the visible title and expanded state when controlled open", () => {
    const markup = renderAccordion({
      titleVisible: "Item 1 expanded",
      visible: true,
    });

    expect(markup).toContain("aria-expanded=\"true\"");
    expect(markup).toContain("Item 1 expanded");
    expect(markup).not.toContain(">Item 1</span>");
  });

  it("supports an uncontrolled initially visible item", () => {
    expect(renderAccordion({ defaultVisible: true })).toContain("aria-expanded=\"true\"");
  });

  it("allows an item to override the inherited heading level", () => {
    const markup = renderAccordion({ headerLevel: 5 }, { headerLevel: 2 });

    expect(markup).toMatch(
      /<h5[^>]*class="gl-accordion-item-header"/u,
    );
    expect(markup).not.toContain("<h2");
  });

  it.each([
    "custom-header",
    ["custom-header"],
    { "custom-header": true },
  ])("merges clsx-compatible header classes", (headerClass) => {
    expect(renderAccordion({ headerClass })).toContain(
      "class=\"gl-accordion-item-header custom-header\"",
    );
  });

  it("passes native attributes and merges its outer className", () => {
    const markup = renderAccordion({ className: "custom-item", id: "first-item" });

    expect(markup).toContain("class=\"gl-accordion-item custom-item\"");
    expect(markup).toContain("id=\"first-item\"");
  });

  it("accepts a container ref", () => {
    const ref = createRef<HTMLDivElement>();

    expect(() => renderToStaticMarkup(
      <GlAccordion headerLevel={3}>
        <GlAccordionItem ref={ref} title="Item 1">Content</GlAccordionItem>
      </GlAccordion>,
    )).not.toThrow();
  });
});
