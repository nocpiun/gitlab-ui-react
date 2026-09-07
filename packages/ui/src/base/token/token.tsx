/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/token/token.vue
 */

import {
  forwardRef,
  type HTMLAttributes,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import { cva } from "class-variance-authority";
import GlButton from "../button/button";

export type GlTokenVariant = "default" | "search-type" | "search-value";

export type GlTokenProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  children?: ReactNode;
  /** Accessible name for the remove button. */
  removeLabel?: string;
  /** Called when the token's remove button is activated. */
  onRemove?: MouseEventHandler<HTMLElement>;
  variant?: GlTokenVariant;
  /** Hides the remove button and applies the read-only spacing. */
  viewOnly?: boolean;
};

const tokenVariants = cva("gl-token", {
  variants: {
    variant: {
      default: null,
      "search-type": "gl-token-search-type-variant",
      "search-value": "gl-token-search-value-variant",
    },
    viewOnly: {
      false: null,
      true: "gl-token-view-only",
    },
  },
  defaultVariants: {
    variant: "default",
    viewOnly: false,
  },
});

const GlToken = forwardRef<HTMLSpanElement, GlTokenProps>(function GlToken({
  children,
  className,
  onRemove,
  removeLabel = "Remove",
  variant = "default",
  viewOnly = false,
  ...spanProps
}, forwardedRef) {
  return (
    <span
      {...spanProps}
      ref={forwardedRef}
      className={tokenVariants({ className, variant, viewOnly })}>
      <span className="gl-token-content">
        {children}
        {!viewOnly ? (
          <GlButton
            aria-label={removeLabel}
            category="tertiary"
            className="gl-token-close"
            icon="close"
            onClick={onRemove}
            size="small" />
        ) : null}
      </span>
    </span>
  );
});

export default GlToken;
