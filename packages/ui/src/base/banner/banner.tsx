/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/banner/banner.vue
 *
 * Adaptations:
 * - Vue's default and `actions` slots map to `children` and `actions`.
 * - The `close` and `primary` events map to `onClose` and `onPrimary`.
 * - Illustration props and rendering are intentionally omitted from this port.
 * - The upstream i18n default for the dismiss label resolves to "Dismiss";
 *   this package has no i18n runtime.
 */

import {
  forwardRef,
  type HTMLAttributes,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import { cva } from "class-variance-authority";
import GlButton, { type GlButtonProps } from "../button/button";
import GlCard, { GlCardContent } from "../card/card";

export type GlBannerVariant = "promotion" | "introduction";

type GlBannerButtonAttributes = Omit<
  GlButtonProps,
  "category" | "children" | "href" | "onClick" | "variant"
>;

export type GlBannerProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "onClose" | "title"
> & {
  /** Content rendered after the banner message. */
  actions?: ReactNode;
  /** Additional attributes passed to the primary action button. */
  buttonAttributes?: GlBannerButtonAttributes;
  /** If provided, renders the primary action as a link. */
  buttonLink?: string | null;
  /** Text displayed by the primary action button. */
  buttonText: string;
  /** The banner message. */
  children?: ReactNode;
  /** The close button's accessible label. */
  dismissLabel?: string;
  /** Called when the close button is clicked. */
  onClose?: MouseEventHandler<HTMLElement>;
  /** Called when the primary action is clicked. */
  onPrimary?: MouseEventHandler<HTMLElement>;
  /** The banner title. */
  title: string;
  /** Visual treatment of the banner. */
  variant?: GlBannerVariant;
};

const bannerVariants = cva([
  "gl-banner",
  "gl-py-6",
  "gl-pl-6",
  "gl-pr-8",
], {
  variants: {
    variant: {
      introduction: "gl-banner-introduction",
      promotion: null,
    },
  },
  defaultVariants: {
    variant: "promotion",
  },
});

const GlBanner = forwardRef<HTMLDivElement, GlBannerProps>(function GlBanner({
  actions,
  buttonAttributes,
  buttonLink = null,
  buttonText,
  children,
  className,
  dismissLabel = "Dismiss",
  onClose,
  onPrimary,
  title,
  variant = "promotion",
  ...elementProps
}, forwardedRef) {
  return (
    <GlCard
      {...elementProps}
      ref={forwardedRef}
      className={bannerVariants({ className, variant })}>
      <GlCardContent className="gl-flex gl-bg-transparent !gl-p-0">
        <div className="gl-banner-content">
          <h2 className="gl-banner-title">{title}</h2>
          {children}
          <GlButton
            {...buttonAttributes}
            category="primary"
            data-testid="gl-banner-primary-button"
            href={buttonLink ?? undefined}
            onClick={onPrimary}
            variant="confirm">
            {buttonText}
          </GlButton>
          {actions}
        </div>
        <GlButton
          aria-label={dismissLabel}
          category="tertiary"
          className="gl-banner-close"
          icon="close"
          onClick={onClose}
          size="small" />
      </GlCardContent>
    </GlCard>
  );
});

export default GlBanner;
