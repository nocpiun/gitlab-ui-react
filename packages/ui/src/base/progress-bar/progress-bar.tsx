/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/progress_bar/progress_bar.vue
 */

import { forwardRef, type HTMLAttributes } from "react";
import { cva } from "class-variance-authority";

export type GlProgressBarVariant = "primary" | "success" | "warning" | "danger";

type ProgressBarElementProps = Omit<HTMLAttributes<HTMLDivElement>, "aria-label" | "children">;

export type GlProgressBarProps = ProgressBarElementProps & {
  /** Accessible label for the progress bar, applied to the `progressbar` indicator. */
  "aria-label"?: string;
  /** Custom height as a CSS dimension (e.g. `"8px"`, `"1rem"`). Defaults to `1rem`. */
  height?: string;
  /** Maximum value; `value` is expressed as a fraction of this. Non-positive values fall back to `100`. */
  max?: number | string;
  /** Current progress value, between `0` and `max`. Non-numeric values fall back to `0`. */
  value?: number | string;
  /** Visual variant of the progress indicator. */
  variant?: GlProgressBarVariant;
};

const progressTrackVariants = cva(["gl-progress-bar", "progress"]);

const progressVariants = cva("gl-progress", {
  variants: {
    variant: {
      danger: "gl-progress-bar-danger",
      primary: "gl-progress-bar-primary",
      success: "gl-progress-bar-success",
      warning: "gl-progress-bar-warning",
    },
  },
});

const toFloat = (value: number | string, fallback: number): number => {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const GlProgressBar = forwardRef<HTMLDivElement, GlProgressBarProps>(function GlProgressBar({
  "aria-label": ariaLabel = "Progress bar",
  className,
  height,
  max = 100,
  style,
  value = 0,
  variant = "primary",
  ...elementProps
}, forwardedRef) {
  const computedValue = toFloat(value, 0);
  const parsedMax = toFloat(max, 100);
  const computedMax = parsedMax > 0 ? parsedMax : 100;

  return (
    <div
      {...elementProps}
      ref={forwardedRef}
      className={progressTrackVariants({ className })}
      style={height == null ? style : { ...style, height }}>
      <div
        aria-label={ariaLabel}
        aria-valuemax={computedMax}
        aria-valuemin={0}
        aria-valuenow={computedValue}
        className={progressVariants({ variant })}
        role="progressbar"
        style={{ transform: `scaleX(${computedValue / computedMax})` }} />
    </div>
  );
});

export default GlProgressBar;
