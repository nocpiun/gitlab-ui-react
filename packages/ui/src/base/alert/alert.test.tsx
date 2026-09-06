/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/alert/alert.spec.js
 *
 * Focus management and click events are covered by Storybook play
 * functions, since unit tests run in a node environment.
 */

import {
  Fragment,
  createRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import GlButton from "../button/button";
import GlAlert, {
  GlAlertActions,
  GlAlertDescription,
  type GlAlertVariant,
} from "./alert";

vi.mock("@gitlab/svgs/dist/icons.svg", () => ({ default: "/path/to/icons.svg" }));

const defaultContent = <GlAlertDescription>Alert message</GlAlertDescription>;

const renderAlert = (
  props: Partial<ComponentProps<typeof GlAlert>> = {},
  children: ReactNode = defaultContent,
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

    it("renders the description content", () => {
      expect(renderAlert()).toContain(
        "<div class=\"gl-alert-body\">Alert message</div>",
      );
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
      expect(renderAlert({ dismissLabel: "Close alert" })).toContain(
        "aria-label=\"Close alert\"",
      );
    });
  });

  describe("title", () => {
    it("renders the string title in an h2 by default", () => {
      const markup = renderAlert({ title: "foo" });

      expect(markup).toContain("<h2 class=\"gl-alert-title\">foo</h2>");
    });

    it("renders the heading level from headerLevel", () => {
      expect(renderAlert({ headerLevel: 3, title: "foo" })).toContain(
        "<h3 class=\"gl-alert-title\">foo</h3>",
      );
    });

    it("adds the gl-alert-has-title class only for a non-empty title", () => {
      expect(renderAlert({ title: "foo" })).toContain("gl-alert-has-title");
      expect(renderAlert()).not.toContain("gl-alert-has-title");
      expect(renderAlert({ title: "" })).not.toContain("gl-alert-has-title");
    });
  });

  describe("compound parts", () => {
    it("renders description and actions with their structural classes", () => {
      const markup = renderAlert({}, (
        <>
          <GlAlertDescription><p>Alert message</p></GlAlertDescription>
          <GlAlertActions>
            <GlButton category="primary" variant="confirm">Primary action</GlButton>
          </GlAlertActions>
        </>
      ));

      expect(markup).toContain(
        "<div class=\"gl-alert-body\"><p>Alert message</p></div>",
      );
      expect(markup).toContain("<div class=\"gl-alert-actions\">");
      expect(markup).toContain("btn-confirm");
      expect(markup).toContain("Primary action");
    });

    it("renders composed button and link actions", () => {
      const markup = renderAlert({}, (
        <GlAlertActions>
          <GlButton category="primary" variant="confirm">Retry</GlButton>
          <GlButton href="#cancel" variant="default">Cancel</GlButton>
        </GlAlertActions>
      ));

      expect(markup).toContain("btn-confirm");
      expect(markup).toContain("Retry");
      expect(markup).toContain("href=\"#cancel\"");
      expect(markup).toContain("Cancel");
    });

    it("allows every compound part to be omitted", () => {
      expect(renderAlert({}, null)).toContain("<div class=\"gl-alert-content\"></div>");
      expect(renderAlert({}, (
        <GlAlertDescription>Description</GlAlertDescription>
      ))).toContain("Description");
      expect(renderAlert({}, <GlAlertActions>Actions</GlAlertActions>)).toContain("Actions");
    });

    it("supports arrays, Fragments, and conditional children", () => {
      const showDescription = true;
      const showActions = true;
      const hideExtraActions = false;
      const markup = renderAlert({}, [
        <Fragment key="content">
          {showDescription && (
            <GlAlertDescription>Description</GlAlertDescription>
          )}
          {hideExtraActions && <GlAlertActions>Hidden actions</GlAlertActions>}
        </Fragment>,
        showActions ? <GlAlertActions key="actions">Actions</GlAlertActions> : null,
      ]);

      expect(markup).toContain("Description");
      expect(markup).toContain("Actions");
      expect(markup).not.toContain("Hidden actions");
    });

    it("rejects duplicate compound parts", () => {
      const duplicateParts = [
        {
          children: (
            <>
              <GlAlertDescription>One</GlAlertDescription>
              <GlAlertDescription>Two</GlAlertDescription>
            </>
          ),
          name: "GlAlertDescription",
        },
        {
          children: (
            <>
              <GlAlertActions>One</GlAlertActions>
              <GlAlertActions>Two</GlAlertActions>
            </>
          ),
          name: "GlAlertActions",
        },
      ];

      for(const part of duplicateParts) {
        expect(() => renderAlert({}, part.children)).toThrowError(
          `GlAlert accepts at most one ${part.name} child.`,
        );
      }
    });

    it("rejects unsupported direct children", () => {
      function WrappedDescription() {
        return <GlAlertDescription>Wrapped description</GlAlertDescription>;
      }

      const invalidChildren = [
        "Direct text",
        <div key="native">Native element</div>,
        <WrappedDescription key="wrapped" />,
      ];

      for(const child of invalidChildren) {
        expect(() => renderAlert({}, child)).toThrowError(
          "GlAlert only accepts GlAlertDescription and GlAlertActions as direct children. "
          + "Arrays, Fragments, and conditional children are supported.",
        );
      }
    });

    it("renders the title first and preserves the compound part order", () => {
      const markup = renderAlert({ title: "Title" }, (
        <>
          <GlAlertActions>Actions</GlAlertActions>
          <GlAlertDescription>Description</GlAlertDescription>
        </>
      ));

      expect(markup.indexOf("Title")).toBeLessThan(markup.indexOf("Actions"));
      expect(markup.indexOf("Actions")).toBeLessThan(markup.indexOf("Description"));
    });

    it("passes native attributes and merges consumer classes on every part", () => {
      const markup = renderToStaticMarkup(
        <GlAlert className="custom-alert" id="system-alert">
          <GlAlertDescription className="custom-description" lang="en">
            Description
          </GlAlertDescription>
          <GlAlertActions className="custom-actions" aria-label="Alert actions">
            Actions
          </GlAlertActions>
        </GlAlert>,
      );

      expect(markup).toContain("gl-alert gl-alert-info custom-alert");
      expect(markup).toContain("id=\"system-alert\"");
      expect(markup).toContain("lang=\"en\"");
      expect(markup).toContain("gl-alert-body custom-description");
      expect(markup).toContain("aria-label=\"Alert actions\"");
      expect(markup).toContain("gl-alert-actions custom-actions");
    });

    it("accepts refs for the root and every compound part", () => {
      const alertRef = createRef<HTMLDivElement>();
      const descriptionRef = createRef<HTMLDivElement>();
      const actionsRef = createRef<HTMLDivElement>();

      expect(() => renderToStaticMarkup(
        <GlAlert ref={alertRef}>
          <GlAlertDescription ref={descriptionRef}>Description</GlAlertDescription>
          <GlAlertActions ref={actionsRef}>Actions</GlAlertActions>
        </GlAlert>,
      )).not.toThrow();
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
      expect(renderAlert({ className: "gl-mb-5" })).toContain(
        "gl-alert gl-alert-info gl-mb-5",
      );
    });
  });
});
