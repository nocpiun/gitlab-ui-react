/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/form/form_character_count/form_character_count.vue
 *
 * Adaptations:
 * - The `remaining-count-text` and `over-limit-text` scoped slots map to the
 *   required `remainingCountText` and `overLimitText` render props, each
 *   receiving the (absolute) character count.
 * - The visible count is derived from `value` during render, matching the
 *   upstream watcher's immediate update. Only the screen-reader-only text is
 *   debounced by 1s (via an effect), like upstream's lodash `debounce`, so
 *   screen readers announce the count after the textarea text.
 */

import { useEffect, useState, type ReactNode } from "react";
import { cva } from "class-variance-authority";

export type GlFormCharacterCountProps = {
  /** Input value. */
  value?: string | null;
  /** Character count limit for the input. */
  limit: number;
  /**
   * `id` attribute for the screen-reader-only character count text. The input
   * should reference it with `aria-describedby={countTextId}`.
   */
  countTextId: string;
  /** Internationalized over-limit text; receives the number of characters over the limit. */
  overLimitText: (count: number) => ReactNode;
  /** Internationalized remaining-count text; receives the number of remaining characters. */
  remainingCountText: (count: number) => ReactNode;
};

// Upstream debounce delay for the screen-reader announcement.
const SR_ONLY_UPDATE_DELAY = 1000;

function valueLength(value: string | null | undefined): number {
  return value?.length ?? 0;
}

const countTextVariants = cva("form-text", {
  variants: {
    state: {
      over: "gl-text-danger",
      under: "gl-text-subtle",
    },
  },
});

export default function GlFormCharacterCount({
  value = "",
  limit,
  countTextId,
  overLimitText,
  remainingCountText,
}: GlFormCharacterCountProps) {
  const remainingCount = limit - valueLength(value);

  // The screen-reader-only count starts in sync and trails visible updates by
  // the debounce delay (upstream `debouncedUpdateRemainingCountSrOnly`).
  const [remainingCountSrOnly, setRemainingCountSrOnly] = useState(remainingCount);
  useEffect(() => {
    const timer = setTimeout(() => setRemainingCountSrOnly(remainingCount), SR_ONLY_UPDATE_DELAY);
    return () => clearTimeout(timer);
  }, [remainingCount]);

  const isOverLimit = remainingCount < 0;
  const isOverLimitSrOnly = remainingCountSrOnly < 0;

  return (
    <div className="gl-form-character-count">
      <small className={countTextVariants({ state: isOverLimit ? "over" : "under" })} aria-hidden="true">
        {isOverLimit ? overLimitText(Math.abs(remainingCount)) : remainingCountText(remainingCount)}
      </small>
      <div id={countTextId} className="gl-sr-only" aria-live="polite" data-testid="count-text-sr-only">
        {isOverLimitSrOnly
          ? overLimitText(Math.abs(remainingCountSrOnly))
          : remainingCountText(remainingCountSrOnly)}
      </div>
    </div>
  );
}
