/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/loading_icon/loading_icon.vue
 */

import {
  forwardRef,
  type HTMLAttributes,
  type Ref,
} from "react";
import { cva } from "class-variance-authority";

export type GlLoadingIconColor = "dark" | "light";
export type GlLoadingIconSize = "sm" | "md" | "lg" | "xl";
export type GlLoadingIconVariant = "dots" | "spinner";

type LoadingIconElementProps = Omit<
  HTMLAttributes<HTMLElement>,
  "children" | "color"
>;

export type GlLoadingIconProps = LoadingIconElementProps & {
  /** Color treatment for normal (`dark`) or persistently dark (`light`) backgrounds. */
  color?: GlLoadingIconColor;
  /** Uses a `span` root instead of a `div`. */
  inline?: boolean;
  /** Accessible name announced with the status role. */
  label?: string;
  /** Visual size of the loading indicator. */
  size?: GlLoadingIconSize;
  /** Shape of the indeterminate loading indicator. */
  variant?: GlLoadingIconVariant;
};

const spinnerContainerVariants = cva("gl-spinner-container");

const spinnerVariants = cva(["!gl-align-text-bottom", "gl-spinner"], {
  variants: {
    color: {
      dark: "gl-spinner-dark",
      light: "gl-spinner-light",
    },
    size: {
      sm: "gl-spinner-sm",
      md: "gl-spinner-md",
      lg: "gl-spinner-lg",
      xl: "gl-spinner-xl",
    },
  },
  defaultVariants: {
    color: "dark",
    size: "sm",
  },
});

const dotsVariants = cva("gl-dots-loader", {
  variants: {
    color: {
      dark: "gl-dots-loader-dark",
      light: "gl-dots-loader-light",
    },
    size: {
      sm: "gl-dots-loader-sm",
      md: "gl-dots-loader-md",
      lg: "gl-dots-loader-lg",
      xl: "gl-dots-loader-xl",
    },
  },
  defaultVariants: {
    color: "dark",
    size: "sm",
  },
});

const GlLoadingIcon = forwardRef<HTMLElement, GlLoadingIconProps>(function GlLoadingIcon({
  "aria-label": ariaLabel,
  className,
  color = "dark",
  inline = false,
  label = "Loading",
  role = "status",
  size = "sm",
  variant = "spinner",
  ...elementProps
}, forwardedRef) {
  const accessibleLabel = ariaLabel ?? label;
  const isSpinner = variant === "spinner";
  const rootClassName = isSpinner
    ? spinnerContainerVariants({ className })
    : dotsVariants({ className, color, size });
  const indicator = isSpinner
    ? <span className={spinnerVariants({ color, size })} />
    : <span />;
  const rootProps: HTMLAttributes<HTMLElement> = {
    ...elementProps,
    "aria-label": accessibleLabel,
    className: rootClassName,
    role,
  };

  if(inline) {
    return (
      <span {...rootProps} ref={forwardedRef as Ref<HTMLSpanElement>}>
        {indicator}
      </span>
    );
  }

  return (
    <div {...rootProps} ref={forwardedRef as Ref<HTMLDivElement>}>
      {indicator}
    </div>
  );
});

export default GlLoadingIcon;
