/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/banner/banner.vue
 *
 * Adaptations:
 * - Vue's title prop and content/action slots map to optional compound helpers.
 * - The `close` event maps to `onClose`; action behavior belongs to the
 *   controls composed inside `GlBannerActions`.
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
import GlButton from "../button/button";
import GlCard, { GlCardContent } from "../card/card";

export type GlBannerVariant = "promotion" | "introduction";

export type GlBannerProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "onClose" | "title"
> & {
  /** Banner content. The compound helpers provide the standard layout. */
  children?: ReactNode;
  /** The close button's accessible label. */
  dismissLabel?: string;
  /** Called when the close button is clicked. */
  onClose?: MouseEventHandler<HTMLElement>;
  /** Visual treatment of the banner. */
  variant?: GlBannerVariant;
};

export type GlBannerTitleProps = HTMLAttributes<HTMLHeadingElement>;
export type GlBannerDescriptionProps = HTMLAttributes<HTMLDivElement>;
export type GlBannerActionsProps = HTMLAttributes<HTMLDivElement>;

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
const bannerTitleVariants = cva("gl-banner-title");
const bannerDescriptionVariants = cva("gl-banner-description");
const bannerActionsVariants = cva("gl-banner-actions");

export const GlBannerTitle = forwardRef<HTMLHeadingElement, GlBannerTitleProps>(
  function GlBannerTitle({ className, ...elementProps }, forwardedRef) {
    return (
      <h2
        {...elementProps}
        ref={forwardedRef}
        className={bannerTitleVariants({ className })} />
    );
  },
);

export const GlBannerDescription = forwardRef<HTMLDivElement, GlBannerDescriptionProps>(
  function GlBannerDescription({ className, ...elementProps }, forwardedRef) {
    return (
      <div
        {...elementProps}
        ref={forwardedRef}
        className={bannerDescriptionVariants({ className })} />
    );
  },
);

export const GlBannerActions = forwardRef<HTMLDivElement, GlBannerActionsProps>(
  function GlBannerActions({ className, ...elementProps }, forwardedRef) {
    return (
      <div
        {...elementProps}
        ref={forwardedRef}
        className={bannerActionsVariants({ className })} />
    );
  },
);

const GlBanner = forwardRef<HTMLDivElement, GlBannerProps>(function GlBanner({
  children,
  className,
  dismissLabel = "Dismiss",
  onClose,
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
          {children}
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
