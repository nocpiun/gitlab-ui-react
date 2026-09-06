/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/tooltip/tooltip.vue
 *
 * The upstream `target` prop and default slot map to compound React parts.
 * Base UI supplies positioning, dismissal, portal, and tooltip interactions.
 * The upstream `show` model maps to open/defaultOpen/onOpenChange.
 */

import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { cva } from "class-variance-authority";
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
  onOpenChange?: (open: boolean) => void;
  /** Controlled open state. */
  open?: boolean;
};

export type GlTooltipTriggerProps = {
  /** A single element that receives the trigger behavior and ARIA attributes. */
  children: ReactElement;
};

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

function mergeAriaDescribedBy(
  existingValue: string | undefined,
  tooltipId: string | undefined,
): string | undefined {
  const ids = `${existingValue ?? ""} ${tooltipId ?? ""}`.trim().split(/\s+/).filter(Boolean);
  return ids.length > 0 ? [...new Set(ids)].join(" ") : undefined;
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
  open,
}: GlTooltipProps) {
  const generatedId = useId();
  const tooltipId = id ?? `gl-tooltip-${generatedId}`;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const requestedOpen = open ?? uncontrolledOpen;
  const isOpen = !disabled && requestedOpen;

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if(nextOpen === requestedOpen) return;

    if(!isControlled) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }, [isControlled, onOpenChange, requestedOpen]);

  useEffect(() => {
    if(!disabled || !requestedOpen) return;

    if(!isControlled) setUncontrolledOpen(false);
    onOpenChange?.(false);
  }, [disabled, isControlled, onOpenChange, requestedOpen]);

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
        open={isOpen}>
        {children}
      </BaseTooltip.Root>
    </TooltipContext.Provider>
  );
}

export function GlTooltipTrigger({ children }: GlTooltipTriggerProps) {
  const context = useTooltipContext("GlTooltipTrigger");
  const trigger = Children.only(children) as ReactElement<{ "aria-describedby"?: string }>;
  const describedBy = mergeAriaDescribedBy(
    trigger.props["aria-describedby"],
    context.open ? context.tooltipId : undefined,
  );
  const renderedTrigger = cloneElement(trigger, { "aria-describedby": describedBy });

  return (
    <BaseTooltip.Trigger
      closeDelay={context.closeDelay}
      closeOnClick={false}
      delay={context.delay}
      disabled={context.disabled}
      render={renderedTrigger} />
  );
}

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
