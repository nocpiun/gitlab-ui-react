import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import GlBadge, { type GlBadgeVariant } from "./badge";

vi.mock("@gitlab/svgs/dist/icons.svg", () => ({ default: "/path/to/icons.svg" }));

const renderBadge = (
  props: ComponentProps<typeof GlBadge> = {},
  children: ReactNode = "Badge text",
) => renderToStaticMarkup(<GlBadge {...props}>{children}</GlBadge>);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GlBadge", () => {
  it("renders a neutral span badge with its content by default", () => {
    const markup = renderBadge({ id: "status-badge" });

    expect(markup).toContain("<span");
    expect(markup).toContain("class=\"gl-badge badge badge-pill badge-neutral\"");
    expect(markup).toContain("<span class=\"gl-badge-content\">Badge text</span>");
    expect(markup).toContain("id=\"status-badge\"");
    expect(markup).not.toContain("role=");
    expect(markup).not.toContain("!gl-px-2");
  });

  it.each([
    "neutral",
    "info",
    "success",
    "warning",
    "danger",
    "tier",
  ] as GlBadgeVariant[])("applies the %s variant class", (variant) => {
    expect(renderBadge({ variant })).toContain(`badge-${variant}`);
  });

  it("renders custom elements through the tag prop", () => {
    expect(renderBadge({ tag: "div" })).toContain("<div");
  });

  describe("with the icon prop", () => {
    it("renders a 16px icon by default", () => {
      const markup = renderBadge({ icon: "warning" });

      expect(markup).toContain("gl-badge-icon");
      expect(markup).toContain("s16");
      expect(markup).toContain("href=\"/path/to/icons.svg#warning\"");
    });

    it("renders a 12px icon for the sm icon size", () => {
      expect(renderBadge({ icon: "warning", iconSize: "sm" })).toContain("s12");
    });

    it("treats icon-only badges as images and shrinks the horizontal padding", () => {
      const markup = renderBadge({ "aria-label": "Due date", icon: "calendar" }, null);

      expect(markup).toContain("role=\"img\"");
      expect(markup).toContain("aria-label=\"Due date\"");
      expect(markup).toContain("!gl-px-2");
      expect(markup).not.toContain("gl-badge-content");
    });

    it("does not set the img role when content accompanies the icon", () => {
      const markup = renderBadge({ icon: "warning" });
      const rootTag = markup.slice(0, markup.indexOf(">"));

      expect(rootTag).not.toContain("role=");
      expect(markup).not.toContain("!gl-px-2");
    });

    it.each([
      [{ icon: "issue-open-m" }, true],
      [{ icon: "issue-close" }, true],
      [{ icon: "license", iconOpticallyAligned: true }, true],
      [{ icon: "license" }, false],
    ] as const)("aligns circular icons for %s", (props, expected) => {
      const markup = renderBadge(props);

      expect(markup.includes("-gl-ml-2")).toBe(expected);
    });

    it("warns when an icon-only badge has no aria-label", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      renderBadge({ icon: "calendar" }, null);

      expect(warn).toHaveBeenCalledWith(expect.stringContaining("[GlBadge]"));
    });

    it("does not warn when an icon-only badge has an aria-label", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      renderBadge({ "aria-label": "Due date", icon: "calendar" }, null);

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe("as a link", () => {
    it("renders an anchor and ignores the tag prop", () => {
      const markup = renderBadge({ href: "https://www.gitlab.com", tag: "div" });

      expect(markup).toContain("<a");
      expect(markup).toContain("href=\"https://www.gitlab.com\"");
      expect(markup).toContain("target=\"_self\"");
      expect(markup).not.toContain("<div");
    });

    it("passes link attributes through without link styling", () => {
      const markup = renderBadge({
        active: true,
        href: "https://www.gitlab.com",
        rel: "external",
        target: "_blank",
      });

      expect(markup).toContain("rel=\"external noopener noreferrer\"");
      expect(markup).toContain("target=\"_blank\"");
      expect(markup).toMatch(/class="[^"]*\bactive\b/);
      expect(markup).not.toContain("gl-link");
    });

    it("marks disabled links as inert", () => {
      const markup = renderBadge({ disabled: true, href: "https://www.gitlab.com" });

      expect(markup).toContain("aria-disabled=\"true\"");
      expect(markup).toContain("tabindex=\"-1\"");
      expect(markup).toMatch(/class="[^"]*\bdisabled\b/);
    });

    it("keeps the img role for icon-only link badges", () => {
      const markup = renderBadge(
        { "aria-label": "Scheduled", href: "https://www.gitlab.com", icon: "calendar" },
        null,
      );

      expect(markup).toContain("role=\"img\"");
    });
  });
});
