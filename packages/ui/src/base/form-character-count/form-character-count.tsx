/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/form/form_character_count/form_character_count.vue
 *
 * Adaptations:
 * - The `remaining-count-text` and `over-limit-text` scoped slots map to the
 *   `remainingCountText` and `overLimitText` value props. This component does
 *   not accept `children`.
 * - The screen-reader text itself is retained during the one-second debounce,
 *   replacing upstream's retained count because formatting now happens in the
 *   consumer before the value is passed as a prop.
 */

import { useEffect, useState, type HTMLAttributes, type ReactNode } from "react";
import { cva } from "class-variance-authority";
import clsx from "clsx";

const countTextVariants = cva("form-text", {
  variants: {
    overLimit: {
      false: "gl-text-subtle",
      true: "gl-text-danger",
    },
  },
});

type RootProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "dangerouslySetInnerHTML">;

export type GlFormCharacterCountProps = RootProps & {
  /** Prevents the Vue slots from being represented as unnamed React content. */
  children?: never;
  /** ID for the polite live region. The associated input should reference it with `aria-describedby`. */
  countTextId: string;
  /** Internationalized text to render when the value is over the limit. */
  overLimitText: ReactNode;
  /** Internationalized text to render while the value is at or under the limit. */
  remainingCountText: ReactNode;
  /** Character count limit for the input. */
  limit: number;
  /** Current input value. */
  value?: string | null;
};

const SCREEN_READER_UPDATE_DELAY = 1000;

export default function GlFormCharacterCount({
  className,
  countTextId,
  limit,
  overLimitText,
  remainingCountText,
  value = "",
  ...elementProps
}: GlFormCharacterCountProps) {
  const remainingCount = limit - (value?.length ?? 0);
  const isOverLimit = remainingCount < 0;
  const currentText = isOverLimit ? overLimitText : remainingCountText;
  const [screenReaderText, setScreenReaderText] = useState(currentText);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setScreenReaderText(currentText);
    }, SCREEN_READER_UPDATE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [currentText]);

  return (
    <div {...elementProps} className={clsx("gl-form-character-count", className)}>
      <small className={countTextVariants({ overLimit: isOverLimit })} aria-hidden="true">
        {currentText}
      </small>
      <div
        id={countTextId}
        className="gl-sr-only"
        aria-live="polite"
        data-testid="count-text-sr-only">
        {screenReaderText}
      </div>
    </div>
  );
}
