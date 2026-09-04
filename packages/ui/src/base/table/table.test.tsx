/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/table_lite/table_lite.spec.js
 */

import { createRef, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GlTable, {
  GlTableBody,
  GlTableCaption,
  GlTableCell,
  GlTableFooter,
  GlTableHead,
  GlTableHeader,
  GlTableRow,
  type GlTableProps,
} from "./table";

const renderTable = (
  props: Partial<GlTableProps> = {},
  children: ReactNode = null,
) => renderToStaticMarkup(<GlTable {...props}>{children}</GlTable>);

const completeTable = (
  <>
    <GlTableCaption>Pipeline status</GlTableCaption>
    <GlTableHeader>
      <GlTableRow>
        <GlTableHead>Pipeline</GlTableHead>
        <GlTableHead>Status</GlTableHead>
      </GlTableRow>
    </GlTableHeader>
    <GlTableBody>
      <GlTableRow>
        <GlTableHead scope="row" stackedHeading="Pipeline">Build</GlTableHead>
        <GlTableCell stackedHeading="Status">Passed</GlTableCell>
      </GlTableRow>
    </GlTableBody>
    <GlTableFooter>
      <GlTableRow>
        <GlTableCell colSpan={2}>1 pipeline</GlTableCell>
      </GlTableRow>
    </GlTableFooter>
  </>
);

describe("GlTable", () => {
  it("renders a semantic table inside the responsive container", () => {
    const markup = renderTable({ id: "pipelines", title: "Pipelines" }, completeTable);

    expect(markup).toMatch(/^<div class="gl-table-responsive"><table/u);
    expect(markup).toContain("class=\"table b-table gl-table\"");
    expect(markup).toContain("id=\"pipelines\"");
    expect(markup).toContain("title=\"Pipelines\"");
    expect(markup).toMatch(
      /<table[^>]*><caption[^>]*>Pipeline status<\/caption><thead/u,
    );
    expect(markup).toContain("<tbody class=\"gl-table-body\">");
    expect(markup).toContain("<tfoot class=\"gl-table-footer\">");
  });

  it("merges a consumer class on the table rather than its container", () => {
    const markup = renderTable({ className: "custom-table" });

    expect(markup).toContain("class=\"table b-table gl-table custom-table\"");
    expect(markup).toMatch(/^<div class="gl-table-responsive"><table/u);
  });

  it("adds bordered and borderless classes together so borderless CSS wins", () => {
    expect(renderTable({ bordered: true, borderless: true })).toContain(
      "class=\"table b-table gl-table table-bordered table-borderless\"",
    );
  });

  it.each([
    ["captionTop", "b-table-caption-top"],
    ["fixed", "b-table-fixed"],
    ["hover", "table-hover"],
    ["noBorderCollapse", "b-table-no-border-collapse"],
    ["outlined", "gl-border"],
    ["small", "table-sm"],
    ["striped", "table-striped"],
  ] as const)("maps %s to %s", (prop, expectedClass) => {
    expect(renderTable({ [prop]: true })).toContain(expectedClass);
  });

  it("combines lightweight appearance classes", () => {
    expect(renderTable({
      captionTop: true,
      fixed: true,
      hover: true,
      noBorderCollapse: true,
      outlined: true,
      small: true,
      striped: true,
    })).toContain(
      "class=\"table b-table gl-table b-table-caption-top b-table-fixed table-hover b-table-no-border-collapse gl-border table-sm table-striped\"",
    );
  });

  it.each([
    [true, "b-table-stacked"],
    ["sm", "b-table-stacked-sm"],
    ["md", "b-table-stacked-md"],
    ["lg", "b-table-stacked-lg"],
    ["xl", "b-table-stacked-xl"],
  ] as const)("maps stacked=%s to %s", (stacked, expectedClass) => {
    expect(renderTable({ stacked })).toContain(expectedClass);
  });

  it("enables a sticky header with the default container height", () => {
    const markup = renderTable({ stickyHeader: true });

    expect(markup).toContain(
      "class=\"gl-table-responsive b-table-sticky-header\"",
    );
    expect(markup).toContain("gl-table--sticky-header");
    expect(markup).not.toContain("max-height");
  });

  it("sets a custom sticky-header max-height on the container", () => {
    expect(renderTable({ stickyHeader: "24rem" })).toContain(
      "style=\"max-height:24rem\"",
    );
  });

  it("treats an empty sticky-header string as enabled without an inline height", () => {
    const markup = renderTable({ stickyHeader: "" });

    expect(markup).toContain("b-table-sticky-header");
    expect(markup).toContain("gl-table--sticky-header");
    expect(markup).not.toContain("max-height");
  });

  it("disables sticky-header behavior whenever stacked is enabled", () => {
    const markup = renderTable({ stacked: "md", stickyHeader: "24rem" });

    expect(markup).not.toContain("b-table-sticky-header");
    expect(markup).not.toContain("gl-table--sticky-header");
    expect(markup).not.toContain("max-height");
  });

  it("accepts a table ref", () => {
    const ref = createRef<HTMLTableElement>();

    expect(() => renderToStaticMarkup(<GlTable ref={ref} />)).not.toThrow();
  });
});

describe("GlTable composition components", () => {
  it("renders each native table element and merges consumer classes", () => {
    const markup = renderTable({}, (
      <>
        <GlTableCaption className="caption-class">Caption</GlTableCaption>
        <GlTableHeader className="header-class">
          <GlTableRow className="header-row-class">
            <GlTableHead className="head-class">Header</GlTableHead>
          </GlTableRow>
        </GlTableHeader>
        <GlTableBody className="body-class">
          <GlTableRow className="body-row-class">
            <GlTableCell className="cell-class">Value</GlTableCell>
          </GlTableRow>
        </GlTableBody>
        <GlTableFooter className="footer-class" />
      </>
    ));

    expect(markup).toContain("<caption class=\"gl-table-caption caption-class\"");
    expect(markup).toContain("<thead class=\"gl-table-header header-class\"");
    expect(markup).toContain("<tbody class=\"gl-table-body body-class\"");
    expect(markup).toContain("<tfoot class=\"gl-table-footer footer-class\"");
    expect(markup).toContain("class=\"gl-table-row header-row-class\"");
    expect(markup).toContain("class=\"gl-table-row body-row-class\"");
    expect(markup).toContain("class=\"gl-table-head head-class\"");
    expect(markup).toContain("class=\"gl-table-cell cell-class\"");
  });

  it("uses column scope by default and permits row scope", () => {
    expect(renderToStaticMarkup(<GlTableHead>Column</GlTableHead>)).toContain(
      "scope=\"col\"",
    );
    expect(renderToStaticMarkup(
      <GlTableHead scope="row">Row</GlTableHead>,
    )).toContain("scope=\"row\"");
  });

  it("maps stacked headings to data-label and wraps cell content", () => {
    const cell = renderToStaticMarkup(
      <GlTableCell stackedHeading="Status">Passed</GlTableCell>,
    );
    const head = renderToStaticMarkup(
      <GlTableHead scope="row" stackedHeading="Pipeline">Build</GlTableHead>,
    );

    expect(cell).toContain("data-label=\"Status\"");
    expect(cell).toContain(
      "<div class=\"gl-table-cell-content\">Passed</div>",
    );
    expect(head).toContain("data-label=\"Pipeline\"");
    expect(head).toContain(
      "<div class=\"gl-table-cell-content\">Build</div>",
    );
  });

  it("preserves an explicitly empty stacked heading", () => {
    const markup = renderToStaticMarkup(
      <GlTableCell stackedHeading="">Value</GlTableCell>,
    );

    expect(markup).toContain("data-label=\"\"");
    expect(markup).toContain("gl-table-cell-content");
  });

  it("accepts refs for all composition elements", () => {
    const captionRef = createRef<HTMLTableCaptionElement>();
    const sectionRef = createRef<HTMLTableSectionElement>();
    const rowRef = createRef<HTMLTableRowElement>();
    const cellRef = createRef<HTMLTableCellElement>();

    expect(() => renderToStaticMarkup(
      <GlTable>
        <GlTableCaption ref={captionRef}>Caption</GlTableCaption>
        <GlTableHeader ref={sectionRef}>
          <GlTableRow ref={rowRef}>
            <GlTableHead ref={cellRef}>Header</GlTableHead>
          </GlTableRow>
        </GlTableHeader>
      </GlTable>,
    )).not.toThrow();
  });
});
