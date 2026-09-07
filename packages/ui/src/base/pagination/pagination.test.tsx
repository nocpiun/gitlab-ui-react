import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import GlPagination from "./pagination";

vi.mock("@gitlab/svgs/dist/icons.svg", () => ({ default: "/path/to/icons.svg" }));

const defaultProps = {
  perPage: 5,
  totalItems: 75,
  value: 1,
} satisfies ComponentProps<typeof GlPagination>;

function renderPagination(
  props: Partial<ComponentProps<typeof GlPagination>> = {},
) {
  return renderToStaticMarkup(<GlPagination {...defaultProps} {...props} />);
}

function pageItemTexts(markup: string) {
  return [...markup.matchAll(
    /<(?:a|span)[^>]*data-testid="gl-pagination-item"[^>]*>([\s\S]*?)<\/(?:a|span)>/g,
  )].map((match) => match[1].replace(/<[^>]+>/g, ""));
}

describe("GlPagination", () => {
  it("does not render when all items fit on one page", () => {
    expect(renderPagination({ totalItems: 5 })).toBe("");
  });

  it("forwards navigation attributes and applies the default landmark label", () => {
    const markup = renderPagination({ className: "custom-pagination", title: "Pages" });

    expect(markup).toContain("<nav");
    expect(markup).toContain("title=\"Pages\"");
    expect(markup).toContain("aria-label=\"Pagination\"");
    expect(markup).toContain("class=\"gl-pagination custom-pagination\"");
  });

  it("renders all four pages and marks the current page", () => {
    const markup = renderPagination({ totalItems: 20, value: 3 });

    expect(pageItemTexts(markup)).toEqual(["1", "2", "3", "4"]);
    expect(markup).toContain("aria-current=\"page\"");
    expect(markup).toContain("aria-label=\"Go to page 3\"");
  });

  it.each([
    [9, 1, ["1", "2", "3", "4", "5", "…", "15"]],
    [9, 8, ["1", "…", "4", "5", "6", "7", "8", "9", "10", "11", "12", "…", "15"]],
    [9, 15, ["1", "…", "11", "12", "13", "14", "15"]],
    [0, 1, ["1", "2", "…", "15"]],
    [0, 8, ["1", "…", "8", "…", "15"]],
    [0, 15, ["1", "…", "14", "15"]],
  ])("renders the expected collapsed range for limit %i on page %i", (
    limit,
    value,
    expected,
  ) => {
    expect(pageItemTexts(renderPagination({ limits: { default: limit }, value })))
      .toEqual(expected);
  });

  it("uses the built-in desktop fallback during SSR when limits omit default", () => {
    const limits = { lg: 7, md: 5, sm: 3, xl: 11, xs: 0 };

    expect(pageItemTexts(renderPagination({ limits })))
      .toEqual(["1", "2", "3", "4", "5", "…", "15"]);
  });

  it.each([
    ["center", "gl-justify-center"],
    ["right", "gl-justify-end"],
    ["fill", "gl-text-center"],
  ] as const)("applies the %s alignment", (align, expectedClass) => {
    const markup = renderPagination({ align });

    expect(markup).toContain(`<ul class="${expectedClass}">`);
    if(align === "fill") expect(markup).toContain("gl-flex-auto");
  });

  it("renders disabled boundary controls as unnamed spans", () => {
    const firstPageMarkup = renderPagination({ value: 1 });
    const lastPageMarkup = renderPagination({ value: 15 });

    expect(firstPageMarkup).toMatch(
      /<li aria-hidden="true"[^>]*><span class="gl-pagination-item" data-testid="gl-pagination-prev">/,
    );
    expect(lastPageMarkup).toMatch(
      /<li aria-hidden="true"[^>]*><span class="gl-pagination-item" data-testid="gl-pagination-next">/,
    );
  });

  it("supports custom labels and both labelPage forms", () => {
    const stringMarkup = renderPagination({
      labelFirstPage: "First result page",
      labelLastPage: "Last result page",
      labelPage: "Result page %{page}",
      value: 8,
    });
    const functionMarkup = renderPagination({
      labelPage: (page) => `Open result page ${page}`,
      value: 2,
    });
    const fallbackMarkup = renderPagination({ labelPrevPage: "", value: 3 });

    expect(stringMarkup).toContain("aria-label=\"First result page\"");
    expect(stringMarkup).toContain("aria-label=\"Result page 8\"");
    expect(stringMarkup).toContain("aria-label=\"Last result page\"");
    expect(functionMarkup).toContain("aria-label=\"Open result page 2\"");
    expect(fallbackMarkup).toContain("aria-label=\"Go to page 2\"");
  });

  it("supports custom control, page-number, and ellipsis content", () => {
    const renderPageNumber = ({ page }: { page: number }): ReactNode => <strong>P{page}</strong>;
    const markup = renderPagination({
      ellipsisLeft: <em>Left gap</em>,
      ellipsisRight: <em>Right gap</em>,
      renderNext: () => <span>Forward</span>,
      renderPageNumber,
      renderPrevious: () => <span>Back</span>,
      value: 8,
    });

    expect(markup).toContain(">Back</span>");
    expect(markup).toContain("<strong>P8</strong>");
    expect(markup).toContain("<em>Left gap</em>");
    expect(markup).toContain("<em>Right gap</em>");
    expect(markup).toContain(">Forward</span>");
  });

  it("preserves explicitly empty render output", () => {
    const markup = renderPagination({
      ellipsisLeft: null,
      renderPageNumber: () => null,
      renderPrevious: () => null,
      value: 8,
    });

    expect(markup).not.toContain("chevron-lg-left-icon");
    expect(markup.match(/>…<\/span>/g)).toHaveLength(1);
    expect(pageItemTexts(markup)).toEqual([...Array(11).fill(""), "…", ""]);
  });

  it("renders only directional controls in compact mode", () => {
    const markup = renderPagination({
      nextPage: 4,
      prevPage: 2,
      totalItems: 0,
      value: 3,
    });

    expect(markup).not.toContain("data-testid=\"gl-pagination-item\"");
    expect(markup).toContain("data-testid=\"gl-pagination-prev\"");
    expect(markup).toContain("data-testid=\"gl-pagination-next\"");
  });

  it("uses compact page markers to disable unavailable directions", () => {
    const markup = renderPagination({ nextPage: 4, totalItems: 0, value: 3 });

    expect(markup).toMatch(/<span class="gl-pagination-item" data-testid="gl-pagination-prev">/);
    expect(markup).toMatch(/<a[^>]*data-testid="gl-pagination-next"/);
  });

  it("sanitizes URLs generated for link-based pagination", () => {
    const markup = renderPagination({ linkGen: () => "javascript:alert(1)", value: 2 });

    expect(markup).toContain("href=\"about:blank\"");
    expect(markup).not.toContain("href=\"javascript:alert(1)\"");
  });
});
