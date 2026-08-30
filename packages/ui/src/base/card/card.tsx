/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/card/card.vue
 *
 * The upstream single-component slot API (header/default/footer slots with
 * headerClass/bodyClass/footerClass props) is expressed as compositional
 * subcomponents: GlCardHeader, GlCardContent (the upstream `gl-card-body`),
 * and GlCardFooter. Render only the subcomponents you need; the upstream
 * conditional rendering of header and footer follows naturally.
 */

import { forwardRef, type HTMLAttributes } from "react";
import { cva } from "class-variance-authority";

export type GlCardProps = HTMLAttributes<HTMLDivElement>;
export type GlCardHeaderProps = HTMLAttributes<HTMLDivElement>;
export type GlCardContentProps = HTMLAttributes<HTMLDivElement>;
export type GlCardFooterProps = HTMLAttributes<HTMLDivElement>;

const cardVariants = cva("gl-card");
const cardHeaderVariants = cva("gl-card-header");
const cardContentVariants = cva("gl-card-body");
const cardFooterVariants = cva("gl-card-footer");

const GlCard = forwardRef<HTMLDivElement, GlCardProps>(function GlCard({
  className,
  ...elementProps
}, forwardedRef) {
  return (
    <div
      {...elementProps}
      ref={forwardedRef}
      className={cardVariants({ className })} />
  );
});

export const GlCardHeader = forwardRef<HTMLDivElement, GlCardHeaderProps>(function GlCardHeader({
  className,
  ...elementProps
}, forwardedRef) {
  return (
    <div
      {...elementProps}
      ref={forwardedRef}
      className={cardHeaderVariants({ className })} />
  );
});

export const GlCardContent = forwardRef<HTMLDivElement, GlCardContentProps>(function GlCardContent({
  className,
  ...elementProps
}, forwardedRef) {
  return (
    <div
      {...elementProps}
      ref={forwardedRef}
      className={cardContentVariants({ className })} />
  );
});

export const GlCardFooter = forwardRef<HTMLDivElement, GlCardFooterProps>(function GlCardFooter({
  className,
  ...elementProps
}, forwardedRef) {
  return (
    <div
      {...elementProps}
      ref={forwardedRef}
      className={cardFooterVariants({ className })} />
  );
});

export default GlCard;
