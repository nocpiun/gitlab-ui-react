import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlKeysetPagination from "./keyset-pagination";

function renderPagination(
  props: ComponentProps<typeof GlKeysetPagination> = {},
) {
  return renderToStaticMarkup(<GlKeysetPagination {...props} />);
}

function controlTag(markup: string, testId: "nextButton" | "prevButton") {
  return markup.match(new RegExp(`<(?:a|button)[^>]*data-testid="${testId}"[^>]*>`))?.[0] ?? "";
}

describe("GlKeysetPagination", () => {
  it("does not render without an available direction", () => {
    expect(renderPagination()).toBe("");
  });

  it("renders a labeled landmark and forwards root attributes", () => {
    const markup = renderPagination({
      className: "custom-pagination",
      hasNextPage: true,
      navigationLabel: "Project pagination",
      title: "Projects",
    });

    expect(markup).toContain("<nav");
    expect(markup).toContain("title=\"Projects\"");
    expect(markup).toContain("aria-label=\"Project pagination\"");
    expect(markup).toContain("class=\"gl-pagination custom-pagination\"");
    expect(markup).toContain("class=\"gl-button-group btn-group gl-keyset-pagination gl-gap-3\"");
  });

  it("renders default text and chevrons", () => {
    const markup = renderPagination({ hasNextPage: true, hasPreviousPage: true });

    expect(markup).toContain("Previous");
    expect(markup).toContain("Next");
    expect(markup).toContain("data-testid=\"chevron-lg-left-icon\"");
    expect(markup).toContain("data-testid=\"chevron-lg-right-icon\"");
  });

  it("disables only unavailable directions", () => {
    const markup = renderPagination({ hasNextPage: true });

    expect(controlTag(markup, "prevButton")).toContain("<button");
    expect(controlTag(markup, "prevButton")).toContain("aria-disabled=\"true\"");
    expect(controlTag(markup, "nextButton")).toContain("<button");
    expect(controlTag(markup, "nextButton")).toContain("aria-disabled=\"false\"");
  });

  it("globally disables both controls", () => {
    const markup = renderPagination({
      disabled: true,
      hasNextPage: true,
      hasPreviousPage: true,
    });

    expect(markup.match(/aria-disabled="true"/g)).toHaveLength(2);
  });

  it("renders non-empty destinations as safe links", () => {
    const markup = renderPagination({
      hasNextPage: true,
      hasPreviousPage: true,
      nextButtonLink: "https://example.com/next",
      prevButtonLink: "https://example.com/previous",
    });

    expect(markup).toMatch(/<a[^>]*data-testid="prevButton"/);
    expect(markup).toContain("href=\"https://example.com/previous\"");
    expect(markup).toMatch(/<a[^>]*data-testid="nextButton"/);
    expect(markup).toContain("href=\"https://example.com/next\"");
  });

  it("keeps empty link values in button mode", () => {
    const markup = renderPagination({ hasNextPage: true, nextButtonLink: "" });

    expect(markup).toMatch(/<button[^>]*data-testid="nextButton"/);
  });

  it("supports custom text and complete button content", () => {
    const textMarkup = renderPagination({
      hasNextPage: true,
      hasPreviousPage: true,
      nextText: "Forward",
      prevText: "Back",
    });
    const contentMarkup = renderPagination({
      hasNextPage: true,
      hasPreviousPage: true,
      nextButtonContent: <span>Custom next</span>,
      previousButtonContent: <span>Custom previous</span>,
    });

    expect(textMarkup).toContain("Back");
    expect(textMarkup).toContain("Forward");
    expect(contentMarkup).toContain("Custom previous");
    expect(contentMarkup).toContain("Custom next");
    expect(contentMarkup).not.toContain("chevron-lg-left-icon");
    expect(contentMarkup).not.toContain("chevron-lg-right-icon");
  });

  it("preserves explicitly empty button content", () => {
    const markup = renderPagination({ hasNextPage: true, nextButtonContent: null });

    expect(markup).not.toContain("Next");
    expect(markup).not.toContain("chevron-lg-right-icon");
  });
});
