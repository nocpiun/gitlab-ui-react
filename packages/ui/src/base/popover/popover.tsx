/**
 * Ported from packages/gitlab-ui/src/components/base/popover/popover.vue in
 * gitlab-org/gitlab-services/design.gitlab.com.
 *
 * Vue's target, slots, and close-button flag are expressed as a Base UI trigger
 * and optional header, title, body, and close parts. Click is the default
 * trigger, following the current Pajamas behavior guidance; hover is opt-in.
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { cva } from "class-variance-authority";
import GlButton from "../button/button";

export type GlPopoverPlacement = "top" | "right" | "bottom" | "left";

export type GlPopoverProps = BasePopover.Root.Props;
export type GlPopoverTriggerProps = BasePopover.Trigger.Props;
export type GlPopoverHeaderProps = HTMLAttributes<HTMLDivElement>;
export type GlPopoverTitleProps = BasePopover.Title.Props;
export type GlPopoverBodyProps = HTMLAttributes<HTMLDivElement>;
export type GlPopoverCloseProps = BasePopover.Close.Props;

export type GlPopoverContentProps = Omit<BasePopover.Popup.Props, "children" | "className"> & {
  /** Padding in pixels between the popup and viewport edge. */
  boundaryPadding?: number;
  children?: ReactNode;
  className?: string;
  /** Portal target. Set this to a wrapper around the trigger to preserve reading order. */
  container?: BasePopover.Portal.Props["container"];
  /** Preferred side; Base UI flips the popup if there is insufficient space. */
  placement?: GlPopoverPlacement;
};

const popupVariants = cva("popover gl-popover", {
  variants: {
    side: {
      top: "bs-popover-top",
      right: "bs-popover-right",
      bottom: "bs-popover-bottom",
      left: "bs-popover-left",
    },
  },
});
const headerVariants = cva("popover-header");
const titleVariants = cva("gl-popover-title");
const bodyVariants = cva("popover-body");
const closeVariants = cva("gl-popover-close");

export default function GlPopover(props: GlPopoverProps) {
  return <BasePopover.Root {...props} />;
}

export const GlPopoverTrigger = forwardRef<HTMLButtonElement, GlPopoverTriggerProps>(
  function GlPopoverTrigger(props, forwardedRef) {
    return <BasePopover.Trigger {...props} ref={forwardedRef} />;
  },
);

export const GlPopoverContent = forwardRef<HTMLDivElement, GlPopoverContentProps>(
  function GlPopoverContent({
    boundaryPadding = 5,
    children,
    className,
    container,
    initialFocus = false,
    placement = "top",
    ...popupProps
  }, forwardedRef) {
    const content = (
      <BasePopover.Positioner
        className="gl-popover-positioner"
        collisionPadding={boundaryPadding}
        side={placement}
        sideOffset={4}>
        <BasePopover.Popup
          {...popupProps}
          ref={forwardedRef}
          className={(state) => popupVariants({
            className,
            side: state.side === "top" || state.side === "right"
              || state.side === "bottom" || state.side === "left"
              ? state.side : placement,
          })}
          initialFocus={initialFocus}>
          <BasePopover.Arrow className="arrow" />
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    );

    return <BasePopover.Portal container={container}>{content}</BasePopover.Portal>;
  },
);

export const GlPopoverHeader = forwardRef<HTMLDivElement, GlPopoverHeaderProps>(
  function GlPopoverHeader({ className, ...elementProps }, forwardedRef) {
    return <div {...elementProps} ref={forwardedRef} className={headerVariants({ className })} />;
  },
);

export const GlPopoverTitle = forwardRef<HTMLHeadingElement, GlPopoverTitleProps>(
  function GlPopoverTitle({ className, ...titleProps }, forwardedRef) {
    return (
      <BasePopover.Title
        {...titleProps}
        ref={forwardedRef}
        className={titleVariants({ className })} />
    );
  },
);

export const GlPopoverBody = forwardRef<HTMLDivElement, GlPopoverBodyProps>(
  function GlPopoverBody({ className, ...elementProps }, forwardedRef) {
    return <div {...elementProps} ref={forwardedRef} className={bodyVariants({ className })} />;
  },
);

export const GlPopoverClose = forwardRef<HTMLButtonElement, GlPopoverCloseProps>(
  function GlPopoverClose({ "aria-label": ariaLabel = "Close", className, render, ...closeProps }, forwardedRef) {
    return (
      <BasePopover.Close
        {...closeProps}
        ref={forwardedRef}
        aria-label={ariaLabel}
        className={closeVariants({ className })}
        render={render ?? <GlButton category="tertiary" icon="close" size="small" />} />
    );
  },
);
