import { useCallback, useMemo, useState } from "react";

export type GlSortingSortBy = string | number | null;

export type GlSortingOption = {
  value: string | number;
  text: string;
  /** Disables direction changes for fields such as "Most relevant". */
  directionToggleDisabled?: boolean;
};

export type UseSortingOptions = {
  sortOptions?: readonly GlSortingOption[];
  sortBy?: GlSortingSortBy;
  defaultSortBy?: GlSortingSortBy;
  isAscending?: boolean;
  defaultIsAscending?: boolean;
  onSortByChange?: (sortBy: GlSortingSortBy) => void;
  onSortDirectionChange?: (isAscending: boolean) => void;
};

export type UseSortingResult = {
  sortBy: GlSortingSortBy;
  isAscending: boolean;
  selectedSortOption: GlSortingOption | undefined;
  directionToggleDisabled: boolean;
  setSortBy: (sortBy: GlSortingSortBy) => void;
  setIsAscending: (isAscending: boolean) => void;
  toggleSortDirection: () => void;
  sortingProps: {
    sortOptions: readonly GlSortingOption[];
    sortBy: GlSortingSortBy;
    isAscending: boolean;
    onSortByChange: (sortBy: GlSortingSortBy) => void;
    onSortDirectionChange: (isAscending: boolean) => void;
  };
};

const EMPTY_SORT_OPTIONS: readonly GlSortingOption[] = [];

/**
 * Manages independent controlled or uncontrolled sort field and direction.
 * Data sorting, persistence, and fetching belong to the caller.
 */
export function useSorting({
  sortOptions = EMPTY_SORT_OPTIONS,
  sortBy: controlledSortBy,
  defaultSortBy = null,
  isAscending: controlledIsAscending,
  defaultIsAscending = false,
  onSortByChange,
  onSortDirectionChange,
}: UseSortingOptions = {}): UseSortingResult {
  const [uncontrolledSortBy, setUncontrolledSortBy] = useState(defaultSortBy);
  const [uncontrolledIsAscending, setUncontrolledIsAscending] = useState(defaultIsAscending);
  const sortBy = controlledSortBy === undefined ? uncontrolledSortBy : controlledSortBy;
  const isAscending = controlledIsAscending === undefined
    ? uncontrolledIsAscending
    : controlledIsAscending;
  const selectedSortOption = useMemo(
    () => sortOptions.find((option) => option.value === sortBy),
    [sortBy, sortOptions],
  );
  const directionToggleDisabled = Boolean(selectedSortOption?.directionToggleDisabled);

  const setSortBy = useCallback((nextSortBy: GlSortingSortBy) => {
    if(nextSortBy === sortBy) return;
    if(controlledSortBy === undefined) setUncontrolledSortBy(nextSortBy);
    onSortByChange?.(nextSortBy);
  }, [controlledSortBy, onSortByChange, sortBy]);

  const setIsAscending = useCallback((nextIsAscending: boolean) => {
    if(directionToggleDisabled || nextIsAscending === isAscending) return;
    if(controlledIsAscending === undefined) setUncontrolledIsAscending(nextIsAscending);
    onSortDirectionChange?.(nextIsAscending);
  }, [controlledIsAscending, directionToggleDisabled, isAscending, onSortDirectionChange]);

  const toggleSortDirection = useCallback(() => {
    setIsAscending(!isAscending);
  }, [isAscending, setIsAscending]);

  const sortingProps = useMemo(() => ({
    sortOptions,
    sortBy,
    isAscending,
    onSortByChange: setSortBy,
    onSortDirectionChange: setIsAscending,
  }), [isAscending, setIsAscending, setSortBy, sortBy, sortOptions]);

  return {
    sortBy,
    isAscending,
    selectedSortOption,
    directionToggleDisabled,
    setSortBy,
    setIsAscending,
    toggleSortDirection,
    sortingProps,
  };
}
