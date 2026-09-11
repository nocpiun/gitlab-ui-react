/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/tooltip/tooltip.vue
 *
 * The upstream `target` prop and default slot map to compound React parts.
 * Base UI supplies positioning, dismissal, portal, and tooltip interactions.
 * The upstream `show` model maps to open/defaultOpen/onOpenChange.
 */

import type { GlOverlayOpenChangeDetails } from "../../internal/overlay/overlay-types";
import {
  cloneElement,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { cva } from "class-variance-authority";
import {
  resolveTriggerContent,
  resolveTriggerRender,
  type GlTriggerAsChildProps,
} from "../../internal/trigger/trigger-composition";
import { mapOverlayOpenChangeDetails } from "../../internal/overlay/overlay-utils";
import { mergeAriaIds } from "../../internal/utils/merge-aria-ids";
import { useMergedRefs } from "../../internal/utils/merge-refs";
import { getGlTooltipDefaultContainer } from "./container";

export type GlTooltipPlacement = "top" | "right" | "bottom" | "left";

export type GlTooltipProps = {
  children?: ReactNode;
  /** How long to wait before closing the tooltip, in milliseconds. */
  closeDelay?: number;
  /** Whether the tooltip is initially open when uncontrolled. */
  defaultOpen?: boolean;
  /** How long to wait before opening the tooltip on hover, in milliseconds. */
  delay?: number;
  /** Prevents the tooltip from opening without disabling the trigger element. */
  disabled?: boolean;
  /** ID shared by the tooltip and its trigger's `aria-describedby`. */
  id?: string;
  /** Prevents the tooltip content from being hovered without closing. */
  noninteractive?: boolean;
  /** Called when user interaction requests an open-state change. */
  onOpenChange?: (open: boolean, details: GlOverlayOpenChangeDetails) => void;
  /** Called after the opening or closing transition finishes. */
  onOpenChangeComplete?: (open: boolean) => void;
  /** Controlled open state. */
  open?: boolean;
};

type TooltipTriggerBaseProps = Omit<
  BaseTooltip.Trigger.Props,
  | "children"
  | "className"
  | "closeDelay"
  | "closeOnClick"
  | "delay"
  | "disabled"
  | "handle"
  | "payload"
  | "render"
  | "style"
>;

type TooltipDefaultTriggerProps = {
  /** Renders the trigger content inside an unstyled inline element. */
  asChild?: false;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  style?: CSSProperties;
};

export type GlTooltipTriggerProps = TooltipTriggerBaseProps & (
  TooltipDefaultTriggerProps | GlTriggerAsChildProps
);

type PopupProps = Omit<
  BaseTooltip.Popup.Props,
  "children" | "className" | "id" | "render" | "role" | "style"
>;

export type GlTooltipContentProps = PopupProps & {
  /** Collision boundary. Defaults to clipping ancestors; `"viewport"` ignores them. */
  boundary?: "viewport" | "clipping-ancestors" | Element;
  /** Space between the tooltip and its collision boundary, in pixels. */
  boundaryPadding?: number;
  /** Tooltip content. */
  children?: ReactNode;
  /** Extra class applied to the tooltip popup. */
  className?: string;
  /**
   * Portal container for the tooltip: an element or a selector.
   * Defaults to the value set by `setGlTooltipDefaultContainer`, else `document.body`.
   */
  container?: HTMLElement | ShadowRoot | string | null;
  /** Disables the fade transition. */
  noFade?: boolean;
  /** Preferred side of the trigger. */
  placement?: GlTooltipPlacement;
  style?: CSSProperties;
};

type TooltipContextValue = {
  closeDelay: number;
  delay: number;
  disabled: boolean;
  noninteractive: boolean;
  open: boolean;
  tooltipId: string;
};

const TooltipContext = createContext<TooltipContextValue | null>(null);

const tooltipVariants = cva(["tooltip", "gl-tooltip"], {
  variants: {
    fade: {
      false: null,
      true: "fade",
    },
    noninteractive: {
      false: null,
      true: "noninteractive",
    },
    placement: {
      bottom: "bs-tooltip-bottom",
      left: "bs-tooltip-left",
      right: "bs-tooltip-right",
      top: "bs-tooltip-top",
    },
  },
  defaultVariants: {
    fade: true,
    noninteractive: false,
    placement: "top",
  },
});

function useTooltipContext(componentName: string): TooltipContextValue {
  const context = useContext(TooltipContext);
  if(!context) throw new Error(`${componentName} must be used inside GlTooltip.`);
  return context;
}

function physicalPlacement(side: BaseTooltip.Popup.State["side"]): GlTooltipPlacement {
  if(side === "inline-start") return "left";
  if(side === "inline-end") return "right";
  return side;
}

export function resolveTooltipBoundary(
  boundary: GlTooltipContentProps["boundary"] = "clipping-ancestors",
): BaseTooltip.Positioner.Props["collisionBoundary"] {
  // Floating UI always intersects a supplied boundary with the viewport.
  // An empty list therefore ignores clipping ancestors while retaining the viewport.
  return boundary === "viewport" ? [] : boundary;
}

export function resolveTooltipContainer(
  container: GlTooltipContentProps["container"],
): HTMLElement | ShadowRoot | null | undefined {
  const target = container === undefined ? getGlTooltipDefaultContainer() : container;
  if(typeof target !== "string") return target;
  if(typeof document === "undefined") return null;

  try {
    return document.querySelector<HTMLElement>(target);
  } catch {
    return null;
  }
}

export default function GlTooltip({
  children,
  closeDelay = 0,
  defaultOpen = false,
  delay = 500,
  disabled = false,
  id,
  noninteractive = false,
  onOpenChange,
  onOpenChangeComplete,
  open,
}: GlTooltipProps) {
  const generatedId = useId();
  const tooltipId = id ?? `gl-tooltip-${generatedId}`;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const requestedOpen = open ?? uncontrolledOpen;
  const isOpen = !disabled && requestedOpen;

  const handleOpenChange = useCallback((
    nextOpen: boolean,
    details: BaseTooltip.Root.ChangeEventDetails,
  ) => {
    if(nextOpen === requestedOpen) return;

    if(!isControlled) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen, mapOverlayOpenChangeDetails(details));
  }, [isControlled, onOpenChange, requestedOpen]);

  const notifyOpenChange = useEffectEvent((
    nextOpen: boolean,
    details: GlOverlayOpenChangeDetails,
  ) => {
    onOpenChange?.(nextOpen, details);
  });

  useEffect(() => {
    if(!disabled || !requestedOpen) return;

    if(!isControlled) setUncontrolledOpen(false);
    notifyOpenChange(false, { event: new Event("disabled"), reason: "disabled" });
  }, [disabled, isControlled, requestedOpen]);

  const context = useMemo<TooltipContextValue>(() => ({
    closeDelay,
    delay,
    disabled,
    noninteractive,
    open: isOpen,
    tooltipId,
  }), [closeDelay, delay, disabled, isOpen, noninteractive, tooltipId]);

  return (
    <TooltipContext.Provider value={context}>
      <BaseTooltip.Root
        disabled={disabled}
        disableHoverablePopup={noninteractive}
        onOpenChange={handleOpenChange}
        onOpenChangeComplete={onOpenChangeComplete}
        open={isOpen}>
        {children}
      </BaseTooltip.Root>
    </TooltipContext.Provider>
  );
}

export const GlTooltipTrigger = forwardRef<HTMLElement, GlTooltipTriggerProps>(
  function GlTooltipTrigger({
    "aria-describedby": ariaDescribedBy,
    asChild = false,
    children,
    className,
    disabled = false,
    style,
    ...triggerProps
  }, forwardedRef) {
    const context = useTooltipContext("GlTooltipTrigger");
    const triggerRender = resolveTriggerRender(
      "GlTooltipTrigger",
      asChild,
      children,
      {},
      <span />,
    );
    const childAriaDescribedBy = asChild
      ? (triggerRender.props as { "aria-describedby"?: string })["aria-describedby"]
      : undefined;
    const existingAriaDescribedBy = mergeAriaIds(
      ariaDescribedBy,
      childAriaDescribedBy,
    );
    const describedBy = mergeAriaIds(
      existingAriaDescribedBy,
      context.open ? context.tooltipId : undefined,
    );
    const renderedTrigger = asChild
      ? cloneElement(
        triggerRender as ReactElement<{ "aria-describedby"?: string }>,
        { "aria-describedby": describedBy },
      )
      : triggerRender;
    const mergedRef = useMergedRefs(forwardedRef);

    return (
      <BaseTooltip.Trigger
        {...triggerProps}
        ref={mergedRef}
        aria-describedby={describedBy}
        className={className}
        closeDelay={context.closeDelay}
        closeOnClick={false}
        delay={context.delay}
        disabled={disabled || context.disabled}
        render={renderedTrigger}
        style={style}>
        {resolveTriggerContent(asChild, children)}
      </BaseTooltip.Trigger>
    );
  },
);

export const GlTooltipContent = forwardRef<HTMLDivElement, GlTooltipContentProps>(
  function GlTooltipContent({
    boundary,
    boundaryPadding = 5,
    children,
    className,
    container,
    noFade = false,
    placement = "top",
    style,
    ...popupProps
  }, forwardedRef) {
    const context = useTooltipContext("GlTooltipContent");
    const portalContainer = resolveTooltipContainer(container);
    const collisionBoundary = resolveTooltipBoundary(boundary);
    const popupClassName = (state: BaseTooltip.Popup.State) => tooltipVariants({
      className,
      fade: !noFade,
      noninteractive: context.noninteractive,
      placement: physicalPlacement(state.side),
    });

    return (
      <BaseTooltip.Portal container={portalContainer}>
        <BaseTooltip.Positioner
          className="gl-tooltip-positioner"
          collisionBoundary={collisionBoundary}
          collisionPadding={boundaryPadding}
          side={placement}>
          <BaseTooltip.Popup
            {...popupProps}
            ref={forwardedRef}
            className={popupClassName}
            id={context.tooltipId}
            role="tooltip"
            style={style}>
            <BaseTooltip.Arrow className="arrow" />
            <div className="tooltip-inner">{children}</div>
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    );
  },
);
