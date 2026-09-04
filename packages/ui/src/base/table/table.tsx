/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/table_lite/table_lite.vue
 *
 * Adaptations:
 * - The upstream fields/items API is expressed as semantic React composition.
 * - This foundational component is named GlTable; data processing such as
 *   sorting, filtering, and pagination remains outside the component.
 * - BootstrapVue's generated anatomy maps to typed native table elements.
 */

import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  type TableHTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from "react";
import { cva } from "class-variance-authority";

export type GlTableStackedBreakpoint = "sm" | "md" | "lg" | "xl";

export type GlTableProps = Omit<
  TableHTMLAttributes<HTMLTableElement>,
  "children"
> & {
  /** Adds borders around every cell. */
  bordered?: boolean;
  /** Removes table borders. Takes visual precedence over `bordered`. */
  borderless?: boolean;
  /** Places the table caption above the table. */
  captionTop?: boolean;
  children?: ReactNode;
  /** Uses a fixed table layout so column widths do not depend on cell content. */
  fixed?: boolean;
  /** Highlights body rows when they are hovered. */
  hover?: boolean;
  /** Separates cell borders instead of collapsing them. */
  noBorderCollapse?: boolean;
  /** Adds an outer border without adding borders around every cell. */
  outlined?: boolean;
  /** Uses compact cell padding. */
  small?: boolean;
  /** Stacks rows at every width or below the selected breakpoint. */
  stacked?: boolean | GlTableStackedBreakpoint;
  /** Makes the header sticky; a string sets the scroll container's max-height. */
  stickyHeader?: boolean | string;
  /** Adds alternating backgrounds to body rows. */
  striped?: boolean;
};

export type GlTableHeaderProps = HTMLAttributes<HTMLTableSectionElement>;
export type GlTableBodyProps = HTMLAttributes<HTMLTableSectionElement>;
export type GlTableFooterProps = HTMLAttributes<HTMLTableSectionElement>;
export type GlTableRowProps = HTMLAttributes<HTMLTableRowElement>;
export type GlTableCaptionProps = HTMLAttributes<HTMLTableCaptionElement>;

export type GlTableHeadProps = ThHTMLAttributes<HTMLTableCellElement> & {
  /** Label displayed beside this cell when used as a stacked row header. */
  stackedHeading?: string;
};

export type GlTableCellProps = TdHTMLAttributes<HTMLTableCellElement> & {
  /** Label displayed beside this cell in stacked mode. */
  stackedHeading?: string;
};

const tableVariants = cva("table b-table gl-table", {
  variants: {
    bordered: {
      true: "table-bordered",
    },
    borderless: {
      true: "table-borderless",
    },
    captionTop: {
      true: "b-table-caption-top",
    },
    fixed: {
      true: "b-table-fixed",
    },
    hover: {
      true: "table-hover",
    },
    noBorderCollapse: {
      true: "b-table-no-border-collapse",
    },
    outlined: {
      true: "gl-border",
    },
    small: {
      true: "table-sm",
    },
    stacked: {
      true: "b-table-stacked",
      sm: "b-table-stacked-sm",
      md: "b-table-stacked-md",
      lg: "b-table-stacked-lg",
      xl: "b-table-stacked-xl",
    },
    stickyHeader: {
      true: "gl-table--sticky-header",
    },
    striped: {
      true: "table-striped",
    },
  },
});

const tableContainerVariants = cva("gl-table-responsive", {
  variants: {
    stickyHeader: {
      true: "b-table-sticky-header",
    },
  },
});

const tableHeaderVariants = cva("gl-table-header");
const tableBodyVariants = cva("gl-table-body");
const tableFooterVariants = cva("gl-table-footer");
const tableRowVariants = cva("gl-table-row");
const tableHeadVariants = cva("gl-table-head");
const tableCellVariants = cva("gl-table-cell");
const tableCaptionVariants = cva("gl-table-caption");

const GlTable = forwardRef<HTMLTableElement, GlTableProps>(function GlTable({
  bordered = false,
  borderless = false,
  captionTop = false,
  children,
  className,
  fixed = false,
  hover = false,
  noBorderCollapse = false,
  outlined = false,
  small = false,
  stacked = false,
  stickyHeader = false,
  striped = false,
  ...tableProps
}, forwardedRef) {
  const hasStickyHeader = (stickyHeader === "" || Boolean(stickyHeader)) && !stacked;
  const containerStyle = hasStickyHeader && typeof stickyHeader === "string" && stickyHeader !== ""
    ? { maxHeight: stickyHeader }
    : undefined;

  return (
    <div
      className={tableContainerVariants({ stickyHeader: hasStickyHeader })}
      style={containerStyle}>
      <table
        {...tableProps}
        ref={forwardedRef}
        className={tableVariants({
          bordered,
          borderless,
          captionTop,
          className,
          fixed,
          hover,
          noBorderCollapse,
          outlined,
          small,
          stacked,
          stickyHeader: hasStickyHeader,
          striped,
        })}>
        {children}
      </table>
    </div>
  );
});

export const GlTableHeader = forwardRef<HTMLTableSectionElement, GlTableHeaderProps>(
  function GlTableHeader({ className, ...elementProps }, forwardedRef) {
    return (
      <thead
        {...elementProps}
        ref={forwardedRef}
        className={tableHeaderVariants({ className })} />
    );
  },
);

export const GlTableBody = forwardRef<HTMLTableSectionElement, GlTableBodyProps>(
  function GlTableBody({ className, ...elementProps }, forwardedRef) {
    return (
      <tbody
        {...elementProps}
        ref={forwardedRef}
        className={tableBodyVariants({ className })} />
    );
  },
);

export const GlTableFooter = forwardRef<HTMLTableSectionElement, GlTableFooterProps>(
  function GlTableFooter({ className, ...elementProps }, forwardedRef) {
    return (
      <tfoot
        {...elementProps}
        ref={forwardedRef}
        className={tableFooterVariants({ className })} />
    );
  },
);

export const GlTableRow = forwardRef<HTMLTableRowElement, GlTableRowProps>(
  function GlTableRow({ className, ...elementProps }, forwardedRef) {
    return (
      <tr
        {...elementProps}
        ref={forwardedRef}
        className={tableRowVariants({ className })} />
    );
  },
);

export const GlTableHead = forwardRef<HTMLTableCellElement, GlTableHeadProps>(
  function GlTableHead({
    children,
    className,
    scope = "col",
    stackedHeading,
    ...elementProps
  }, forwardedRef) {
    return (
      <th
        {...elementProps}
        ref={forwardedRef}
        className={tableHeadVariants({ className })}
        data-label={stackedHeading}
        scope={scope}>
        {stackedHeading === undefined
          ? children
          : <div className="gl-table-cell-content">{children}</div>}
      </th>
    );
  },
);

export const GlTableCell = forwardRef<HTMLTableCellElement, GlTableCellProps>(
  function GlTableCell({
    children,
    className,
    stackedHeading,
    ...elementProps
  }, forwardedRef) {
    return (
      <td
        {...elementProps}
        ref={forwardedRef}
        className={tableCellVariants({ className })}
        data-label={stackedHeading}>
        {stackedHeading === undefined
          ? children
          : <div className="gl-table-cell-content">{children}</div>}
      </td>
    );
  },
);

export const GlTableCaption = forwardRef<HTMLTableCaptionElement, GlTableCaptionProps>(
  function GlTableCaption({ className, ...elementProps }, forwardedRef) {
    return (
      <caption
        {...elementProps}
        ref={forwardedRef}
        className={tableCaptionVariants({ className })} />
    );
  },
);

export default GlTable;
