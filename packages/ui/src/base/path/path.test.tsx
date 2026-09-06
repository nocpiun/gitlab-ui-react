/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/path/path.spec.js
 *
 * Browser interactions, dynamic children, and overflow behavior are covered
 * by the colocated Storybook play functions.
 */

import { Fragment, createRef, type ComponentProps, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import GlPath, {
  GlPathItem,
  GlPathItemMetric,
  GlPathItemTitle,
} from "./path";

vi.mock("@gitlab/svgs/dist/icons.svg", () => ({ default: "/path/to/icons.svg" }));

const renderPath = (
  children: ReactNode = (
    <>
      <GlPathItem value="first">
        <GlPathItemTitle>First</GlPathItemTitle>
        <GlPathItemMetric>1d</GlPathItemMetric>
      </GlPathItem>
      <GlPathItem value="second">
        <GlPathItemTitle>Second</GlPathItemTitle>
      </GlPathItem>
    </>
  ),
  props: Partial<ComponentProps<typeof GlPath>> = {},
) => renderToStaticMarkup(<GlPath {...props}>{children as never}</GlPath>);

describe("GlPath", () => {
  it("renders its semantic structure and selects the first item by default", () => {
    const markup = renderPath();

    expect(markup).toContain("class=\"gl-path-nav\"");
    expect(markup).toContain("class=\"gl-path-nav-list\"");
    expect(markup.match(/class="gl-path-nav-list-item"/gu)).toHaveLength(2);
    expect(markup).toMatch(
      /<button[^>]*aria-current="true"[^>]*class="gl-path-button gl-path-active-item"[^>]*>.*First.*1d.*<\/button>/u,
    );
    expect(markup).toMatch(
      /<button[^>]*aria-current="false"[^>]*class="gl-path-button"[^>]*>.*Second.*<\/button>/u,
    );
  });

  it("uses a valid default value and falls back from an invalid one", () => {
    expect(renderPath(undefined, { defaultValue: "second" })).toMatch(
      /aria-current="true"[^>]*class="gl-path-button gl-path-active-item"[^>]*>.*Second/u,
    );
    expect(renderPath(undefined, { defaultValue: "missing" })).toMatch(
      /aria-current="true"[^>]*class="gl-path-button gl-path-active-item"[^>]*>.*First/u,
    );
  });

  it("respects a controlled value without falling back when it is unknown", () => {
    expect(renderPath(undefined, { value: "second" })).toMatch(
      /aria-current="true"[^>]*class="gl-path-button gl-path-active-item"[^>]*>.*Second/u,
    );

    const unknownMarkup = renderPath(undefined, { value: "missing" });
    expect(unknownMarkup).not.toContain("gl-path-active-item");
    expect(unknownMarkup).not.toContain("aria-current=\"true\"");
  });

  it("selects the first item even when that item is disabled", () => {
    const markup = renderPath(
      <GlPathItem disabled value="disabled-first">
        <GlPathItemTitle>Disabled first</GlPathItemTitle>
      </GlPathItem>,
    );

    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*aria-current="true"/u);
    expect(markup).toContain("gl-path-active-item");
  });

  it("renders title, metric, valid icon, and item attributes in canonical order", () => {
    const markup = renderPath(
      <GlPathItem className="custom-item" icon="home" id="overview" name="stage" value="first">
        <GlPathItemMetric className="custom-metric" dir="ltr">14d</GlPathItemMetric>
        <GlPathItemTitle className="custom-title" lang="en">Overview</GlPathItemTitle>
      </GlPathItem>,
    );

    expect(markup).toContain("id=\"overview\"");
    expect(markup).toContain("name=\"stage\"");
    expect(markup).toContain("class=\"gl-path-button gl-path-active-item custom-item\"");
    expect(markup).toContain("data-testid=\"home-icon\"");
    expect(markup).toContain("class=\"gl-path-item-title custom-title\"");
    expect(markup).toContain(
      "class=\"gl-path-item-metric gl-pl-2 gl-font-normal custom-metric\"",
    );
    expect(markup.indexOf("home-icon")).toBeLessThan(markup.indexOf("Overview"));
    expect(markup.indexOf("Overview")).toBeLessThan(markup.indexOf("14d"));
  });

  it("applies background color and native root attributes", () => {
    const markup = renderPath(undefined, {
      backgroundColor: "#f0f0f0",
      className: "custom-path",
      title: "Lifecycle",
    });

    expect(markup).toContain("class=\"gl-path-nav custom-path\"");
    expect(markup).toContain("title=\"Lifecycle\"");
    expect(markup).toContain("--path-bg-color:#f0f0f0");
  });

  it("uses the transparent background and generated item IDs by default", () => {
    const markup = renderPath();

    expect(markup).toContain("--path-bg-color:rgba(0,0,0,0)");
    expect(markup).toMatch(/id="path-item-[^"]+"/u);
  });

  it("renders customizable labels on initially hidden scroll controls", () => {
    const markup = renderPath(undefined, {
      scrollLeftLabel: "Previous stages",
      scrollRightLabel: "Next stages",
    });

    expect(markup).toContain("hidden=\"\"");
    expect(markup).toContain("aria-label=\"Previous stages\"");
    expect(markup).toContain("aria-label=\"Next stages\"");
    expect(markup).toContain("data-testid=\"chevron-left-icon\"");
    expect(markup).toContain("data-testid=\"chevron-right-icon\"");
  });

  it("supports arrays, fragments, conditional items, and an empty path", () => {
    const markup = renderPath([
      <GlPathItem key="first" value="first">
        <GlPathItemTitle>First</GlPathItemTitle>
      </GlPathItem>,
      false,
      <Fragment key="rest">
        <GlPathItem value="second">
          <GlPathItemTitle>Second</GlPathItemTitle>
        </GlPathItem>
      </Fragment>,
    ] as never);

    expect(markup.match(/class="gl-path-nav-list-item"/gu)).toHaveLength(2);
    expect(renderPath(null)).not.toContain("gl-path-nav-list-item");
  });

  it("rejects unsupported root children", () => {
    expect(() => renderPath(<div />)).toThrow(
      "GlPath only accepts GlPathItem as direct children.",
    );
  });

  it("rejects empty and duplicate item values", () => {
    expect(() => renderPath(
      <GlPathItem value=" ">
        <GlPathItemTitle>Empty value</GlPathItemTitle>
      </GlPathItem>,
    )).toThrow("GlPathItem value must be a non-empty string.");

    expect(() => renderPath(
      <>
        <GlPathItem value="duplicate">
          <GlPathItemTitle>First</GlPathItemTitle>
        </GlPathItem>
        <GlPathItem value="duplicate">
          <GlPathItemTitle>Second</GlPathItemTitle>
        </GlPathItem>
      </>,
    )).toThrow("GlPathItem values must be unique.");
  });

  it("rejects missing, duplicate, and unsupported item parts", () => {
    expect(() => renderPath(<GlPathItem value="first">{null}</GlPathItem>)).toThrow(
      "GlPathItem requires exactly one GlPathItemTitle child.",
    );
    expect(() => renderPath(
      <GlPathItem value="first">
        <GlPathItemTitle>First</GlPathItemTitle>
        <GlPathItemTitle>Duplicate</GlPathItemTitle>
      </GlPathItem>,
    )).toThrow("GlPathItem accepts exactly one GlPathItemTitle child.");
    expect(() => renderPath(
      <GlPathItem value="first">
        <GlPathItemTitle>First</GlPathItemTitle>
        <GlPathItemMetric>1d</GlPathItemMetric>
        <GlPathItemMetric>2d</GlPathItemMetric>
      </GlPathItem>,
    )).toThrow("GlPathItem accepts at most one GlPathItemMetric child.");
    expect(() => renderPath(
      <GlPathItem value="first">
        <GlPathItemTitle>First</GlPathItemTitle>
        {<strong>Unsupported</strong> as never}
      </GlPathItem>,
    )).toThrow("GlPathItem only accepts GlPathItemTitle and GlPathItemMetric");
  });

  it("requires items to be composed inside GlPath", () => {
    expect(() => renderToStaticMarkup(
      <GlPathItem value="first">
        <GlPathItemTitle>First</GlPathItemTitle>
      </GlPathItem>,
    )).toThrow("GlPathItem must be used as a child of GlPath.");
  });

  it("accepts refs for every public part", () => {
    const pathRef = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLButtonElement>();
    const titleRef = createRef<HTMLSpanElement>();
    const metricRef = createRef<HTMLSpanElement>();

    expect(() => renderToStaticMarkup(
      <GlPath ref={pathRef}>
        <GlPathItem ref={itemRef} value="first">
          <GlPathItemTitle ref={titleRef}>First</GlPathItemTitle>
          <GlPathItemMetric ref={metricRef}>1d</GlPathItemMetric>
        </GlPathItem>
      </GlPath>,
    )).not.toThrow();
  });
});
