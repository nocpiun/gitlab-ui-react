/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/alert/alert.spec.js
 *
 * Focus management and click events are covered by Storybook play
 * functions, since unit tests run in a node environment.
 */

import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import GlAlert, { type GlAlertVariant } from "./alert";

vi.mock("@gitlab/svgs/dist/icons.svg", () => ({ default: "/path/to/icons.svg" }));

const renderAlert = (
  props: ComponentProps<typeof GlAlert> = {},
  children: ReactNode = "Alert message",
) => renderToStaticMarkup(<GlAlert {...props}>{children}</GlAlert>);

describe("GlAlert", () => {
  describe("by default", () => {
    it("renders the info variant icon", () => {
      const markup = renderAlert();

      expect(markup).toContain("class=\"gl-icon s16 gl-fill-current gl-alert-icon\"");
      expect(markup).toContain("data-testid=\"information-o-icon\"");
    });

    it("renders a dismiss button with the default label", () => {
      const markup = renderAlert();

      expect(markup).toContain("gl-dismiss-btn");
      expect(markup).toContain("aria-label=\"Dismiss\"");
    });

    it("does not render a title", () => {
      expect(renderAlert()).not.toContain("gl-alert-title");
    });

    it("does not render any actions", () => {
      expect(renderAlert()).not.toContain("gl-alert-actions");
    });

    it("renders the body content", () => {
      expect(renderAlert()).toContain("<div class=\"gl-alert-body\">Alert message</div>");
    });

    it("renders the status role with polite aria-live and tabindex -1", () => {
      const markup = renderAlert();

      expect(markup).toContain("role=\"status\"");
      expect(markup).toContain("aria-live=\"polite\"");
      expect(markup).toContain("tabindex=\"-1\"");
    });
  });

  describe("variant", () => {
    it.each([
      ["success", "check-circle"],
      ["warning", "warning"],
      ["danger", "error"],
      ["info", "information-o"],
      ["tip", "bulb"],
    ] as [GlAlertVariant, string][])("renders the %s icon", (variant, iconName) => {
      expect(renderAlert({ variant })).toContain(`data-testid="${iconName}-icon"`);
    });

    it.each([
      ["danger", "alert"],
      ["warning", "alert"],
      ["success", "alert"],
      ["info", "status"],
      ["tip", "status"],
    ] as [GlAlertVariant, string][])("uses the %s role for the %s variant", (variant, role) => {
      expect(renderAlert({ variant })).toContain(`role="${role}"`);
    });

    it.each([
      "danger",
      "info",
      "success",
      "tip",
      "warning",
    ] as GlAlertVariant[])("applies the gl-alert-%s class", (variant) => {
      expect(renderAlert({ variant })).toContain(`gl-alert gl-alert-${variant}`);
    });
  });

  describe("dismissible", () => {
    it("does not render a dismiss button and adds the not-dismissible class when false", () => {
      const markup = renderAlert({ dismissible: false });

      expect(markup).not.toContain("gl-dismiss-btn");
      expect(markup).toContain("gl-alert-not-dismissible");
    });

    it("does not add the not-dismissible class by default", () => {
      expect(renderAlert()).not.toContain("gl-alert-not-dismissible");
    });

    it("uses a custom dismiss label", () => {
      expect(renderAlert({ dismissLabel: "Close alert" })).toContain("aria-label=\"Close alert\"");
    });
  });

  describe("title", () => {
    it("renders the title in an h2 by default", () => {
      const markup = renderAlert({ title: "foo" });

      expect(markup).toContain("<h2 class=\"gl-alert-title\">foo</h2>");
    });

    it("renders the heading level from headerLevel", () => {
      expect(renderAlert({ headerLevel: 3, title: "foo" })).toContain(
        "<h3 class=\"gl-alert-title\">foo</h3>",
      );
    });

    it("adds the gl-alert-has-title class only when a title is present", () => {
      expect(renderAlert({ title: "foo" })).toContain("gl-alert-has-title");
      expect(renderAlert()).not.toContain("gl-alert-has-title");
    });
  });

  describe("actions", () => {
    it("renders a primary confirm button from primaryButtonText", () => {
      const markup = renderAlert({ primaryButtonText: "foo" });

      expect(markup).toContain("gl-alert-actions");
      expect(markup).toContain("<button type=\"button\" tabindex=\"0\" aria-disabled=\"false\" class=\"btn gl-button btn-md btn-confirm gl-alert-action\">");
      expect(markup).toContain("<span class=\"gl-button-text\">foo</span>");
    });

    it("renders the primary button as a link given primaryButtonLink", () => {
      const markup = renderAlert({ primaryButtonLink: "#foo", primaryButtonText: "foo" });

      expect(markup).toContain("<a");
      expect(markup).toContain("href=\"#foo\"");
    });

    it("renders a secondary default button from secondaryButtonText", () => {
      const markup = renderAlert({ secondaryButtonText: "bar" });

      expect(markup).toContain("btn gl-button btn-md btn-default btn-default-secondary gl-alert-action");
      expect(markup).toContain("<span class=\"gl-button-text\">bar</span>");
    });

    it("renders the secondary button as a link given secondaryButtonLink", () => {
      const markup = renderAlert({ secondaryButtonLink: "#bar", secondaryButtonText: "bar" });

      expect(markup).toContain("href=\"#bar\"");
    });

    it("renders both buttons when both texts are given", () => {
      const markup = renderAlert({ primaryButtonText: "foo", secondaryButtonText: "bar" });

      expect(markup).toContain("<span class=\"gl-button-text\">foo</span>");
      expect(markup).toContain("<span class=\"gl-button-text\">bar</span>");
    });

    it("renders actions content instead of the action buttons", () => {
      const markup = renderAlert({
        actions: <p>dummy</p>,
        primaryButtonText: "foo",
      });

      expect(markup).toContain("<div class=\"gl-alert-actions\"><p>dummy</p></div>");
      expect(markup).not.toContain("gl-alert-action\"");
    });
  });

  describe("sticky", () => {
    it("adds the sticky class when sticky", () => {
      expect(renderAlert({ sticky: true })).toContain("gl-alert-sticky");
    });

    it("does not add the sticky class by default", () => {
      expect(renderAlert()).not.toContain("gl-alert-sticky");
    });
  });

  describe("politeness", () => {
    it("sets a custom aria-live value", () => {
      expect(renderAlert({ politeness: "assertive" })).toContain("aria-live=\"assertive\"");
    });
  });

  describe("element props", () => {
    it("merges a consumer className", () => {
      expect(renderAlert({ className: "gl-mb-5" })).toContain("gl-alert gl-alert-info gl-mb-5");
    });
  });
});
