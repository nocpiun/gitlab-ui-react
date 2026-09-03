/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/banner/banner.spec.js
 *
 * Click callbacks are covered by Storybook play functions because unit tests
 * run in a node environment.
 */

import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import GlBanner from "./banner";

vi.mock("@gitlab/svgs/dist/icons.svg", () => ({ default: "/path/to/icons.svg" }));

const defaultProps = {
  buttonLink: "https://gitlab.com",
  buttonText: "Upgrade your plan",
  title: "Upgrade to activate Service Desk",
} satisfies ComponentProps<typeof GlBanner>;

const renderBanner = (
  props: Partial<ComponentProps<typeof GlBanner>> = {},
  children: ReactNode = "Banner message",
) => renderToStaticMarkup(
  <GlBanner {...defaultProps} {...props}>{children}</GlBanner>,
);

describe("GlBanner", () => {
  describe("promotion", () => {
    it("renders the title and message", () => {
      const markup = renderBanner();

      expect(markup).toContain(`<h2 class="gl-banner-title">${defaultProps.title}</h2>`);
      expect(markup).toContain("Banner message");
    });

    it("renders the card structure and promotion classes", () => {
      const markup = renderBanner();

      expect(markup).toContain("gl-card gl-banner gl-py-6 gl-pl-6 gl-pr-8");
      expect(markup).toContain("gl-card-body gl-flex gl-bg-transparent !gl-p-0");
      expect(markup).not.toContain("gl-banner-introduction");
    });

    it("renders the primary action as a confirm link", () => {
      const markup = renderBanner();

      expect(markup).toContain("data-testid=\"gl-banner-primary-button\"");
      expect(markup).toContain("class=\"btn gl-button btn-md btn-confirm\"");
      expect(markup).toContain(`href="${defaultProps.buttonLink}"`);
      expect(markup).toContain(`<span class="gl-button-text">${defaultProps.buttonText}</span>`);
    });

    it("renders the primary action as a button without a link", () => {
      const markup = renderBanner({ buttonLink: null });

      expect(markup).toContain("<button");
      expect(markup).not.toContain("<a ");
    });

    it("passes buttonAttributes to the primary action", () => {
      const markup = renderBanner({
        buttonAttributes: {
          className: "custom-action",
          target: "_blank",
        },
      });

      expect(markup).toContain("btn-confirm custom-action");
      expect(markup).toContain("target=\"_blank\"");
      expect(markup).toContain("rel=\"noopener noreferrer\"");
    });

    it("renders the dismiss action with the default accessible label", () => {
      const markup = renderBanner();

      expect(markup).toContain("gl-banner-close");
      expect(markup).toContain("aria-label=\"Dismiss\"");
      expect(markup).toContain("data-testid=\"close-icon\"");
    });

    it("uses a custom dismiss label", () => {
      expect(renderBanner({ dismissLabel: "Close banner" })).toContain(
        "aria-label=\"Close banner\"",
      );
    });

    it("does not render an illustration region", () => {
      const markup = renderBanner();

      expect(markup).not.toContain("gl-banner-illustration");
      expect(markup).not.toContain("<img");
    });
  });

  describe("introduction", () => {
    it("adds the introduction class", () => {
      expect(renderBanner({ variant: "introduction" })).toContain(
        "gl-banner-introduction",
      );
    });
  });

  describe("actions", () => {
    it("renders custom actions after the primary action", () => {
      const markup = renderBanner({
        actions: <span>Ask again later</span>,
        buttonLink: null,
      });

      expect(markup).toContain(
        "</button><span>Ask again later</span>",
      );
    });
  });

  describe("element props", () => {
    it("passes native attributes and merges a consumer className", () => {
      const markup = renderBanner({ className: "gl-mb-5", id: "upgrade-banner" });

      expect(markup).toContain("gl-pr-8 gl-mb-5");
      expect(markup).toContain("id=\"upgrade-banner\"");
    });
  });
});
