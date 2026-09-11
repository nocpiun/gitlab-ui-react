/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/banner/banner.spec.js
 *
 * Click callbacks are covered by Storybook play functions because unit tests
 * run in a node environment.
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
import GlBanner, {
  GlBannerActions,
  GlBannerDescription,
  GlBannerTitle,
} from "./banner";

vi.mock("@gitlab/svgs/dist/icons.svg", () => ({ default: "/path/to/icons.svg" }));

const defaultContent = (
  <>
    <GlBannerTitle>Upgrade to activate Service Desk</GlBannerTitle>
    <GlBannerDescription>
      <p>Banner message</p>
    </GlBannerDescription>
    <GlBannerActions>
      <GlButton category="primary" variant="confirm">Upgrade your plan</GlButton>
    </GlBannerActions>
  </>
);

const renderBanner = (
  props: Partial<ComponentProps<typeof GlBanner>> = {},
  children: ReactNode = defaultContent,
) => renderToStaticMarkup(<GlBanner {...props}>{children}</GlBanner>);

describe("GlBanner", () => {
  it("renders the compound parts with their semantic elements and structural classes", () => {
    const markup = renderBanner();

    expect(markup).toContain(
      "<h2 class=\"gl-banner-title\">Upgrade to activate Service Desk</h2>",
    );
    expect(markup).toContain(
      "<div class=\"gl-banner-description\"><p>Banner message</p></div>",
    );
    expect(markup).toContain("<div class=\"gl-banner-actions\">");
    expect(markup).toContain("<span class=\"gl-button-text\">Upgrade your plan</span>");
  });

  it("renders the card structure and promotion classes by default", () => {
    const markup = renderBanner();

    expect(markup).toContain("gl-card gl-banner gl-py-6 gl-pl-6 gl-pr-8");
    expect(markup).toContain("gl-card-body gl-flex gl-bg-transparent !gl-p-0");
    expect(markup).not.toContain("gl-banner-introduction");
  });

  it("renders composed primary and secondary actions", () => {
    const markup = renderBanner({}, (
      <GlBannerActions>
        <GlButton category="primary" variant="confirm">Primary action</GlButton>
        <GlButton className="gl-ml-4" variant="link">Ask again later</GlButton>
      </GlBannerActions>
    ));

    expect(markup).toContain("btn-confirm");
    expect(markup).toContain("Primary action");
    expect(markup).toContain("btn-link gl-ml-4");
    expect(markup).toContain("Ask again later");
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

  it("adds the introduction class", () => {
    expect(renderBanner({ variant: "introduction" })).toContain(
      "gl-banner-introduction",
    );
  });

  it("allows every compound part to be omitted", () => {
    expect(renderBanner({}, null)).toContain("<div class=\"gl-banner-content\"></div>");
    expect(renderBanner({}, <GlBannerTitle>Title</GlBannerTitle>)).toContain("Title");
    expect(
      renderBanner({}, <GlBannerDescription>Description</GlBannerDescription>),
    ).toContain("Description");
    expect(renderBanner({}, <GlBannerActions>Actions</GlBannerActions>)).toContain("Actions");
  });

  it("supports arrays, Fragments, and conditional children", () => {
    const showDescription = true;
    const showActions = true;
    const hideExtraActions = false;
    const markup = renderBanner({}, [
      <GlBannerTitle key="title">Title</GlBannerTitle>,
      <Fragment key="content">
        {showDescription && <GlBannerDescription>Description</GlBannerDescription>}
        {hideExtraActions && <GlBannerActions>Hidden actions</GlBannerActions>}
      </Fragment>,
      showActions ? <GlBannerActions key="actions">Actions</GlBannerActions> : null,
    ]);

    expect(markup).toContain("Title");
    expect(markup).toContain("Description");
    expect(markup).toContain("Actions");
    expect(markup).not.toContain("Hidden actions");
  });

  it("accepts ordinary, wrapped, and repeated content", () => {
    function WrappedTitle() {
      return <GlBannerTitle>Wrapped title</GlBannerTitle>;
    }

    const markup = renderBanner({}, (
      <>
        Direct text
        <div>Native element</div>
        <WrappedTitle />
        <GlBannerTitle>Another title</GlBannerTitle>
        <GlBannerActions>First actions</GlBannerActions>
        <GlBannerActions>Second actions</GlBannerActions>
      </>
    ));

    expect(markup).toContain("Direct text");
    expect(markup).toContain("Native element");
    expect(markup).toContain("Wrapped title");
    expect(markup).toContain("Another title");
    expect(markup).toContain("First actions");
    expect(markup).toContain("Second actions");
  });

  it("preserves the consumer-provided part order", () => {
    const markup = renderBanner({}, (
      <>
        <GlBannerActions>Actions</GlBannerActions>
        <GlBannerDescription>Description</GlBannerDescription>
        <GlBannerTitle>Title</GlBannerTitle>
      </>
    ));

    expect(markup.indexOf("Actions")).toBeLessThan(markup.indexOf("Description"));
    expect(markup.indexOf("Description")).toBeLessThan(markup.indexOf("Title"));
  });

  it("passes native attributes and merges consumer classes on every part", () => {
    const markup = renderToStaticMarkup(
      <GlBanner className="custom-banner" id="upgrade-banner">
        <GlBannerTitle className="custom-title" id="banner-title">Title</GlBannerTitle>
        <GlBannerDescription className="custom-description" lang="en">
          Description
        </GlBannerDescription>
        <GlBannerActions className="custom-actions" aria-label="Banner actions">
          Actions
        </GlBannerActions>
      </GlBanner>,
    );

    expect(markup).toContain("gl-pr-8 custom-banner");
    expect(markup).toContain("id=\"upgrade-banner\"");
    expect(markup).toContain("id=\"banner-title\"");
    expect(markup).toContain("gl-banner-title custom-title");
    expect(markup).toContain("lang=\"en\"");
    expect(markup).toContain("gl-banner-description custom-description");
    expect(markup).toContain("aria-label=\"Banner actions\"");
    expect(markup).toContain("gl-banner-actions custom-actions");
  });

  it("accepts refs for the root and every compound part", () => {
    const bannerRef = createRef<HTMLDivElement>();
    const titleRef = createRef<HTMLHeadingElement>();
    const descriptionRef = createRef<HTMLDivElement>();
    const actionsRef = createRef<HTMLDivElement>();

    expect(() => renderToStaticMarkup(
      <GlBanner ref={bannerRef}>
        <GlBannerTitle ref={titleRef}>Title</GlBannerTitle>
        <GlBannerDescription ref={descriptionRef}>Description</GlBannerDescription>
        <GlBannerActions ref={actionsRef}>Actions</GlBannerActions>
      </GlBanner>,
    )).not.toThrow();
  });
});
