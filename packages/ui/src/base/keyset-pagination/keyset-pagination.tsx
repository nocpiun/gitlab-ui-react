/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/keyset_pagination/keyset_pagination.vue
 *
 * Adaptations:
 * - Vue's prev/next events map to onPrevious/onNext callbacks.
 * - The two content slots map to previousButtonContent and nextButtonContent.
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cva } from "class-variance-authority";
import GlButton from "../button/button.js";
import GlButtonGroup from "../button-group/button-group.js";
import GlIcon from "../icon/icon.js";

type KeysetPaginationElementProps = Omit<
  HTMLAttributes<HTMLElement>,
  "aria-label" | "children"
>;

export type GlKeysetPaginationProps = KeysetPaginationElementProps & {
  /** Disables both controls regardless of the available-page flags. */
  disabled?: boolean;
  /** Cursor for the last item in the current page. */
  endCursor?: string | null;
  /** Whether a next page is available. */
  hasNextPage?: boolean;
  /** Whether a previous page is available. */
  hasPreviousPage?: boolean;
  /** Accessible label for the pagination navigation landmark. */
  navigationLabel?: string;
  /** Link destination for the next control. Empty values render a button. */
  nextButtonLink?: string | null;
  /** Content replacing the default next text and icon. */
  nextButtonContent?: ReactNode;
  /** Text displayed in the next control. */
  nextText?: string;
  /** Called with endCursor when the enabled next control is activated. */
  onNext?: (endCursor: string | null) => void;
  /** Called with startCursor when the enabled previous control is activated. */
  onPrevious?: (startCursor: string | null) => void;
  /** Link destination for the previous control. Empty values render a button. */
  prevButtonLink?: string | null;
  /** Content replacing the default previous text and icon. */
  previousButtonContent?: ReactNode;
  /** Text displayed in the previous control. */
  prevText?: string;
  /** Cursor for the first item in the current page. */
  startCursor?: string | null;
};

const paginationVariants = cva("gl-pagination");
const buttonGroupVariants = cva(["gl-keyset-pagination", "gl-gap-3"]);

const GlKeysetPagination = forwardRef<HTMLElement, GlKeysetPaginationProps>(
  function GlKeysetPagination({
    className,
    disabled = false,
    endCursor = null,
    hasNextPage = false,
    hasPreviousPage = false,
    navigationLabel = "Pagination",
    nextButtonContent,
    nextButtonLink = null,
    nextText = "Next",
    onNext,
    onPrevious,
    prevButtonLink = null,
    previousButtonContent,
    prevText = "Previous",
    startCursor = null,
    ...elementProps
  }, forwardedRef) {
    if(!hasPreviousPage && !hasNextPage) return null;

    return (
      <nav
        {...elementProps}
        ref={forwardedRef}
        aria-label={navigationLabel}
        className={paginationVariants({ className })}>
        <GlButtonGroup className={buttonGroupVariants()}>
          <GlButton
            category="tertiary"
            data-testid="prevButton"
            disabled={disabled || !hasPreviousPage}
            href={prevButtonLink || undefined}
            onClick={() => onPrevious?.(startCursor)}>
            {previousButtonContent === undefined ? (
              <span className="gl-align-center gl-flex">
                <GlIcon className="gl-mr-2" name="chevron-lg-left" />
                {prevText}
              </span>
            ) : previousButtonContent}
          </GlButton>
          <GlButton
            category="tertiary"
            data-testid="nextButton"
            disabled={disabled || !hasNextPage}
            href={nextButtonLink || undefined}
            onClick={() => onNext?.(endCursor)}>
            {nextButtonContent === undefined ? (
              <span className="gl-align-center gl-flex">
                {nextText}
                <GlIcon className="gl-ml-2" name="chevron-lg-right" />
              </span>
            ) : nextButtonContent}
          </GlButton>
        </GlButtonGroup>
      </nav>
    );
  },
);

export default GlKeysetPagination;
