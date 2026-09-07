/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/pagination/pagination.vue
 *
 * Adaptations:
 * - Vue's v-model and events map to value/onValueChange, onPrevious, and onNext.
 * - Scoped slots map to typed render props; ellipsis slots map to React nodes.
 * - The breakpoint lookup is SSR-safe and updates after a debounced window resize.
 */

import {
  forwardRef,
  useEffect,
  useState,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cva } from "class-variance-authority";
import GlIcon from "../icon/icon";
import GlLink from "../link/link";

export type GlPaginationAlign = "left" | "center" | "right" | "fill";

type PaginationBreakpoint = "xs" | "sm" | "md" | "lg" | "xl";

export type GlPaginationLimits =
  | (Partial<Record<PaginationBreakpoint, number>> & { default: number })
  | (Record<PaginationBreakpoint, number> & { default?: number });

type PaginationControlRenderState = {
  disabled: boolean;
  page: number;
};

type PaginationPageRenderState = PaginationControlRenderState & {
  active: boolean;
};

type PaginationElementProps = Omit<
  HTMLAttributes<HTMLElement>,
  "aria-label" | "children" | "onChange"
>;

export type GlPaginationProps = PaginationElementProps & {
  /** Controls the pagination list's horizontal alignment. */
  align?: GlPaginationAlign;
  /** Content replacing the default left ellipsis. */
  ellipsisLeft?: ReactNode;
  /** Content replacing the default right ellipsis. */
  ellipsisRight?: ReactNode;
  /** Text displayed for collapsed page ranges. */
  ellipsisText?: string;
  /** Accessible label for the first page link. */
  labelFirstPage?: string;
  /** Accessible label for the last page link. */
  labelLastPage?: string;
  /** Accessible label for the pagination navigation landmark. */
  labelNav?: string;
  /** Accessible label for the next page control. */
  labelNextPage?: string;
  /** Accessible label or label generator for numbered page links. */
  labelPage?: string | ((page: number) => string);
  /** Accessible label for the previous page control. */
  labelPrevPage?: string;
  /** Generates page URLs. When present, navigation does not request a value change. */
  linkGen?: ((page: number) => string) | null;
  /** Maximum visible page links at each viewport breakpoint. */
  limits?: GlPaginationLimits;
  /** Next page marker used by compact pagination. */
  nextPage?: number | null;
  /** Called when an enabled next control is activated. */
  onNext?: () => void;
  /** Called when an enabled previous control is activated. */
  onPrevious?: () => void;
  /** Called when non-link navigation requests another page. */
  onValueChange?: (page: number) => void;
  /** Number of items displayed per page. Must be greater than zero. */
  perPage?: number;
  /** Previous page marker used by compact pagination. */
  prevPage?: number | null;
  /** Replaces the default next chevron. */
  renderNext?: (state: PaginationControlRenderState) => ReactNode;
  /** Replaces the default numbered page content. */
  renderPageNumber?: (state: PaginationPageRenderState) => ReactNode;
  /** Replaces the default previous chevron. */
  renderPrevious?: (state: PaginationControlRenderState) => ReactNode;
  /** Total number of available items. */
  totalItems?: number;
  /** Current page number. Must be greater than zero. */
  value?: number;
};

const DEFAULT_LIMIT = 9;
const RESIZE_DEBOUNCE_MS = 200;
const BREAKPOINTS = [
  ["xl", 1200],
  ["lg", 992],
  ["md", 768],
  ["sm", 576],
  ["xs", 0],
] as const satisfies ReadonlyArray<readonly [PaginationBreakpoint, number]>;
const DEFAULT_LIMITS: GlPaginationLimits = {
  default: DEFAULT_LIMIT,
  md: 9,
  sm: 3,
  xs: 0,
};

const paginationVariants = cva("gl-pagination");
const paginationListVariants = cva(null, {
  variants: {
    align: {
      center: "gl-justify-center",
      fill: "gl-text-center",
      left: null,
      right: "gl-justify-end",
    },
  },
  defaultVariants: {
    align: "left",
  },
});
const paginationListItemVariants = cva(null, {
  variants: {
    disabled: {
      false: null,
      true: "disabled",
    },
    fill: {
      false: null,
      true: "gl-flex-auto",
    },
  },
});
const paginationItemVariants = cva("gl-pagination-item", {
  variants: {
    active: {
      false: null,
      true: "active",
    },
  },
});

function getBreakpoint(width: number): PaginationBreakpoint | undefined {
  return BREAKPOINTS.find(([, minimumWidth]) => width > minimumWidth)?.[0];
}

function usePaginationBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<PaginationBreakpoint>();

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const updateBreakpoint = () => setBreakpoint(getBreakpoint(window.innerWidth));
    const handleResize = () => {
      if(timeoutId !== null) clearTimeout(timeoutId);
      timeoutId = setTimeout(updateBreakpoint, RESIZE_DEBOUNCE_MS);
    };

    updateBreakpoint();
    window.addEventListener("resize", handleResize);

    return () => {
      if(timeoutId !== null) clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return breakpoint;
}

function pageRange(from: number, to: number) {
  return Array.from({ length: Math.max(to - from + 1, 0) }, (_, index) => from + index);
}

function formatPageLabel(labelPage: GlPaginationProps["labelPage"], page: number) {
  if(typeof labelPage === "function") return labelPage(page);
  return labelPage!.replace(/%+/g, "%").replace(/%\{page\}/g, String(page));
}

const GlPagination = forwardRef<HTMLElement, GlPaginationProps>(function GlPagination({
  align = "left",
  className,
  ellipsisLeft,
  ellipsisRight,
  ellipsisText = "…",
  labelFirstPage = "Go to first page",
  labelLastPage = "Go to last page",
  labelNav = "Pagination",
  labelNextPage = "Go to next page",
  labelPage = "Go to page %{page}",
  labelPrevPage = "Go to previous page",
  linkGen = null,
  limits = DEFAULT_LIMITS,
  nextPage = null,
  onNext,
  onPrevious,
  onValueChange,
  perPage = 20,
  prevPage = null,
  renderNext,
  renderPageNumber,
  renderPrevious,
  totalItems = 0,
  value = 1,
  ...elementProps
}, forwardedRef) {
  const breakpoint = usePaginationBreakpoint();
  const totalPages = Math.ceil(totalItems / perPage);
  const isCompactPagination = Boolean(!totalItems && (prevPage || nextPage));
  const isVisible = totalPages > 1 || isCompactPagination;
  const isLinkBased = typeof linkGen === "function";
  const breakpointLimit = breakpoint ? limits[breakpoint] : undefined;
  const paginationLimit = breakpointLimit ?? limits.default ?? DEFAULT_LIMIT;
  const maxAdjacentPages = Math.max(Math.ceil((paginationLimit - 1) / 2), 0);
  const isFillAlign = align === "fill";

  if(!isVisible) return null;

  const pageIsDisabled = (page: number) => {
    if(page < 1) return true;
    if(!isCompactPagination) return page > totalPages;
    if(page < value) return !prevPage;
    if(page > value) return !nextPage;
    return false;
  };
  const labelForPage = (page: number) => formatPageLabel(labelPage, page);
  const previousPage = value - 1;
  const followingPage = value + 1;
  const prevPageIsDisabled = pageIsDisabled(previousPage);
  const nextPageIsDisabled = pageIsDisabled(followingPage);
  const previousState = { disabled: prevPageIsDisabled, page: previousPage };
  const nextState = { disabled: nextPageIsDisabled, page: followingPage };

  const handlePageClick = (event: MouseEvent<HTMLAnchorElement>, page: number) => {
    if(isLinkBased) return;
    event.preventDefault();
    onValueChange?.(page);
  };
  const handlePrevious = (event: MouseEvent<HTMLAnchorElement>) => {
    handlePageClick(event, previousPage);
    onPrevious?.();
  };
  const handleNext = (event: MouseEvent<HTMLAnchorElement>) => {
    handlePageClick(event, followingPage);
    onNext?.();
  };
  const hrefForPage = (page: number) => isLinkBased ? linkGen(page) : "#";
  const renderControl = (
    direction: "next" | "previous",
    state: PaginationControlRenderState,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => void,
  ) => {
    const isPrevious = direction === "previous";
    const content = isPrevious
      ? renderPrevious
        ? renderPrevious(state)
        : <GlIcon name="chevron-lg-left" />
      : renderNext
        ? renderNext(state)
        : <GlIcon name="chevron-lg-right" />;
    const ariaLabel = state.disabled
      ? undefined
      : (isPrevious ? labelPrevPage : labelNextPage) || labelForPage(state.page);
    const testId = `gl-pagination-${isPrevious ? "prev" : "next"}`;

    return (
      <li
        aria-hidden={state.disabled}
        className={paginationListItemVariants({ disabled: state.disabled, fill: isFillAlign })}
        data-testid="gl-pagination-li">
        {state.disabled ? (
          <span className="gl-pagination-item" data-testid={testId}>{content}</span>
        ) : (
          <GlLink
            aria-label={ariaLabel}
            className="gl-pagination-item"
            data-testid={testId}
            href={hrefForPage(state.page)}
            onClick={onClick}>
            {content}
          </GlLink>
        )}
      </li>
    );
  };

  const shouldCollapseLeftSide = (() => {
    const diff = value - maxAdjacentPages;
    return diff >= maxAdjacentPages && diff > 3 && totalPages > 4;
  })();
  const shouldCollapseRightSide = (
    totalPages - 2 - value > maxAdjacentPages && totalPages > 4
  );
  let firstPage = shouldCollapseLeftSide ? value - maxAdjacentPages : 1;
  firstPage = Math.min(firstPage, totalPages - 1);
  let lastPage = shouldCollapseRightSide ? value + maxAdjacentPages : totalPages;
  lastPage = Math.max(lastPage, 2);

  const visibleItems: ReactNode[] = [];
  if(!isCompactPagination) {
    const addPage = (page: number, overrideLabel?: string) => {
      const disabled = pageIsDisabled(page);
      const active = page === value;
      const state = { active, disabled, page };
      const content = renderPageNumber ? renderPageNumber(state) : page;
      const itemClassName = paginationItemVariants({ active });

      visibleItems.push(
        <li
          key={`page_${page}`}
          className={paginationListItemVariants({ disabled, fill: isFillAlign })}
          data-testid="gl-pagination-li">
          {disabled ? (
            <span
              aria-disabled="true"
              className={itemClassName}
              data-testid="gl-pagination-item">
              {content}
            </span>
          ) : (
            <GlLink
              aria-current={active ? "page" : undefined}
              aria-disabled={false}
              aria-label={overrideLabel || labelForPage(page)}
              className={itemClassName}
              data-testid="gl-pagination-item"
              href={hrefForPage(page)}
              onClick={(event) => handlePageClick(event, page)}>
              {content}
            </GlLink>
          )}
        </li>,
      );
    };
    const addEllipsis = (side: "left" | "right") => {
      visibleItems.push(
        <li
          key={`ellipsis_${side}`}
          className={paginationListItemVariants({ disabled: true, fill: isFillAlign })}
          data-testid="gl-pagination-li">
          <span
            aria-disabled="true"
            className="gl-pagination-item"
            data-testid="gl-pagination-item">
            {side === "left"
              ? ellipsisLeft === undefined ? ellipsisText : ellipsisLeft
              : ellipsisRight === undefined ? ellipsisText : ellipsisRight}
          </span>
        </li>,
      );
    };

    if(shouldCollapseLeftSide) {
      addPage(1, labelFirstPage);
      addEllipsis("left");
    }
    pageRange(firstPage, lastPage).forEach((page) => addPage(page));
    if(shouldCollapseRightSide) {
      addEllipsis("right");
      addPage(totalPages, labelLastPage);
    }
  }

  return (
    <nav
      {...elementProps}
      ref={forwardedRef}
      aria-label={labelNav}
      className={paginationVariants({ className })}>
      <ul className={paginationListVariants({ align })}>
        {renderControl("previous", previousState, handlePrevious)}
        {visibleItems}
        {renderControl("next", nextState, handleNext)}
      </ul>
    </nav>
  );
});

export default GlPagination;
