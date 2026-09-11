/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/drawer/drawer.spec.js
 *
 * Portal DOM and interactions are covered by Storybook play functions because
 * unit tests run in a node environment.
 */

import {
  Fragment,
  createRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import GlDrawer, {
  GlDrawerActions,
  GlDrawerContent,
  GlDrawerFooter,
  GlDrawerHeader,
  GlDrawerTitle,
  GlDrawerTrigger,
  getDrawerPopupStyle,
  resolveDrawerContent,
  resolveDrawerHeader,
  type GlDrawerContentProps,
  type GlDrawerVariant,
} from "./drawer";

vi.mock("@gitlab/svgs/dist/icons.svg", () => ({ default: "/path/to/icons.svg" }));

const defaultContent = (
  <>
    <GlDrawerHeader>
      <GlDrawerTitle>Drawer title</GlDrawerTitle>
    </GlDrawerHeader>
    <div>Drawer body</div>
  </>
);

function renderDrawer(
  children: ReactNode = defaultContent,
  props: Partial<ComponentProps<typeof GlDrawer>> = {},
) {
  return renderToStaticMarkup(
    <GlDrawer {...props}>
      <GlDrawerTrigger asChild>
        <button type="button">Open drawer</button>
      </GlDrawerTrigger>
      <GlDrawerContent>{children}</GlDrawerContent>
    </GlDrawer>,
  );
}

describe("GlDrawer", () => {
  it("renders text inside a GitLab-styled default trigger", () => {
    const markup = renderToStaticMarkup(
      <GlDrawer>
        <GlDrawerTrigger category="tertiary" variant="danger">
          Open default drawer
        </GlDrawerTrigger>
      </GlDrawer>,
    );

    expect(markup.match(/<button/g)).toHaveLength(1);
    expect(markup).toContain("gl-button");
    expect(markup).toContain("btn-danger-tertiary");
    expect(markup).toContain("Open default drawer");
    expect(markup).toContain("aria-haspopup=\"dialog\"");
  });

  it("composes the child element as a dialog trigger", () => {
    const markup = renderDrawer();

    expect(markup).toContain("<button");
    expect(markup).toContain("Open drawer</button>");
    expect(markup).toContain("aria-haspopup=\"dialog\"");
    expect(markup).not.toContain("aria-expanded=\"true\"");
  });

  it("merges trigger and child styles in asChild mode", () => {
    const markup = renderToStaticMarkup(
      <GlDrawer>
        <GlDrawerTrigger
          asChild
          className="trigger-class"
          style={{ backgroundColor: "red", color: "red" }}>
          <button
            className="child-class"
            style={{ color: "blue" }}
            type="button">
            Styled drawer
          </button>
        </GlDrawerTrigger>
      </GlDrawer>,
    );

    expect(markup.match(/<button/g)).toHaveLength(1);
    expect(markup).toContain("child-class trigger-class");
    expect(markup).toContain("background-color:red;color:blue");
  });

  it("accepts uncontrolled and controlled open state without changing hydration-safe SSR", () => {
    expect(renderDrawer(undefined, { defaultOpen: true })).toContain(
      "aria-expanded=\"false\"",
    );
    expect(renderDrawer(undefined, { defaultOpen: true, open: false })).toContain(
      "aria-expanded=\"false\"",
    );
    expect(renderDrawer(undefined, { open: true })).toContain("aria-expanded=\"false\"");
  });

  it("allows both root compound parts to be omitted", () => {
    expect(renderToStaticMarkup(<GlDrawer />)).toBe("");
    expect(renderToStaticMarkup(
      <GlDrawer>
        <GlDrawerTrigger asChild><button type="button">Open</button></GlDrawerTrigger>
      </GlDrawer>,
    )).toContain("Open");
  });

  it("supports arrays, Fragments, and conditional root children", () => {
    const showContent = true;
    const markup = renderToStaticMarkup(
      <GlDrawer>
        <Fragment>
          <GlDrawerTrigger asChild><button type="button">Open</button></GlDrawerTrigger>
          {showContent && (
            <GlDrawerContent aria-label="Drawer">
              <GlDrawerHeader />
            </GlDrawerContent>
          )}
        </Fragment>
      </GlDrawer>,
    );

    expect(markup).toContain("Open");
  });

  it("rejects unsupported and duplicate root compound parts", () => {
    expect(() => renderToStaticMarkup(<GlDrawer>Invalid</GlDrawer>)).toThrowError(
      "GlDrawer only accepts GlDrawerTrigger and GlDrawerContent as direct children.",
    );
    expect(() => renderToStaticMarkup(
      <GlDrawer>
        <GlDrawerTrigger asChild><button type="button">One</button></GlDrawerTrigger>
        <GlDrawerTrigger asChild><button type="button">Two</button></GlDrawerTrigger>
      </GlDrawer>,
    )).toThrowError("GlDrawer accepts at most one GlDrawerTrigger child.");
    expect(() => renderToStaticMarkup(
      <GlDrawer>
        <GlDrawerContent aria-label="One" />
        <GlDrawerContent aria-label="Two" />
      </GlDrawer>,
    )).toThrowError("GlDrawer accepts at most one GlDrawerContent child.");
  });

  it("requires trigger and content to be inside GlDrawer", () => {
    expect(() => renderToStaticMarkup(
      <GlDrawerTrigger asChild><button type="button">Open</button></GlDrawerTrigger>,
    )).toThrowError("GlDrawerTrigger must be used inside GlDrawer.");
    expect(() => renderToStaticMarkup(
      <GlDrawerContent aria-label="Drawer" />,
    )).toThrowError("GlDrawerContent must be used inside GlDrawer.");
  });

  it("accepts refs for the trigger, content, and each structural part", () => {
    const triggerRef = createRef<HTMLElement>();
    const contentRef = createRef<HTMLElement>();
    const headerRef = createRef<HTMLDivElement>();
    const titleRef = createRef<HTMLHeadingElement>();
    const actionsRef = createRef<HTMLDivElement>();
    const footerRef = createRef<HTMLDivElement>();

    expect(() => renderToStaticMarkup(
      <GlDrawer>
        <GlDrawerTrigger ref={triggerRef} asChild>
          <button type="button">Open</button>
        </GlDrawerTrigger>
        <GlDrawerContent ref={contentRef} title="drawer">
          <GlDrawerHeader ref={headerRef}>
            <GlDrawerTitle ref={titleRef}>Title</GlDrawerTitle>
            <GlDrawerActions ref={actionsRef}>Actions</GlDrawerActions>
          </GlDrawerHeader>
          <GlDrawerFooter ref={footerRef}>Footer</GlDrawerFooter>
        </GlDrawerContent>
      </GlDrawer>,
    )).not.toThrow();
  });

  it("exposes the documented content and variant types", () => {
    expectTypeOf<GlDrawerContentProps["title"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<GlDrawerContentProps["variant"]>()
      .toEqualTypeOf<GlDrawerVariant | undefined>();
  });
});

describe("drawer content composition", () => {
  it("extracts header and footer while retaining arbitrary body nodes", () => {
    const content = resolveDrawerContent(
      <>
        <div>First body item</div>
        <GlDrawerFooter>Footer</GlDrawerFooter>
        body text
        <GlDrawerHeader><GlDrawerTitle>Title</GlDrawerTitle></GlDrawerHeader>
      </>,
    );

    expect(content.header?.type).toBe(GlDrawerHeader);
    expect(content.footer?.type).toBe(GlDrawerFooter);
    expect(content.body).toHaveLength(2);
  });

  it("requires exactly one header while keeping the footer optional", () => {
    expect(() => resolveDrawerContent(<div>Body only</div>)).toThrowError(
      "GlDrawerContent requires exactly one GlDrawerHeader child.",
    );

    const content = resolveDrawerContent(
      <>
        <GlDrawerHeader />
        <div>Body only</div>
      </>,
    );

    expect(content.header.type).toBe(GlDrawerHeader);
    expect(content.footer).toBeNull();
    expect(content.body).toHaveLength(1);
  });

  it("rejects duplicate header and footer parts", () => {
    expect(() => resolveDrawerContent(
      <>
        <GlDrawerHeader />
        <GlDrawerHeader />
      </>,
    )).toThrowError("GlDrawerContent accepts at most one GlDrawerHeader child.");
    expect(() => resolveDrawerContent(
      <>
        <GlDrawerHeader />
        <GlDrawerFooter />
        <GlDrawerFooter />
      </>,
    )).toThrowError("GlDrawerContent accepts at most one GlDrawerFooter child.");
  });

  it("rejects header parts at the content level", () => {
    expect(() => resolveDrawerContent(<GlDrawerTitle>Wrong level</GlDrawerTitle>))
      .toThrowError("GlDrawerTitle and GlDrawerActions belong directly inside GlDrawerHeader.");
  });

  it("normalizes header parts and rejects invalid or duplicate children", () => {
    const header = resolveDrawerHeader(
      <>
        <GlDrawerActions>Actions</GlDrawerActions>
        <GlDrawerTitle>Title</GlDrawerTitle>
      </>,
    );

    expect(header.title?.type).toBe(GlDrawerTitle);
    expect(header.actions?.type).toBe(GlDrawerActions);
    expect(() => resolveDrawerHeader("Invalid")).toThrowError(
      "GlDrawerHeader only accepts GlDrawerTitle and GlDrawerActions as direct children.",
    );
    expect(() => resolveDrawerHeader(
      <>
        <GlDrawerTitle>One</GlDrawerTitle>
        <GlDrawerTitle>Two</GlDrawerTitle>
      </>,
    )).toThrowError("GlDrawerHeader accepts at most one GlDrawerTitle child.");
    expect(() => resolveDrawerHeader(
      <>
        <GlDrawerActions>One</GlDrawerActions>
        <GlDrawerActions>Two</GlDrawerActions>
      </>,
    )).toThrowError("GlDrawerHeader accepts at most one GlDrawerActions child.");
  });
});

describe("drawer positioning", () => {
  it("uses the upstream defaults", () => {
    expect(getDrawerPopupStyle("", 10)).toEqual({
      maxHeight: undefined,
      top: 0,
      zIndex: 10,
    });
  });

  it("positions below a fixed header and keeps managed values authoritative", () => {
    expect(getDrawerPopupStyle("64px", 20, {
      maxHeight: "none",
      top: "1px",
      zIndex: 1,
    })).toEqual({
      maxHeight: "calc(100vh - 64px)",
      top: "64px",
      zIndex: 20,
    });
  });
});
