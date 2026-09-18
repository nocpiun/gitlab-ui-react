/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/sorting/sorting.vue
 */

import { forwardRef, useId, type HTMLAttributes } from "react";
import { cva } from "class-variance-authority";
import GlButton from "../button/button.js";
import GlButtonGroup from "../button-group/button-group.js";
import GlListbox, {
  GlListboxContent,
  GlListboxItem,
  GlListboxTrigger,
} from "../listbox/listbox.js";
import GlTooltip, {
  GlTooltipContent,
  GlTooltipTrigger,
} from "../tooltip/tooltip.js";
import { useSorting, type UseSortingOptions } from "./use-sorting.js";

type SortingElementProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "defaultValue" | "onChange" | "role"
>;

export type GlSortingProps = SortingElementProps & UseSortingOptions & {
  /** Overrides the selected option's text when non-empty. */
  text?: string | null;
  /** Expands the dropdown trigger to its container width. Defaults to true. */
  block?: boolean;
  /** Screen-reader prefix for the selected field. Defaults to "Sort by:". */
  sortByLabel?: string;
  /** Overrides both the direction tooltip and accessible name when non-empty. */
  sortDirectionTooltip?: string | null;
  dropdownClassName?: string;
  dropdownToggleClassName?: string;
  sortDirectionToggleClassName?: string;
};

const sortingVariants = cva(["gl-sorting", "gl-flex"]);
const dropdownVariants = cva("gl-w-full");
const directionVariants = cva("sorting-direction-button");

const GlSorting = forwardRef<HTMLDivElement, GlSortingProps>(function GlSorting({
  sortOptions,
  sortBy,
  defaultSortBy,
  isAscending,
  defaultIsAscending,
  onSortByChange,
  onSortDirectionChange,
  text = "",
  block = true,
  sortByLabel = "Sort by:",
  sortDirectionTooltip,
  className,
  dropdownClassName,
  dropdownToggleClassName,
  sortDirectionToggleClassName,
  ...elementProps
}, forwardedRef) {
  const sorting = useSorting({
    sortOptions,
    sortBy,
    defaultSortBy,
    isAscending,
    defaultIsAscending,
    onSortByChange,
    onSortDirectionChange,
  });
  const labelId = useId();
  const textId = useId();
  const selectedText = sorting.selectedSortOption?.text ?? "";
  const directionText = sortDirectionTooltip || (
    sorting.directionToggleDisabled
      ? selectedText
        ? `Sort direction unavailable for ${selectedText}`
        : "Sort direction unavailable"
      : sorting.isAscending
        ? "Sort direction: ascending"
        : "Sort direction: descending"
  );

  return (
    <GlButtonGroup
      {...elementProps}
      ref={forwardedRef}
      className={sortingVariants({ className })}>
      <GlListbox
        className={dropdownVariants({ className: dropdownClassName })}
        onValueChange={sorting.setSortBy}
        value={sorting.sortBy}>
        <GlListboxTrigger
          aria-labelledby={`${labelId} ${textId}`}
          block={block}
          className={dropdownToggleClassName}>
          <span id={textId}>{text || selectedText}</span>
        </GlListboxTrigger>
        <GlListboxContent placement="bottom-end">
          {sorting.sortingProps.sortOptions.map((option) => (
            <GlListboxItem key={`${typeof option.value}:${option.value}`} value={option.value}>
              {option.text}
            </GlListboxItem>
          ))}
        </GlListboxContent>
      </GlListbox>
      <span className="gl-sr-only" id={labelId}>{sortByLabel}</span>
      <GlTooltip>
        <GlTooltipTrigger asChild>
          <GlButton
            aria-label={directionText}
            className={directionVariants({ className: sortDirectionToggleClassName })}
            disabled={sorting.directionToggleDisabled}
            icon={sorting.isAscending ? "sort-lowest" : "sort-highest"}
            onClick={sorting.toggleSortDirection} />
        </GlTooltipTrigger>
        <GlTooltipContent>{directionText}</GlTooltipContent>
      </GlTooltip>
    </GlButtonGroup>
  );
});

export default GlSorting;
