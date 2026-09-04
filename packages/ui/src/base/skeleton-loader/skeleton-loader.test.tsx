/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/skeleton_loader/skeleton_loader.spec.js
 */

import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlSkeletonLoader from "./skeleton-loader";

const renderLoader = (
  props: Partial<ComponentProps<typeof GlSkeletonLoader>> = {},
  children?: ReactNode,
) => renderToStaticMarkup(
  <GlSkeletonLoader {...props}>{children}</GlSkeletonLoader>,
);

const getClipPathMarkup = (markup: string) => (
  markup.match(/<clipPath[^>]*>([\s\S]*?)<\/clipPath>/u)?.[1] ?? ""
);

describe("GlSkeletonLoader", () => {
  it("renders the upstream default structure and accessibility title", () => {
    const markup = renderLoader();

    expect(markup).toMatch(/^<div/);
    expect(markup).toContain(
      "class=\"gl-skeleton-loader-default-container gl-max-w-full\"",
    );
    expect(markup).toContain(
      "class=\"gl-skeleton-loader gl-w-full gl-h-full\"",
    );
    expect(markup).toContain("viewBox=\"0 0 235 38\"");
    expect(markup).toContain("preserveAspectRatio=\"xMidYMid meet\"");
    expect(markup).toContain("<title>Loading</title>");
    expect(markup).not.toMatch(/aria-busy|aria-live|role=/u);
  });

  it("renders three default lines with the upstream positions and width cycle", () => {
    const clipPath = getClipPathMarkup(renderLoader());

    expect(clipPath.match(/<rect/gmu)).toHaveLength(3);
    expect(clipPath).toContain("width=\"65%\" y=\"0\"");
    expect(clipPath).toContain("width=\"100%\" y=\"14\"");
    expect(clipPath).toContain("width=\"85%\" y=\"28\"");
    expect(clipPath.match(/height="10" rx="4"/gmu)).toHaveLength(3);
  });

  it("computes a five-line viewBox and repeats the width cycle", () => {
    const markup = renderLoader({ lines: 5 });
    const clipPath = getClipPathMarkup(markup);

    expect(markup).toContain("viewBox=\"0 0 235 66\"");
    expect(clipPath.match(/<rect/gmu)).toHaveLength(5);
    expect(clipPath).toContain("width=\"65%\" y=\"42\"");
    expect(clipPath).toContain("width=\"100%\" y=\"56\"");
  });

  it("renders equal-width default lines", () => {
    const clipPath = getClipPathMarkup(renderLoader({ equalWidthLines: true }));

    expect(clipPath.match(/width="100%"/gmu)).toHaveLength(3);
    expect(clipPath).not.toContain("width=\"65%\"");
    expect(clipPath).not.toContain("width=\"85%\"");
  });

  it("uses explicit dimensions for the default viewBox and wrapper", () => {
    const markup = renderLoader({ height: 400, width: 500 });

    expect(markup).toContain("style=\"height:400px;width:500px\"");
    expect(markup).toContain("viewBox=\"0 0 500 400\"");
  });

  it("forwards native attributes and merges class and style on the div root", () => {
    const markup = renderLoader({
      "aria-label": "Loading content",
      className: "custom-loader",
      height: 80,
      id: "issue-skeleton",
      style: { color: "red", height: 20, width: 30 },
      width: 90,
    });

    expect(markup).toContain(
      "class=\"gl-skeleton-loader-default-container gl-max-w-full custom-loader\"",
    );
    expect(markup).toContain("aria-label=\"Loading content\"");
    expect(markup).toContain("id=\"issue-skeleton\"");
    expect(markup).toContain("style=\"color:red;height:80px;width:90px\"");
  });

  it("renders custom shapes in a root SVG without an extra wrapper", () => {
    const markup = renderLoader({}, <circle cx={25} cy={25} r={25} />);
    const clipPath = getClipPathMarkup(markup);

    expect(markup).toMatch(/^<svg/);
    expect(markup).not.toContain("<div");
    expect(markup).toContain("class=\"gl-skeleton-loader\"");
    expect(markup).toContain("viewBox=\"0 0 400 130\"");
    expect(clipPath).toContain("<circle cx=\"25\" cy=\"25\" r=\"25\"></circle>");
  });

  it("supports custom SVG dimensions, aspect ratio, attributes, class, and style", () => {
    const markup = renderLoader({
      className: "custom-shape-loader",
      height: 60,
      id: "avatar-skeleton",
      preserveAspectRatio: "none",
      style: { display: "block" },
      width: 120,
    }, <rect height={60} width={120} />);

    expect(markup).toMatch(/^<svg/);
    expect(markup).toContain("class=\"gl-skeleton-loader custom-shape-loader\"");
    expect(markup).toContain("id=\"avatar-skeleton\"");
    expect(markup).toContain("style=\"display:block\"");
    expect(markup).toContain("preserveAspectRatio=\"none\"");
    expect(markup).toContain("viewBox=\"0 0 120 60\"");
  });

  it("uses explicit unique keys and base URLs for both SVG references", () => {
    const markup = renderLoader({
      baseUrl: "/issues/123",
      uniqueKey: "issue-content",
    });

    expect(markup).toContain("id=\"issue-content-idClip\"");
    expect(markup).toContain("id=\"issue-content-idGradient\"");
    expect(markup).toContain("clip-path=\"url(/issues/123#issue-content-idClip)\"");
    expect(markup).toContain("fill=\"url(/issues/123#issue-content-idGradient)\"");
  });

  it("generates stable non-conflicting IDs for multiple instances", () => {
    const markup = renderToStaticMarkup(
      <>
        <GlSkeletonLoader />
        <GlSkeletonLoader />
      </>,
    );
    const clipIds = [...markup.matchAll(/id="([^"]+-idClip)"/gu)]
      .map((match) => match[1]);
    const gradientIds = [...markup.matchAll(/id="([^"]+-idGradient)"/gu)]
      .map((match) => match[1]);

    expect(clipIds).toHaveLength(2);
    expect(new Set(clipIds).size).toBe(2);
    expect(gradientIds).toHaveLength(2);
    expect(new Set(gradientIds).size).toBe(2);
    for(const id of [...clipIds, ...gradientIds]) {
      expect(markup).toContain(`url(#${id})`);
    }
  });

  it("treats empty children as the default line layout", () => {
    const markup = renderLoader({}, <></>);

    expect(markup).toMatch(/^<div/);
    expect(getClipPathMarkup(markup).match(/<rect/gmu)).toHaveLength(3);
  });
});
