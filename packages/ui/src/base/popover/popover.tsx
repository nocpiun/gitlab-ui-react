/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/popover/popover.vue
 *
 * Adaptations:
 * - Vue's target, title slot, and default slot map to compound React parts.
 * - Base UI supplies positioning, dismissal, portal, and dialog semantics.
 * - Vue's show model maps to open/defaultOpen/onOpenChange.
 */

import {
  Children,
  Fragment,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
} from "react";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { cva } from "class-variance-authority";
import GlButton from "../button/button";

export type GlPopoverPlacement = "top" | "right" | "bottom" | "left";
export type GlPopoverTriggerMode = "click" | "hover" | "focus";

export type GlPopoverProps = {
  children?: ReactNode;
  /** How long to wait before closing a hover-opened popover, in milliseconds. */
  closeDelay?: number;
  /** Whether the popover is initially open when uncontrolled. */
  defaultOpen?: boolean;
  /** How long to wait before opening on hover or focus, in milliseconds. */
  delay?: number;
  /** Prevents the trigger from opening the popover. */
  disabled?: boolean;
  /** Called when user interaction requests an open-state change. */
  onOpenChange?: (open: boolean) => void;
  /** Controlled open state. */
  open?: boolean;
  /** Enabled trigger modes. An empty array provides manual, controlled behavior. */
  triggers?: readonly GlPopoverTriggerMode[];
};

export type GlPopoverTriggerProps = {
  /** A single element that receives the trigger behavior and ARIA attributes. */
  children: ReactElement;
  /** Set to false when the child does not ultimately render a native button. */
  nativeButton?: BasePopover.Trigger.Props["nativeButton"];
};

type PopupProps = Omit<
  BasePopover.Popup.Props,
  "children" | "className" | "finalFocus" | "initialFocus" | "render" | "role" | "style"
>;

export type GlPopoverContentProps = PopupProps & {
  /** Collision boundary. Defaults to clipping ancestors; `"viewport"` ignores them. */
  boundary?: "viewport" | "clipping-ancestors" | Element;
  /** Space between the popover and its collision boundary, in pixels. */
  boundaryPadding?: number;
  /**
   * A title part followed by arbitrary body content. Without a title or an
   * explicit accessible name, the dialog is labelled by its trigger.
   */
  children?: ReactNode;
  /** Extra class applied to the popup. */
  className?: string;
  /** Accessible label for the optional close button. */
  closeButtonLabel?: string;
  /** Portal container element, shadow root, or selector. Defaults to document.body. */
  container?: HTMLElement | ShadowRoot | string | null;
  /** Disables the fade transition. */
  noFade?: boolean;
  /** Called when the optional close button is clicked. */
  onCloseButtonClick?: MouseEventHandler<HTMLButtonElement>;
  /** Preferred side of the trigger. */
  placement?: GlPopoverPlacement;
  /** Displays a close button in the popover header. */
  showCloseButton?: boolean;
  style?: CSSProperties;
};

export type GlPopoverTitleProps = Omit<BasePopover.Title.Props, "className"> & {
  className?: string;
};

type PopoverContextValue = {
  activateFocusTrigger(): void;
  activateHoverTrigger(): void;
  closeDelay: number;
  delay: number;
  deactivateFocusTrigger(): void;
  deactivateHoverTrigger(): void;
  disabled: boolean;
  open: boolean;
  resetActiveTriggers(): void;
  toggleClickTrigger(): void;
  triggerId: string;
  triggerModes: ReadonlySet<GlPopoverTriggerMode>;
};

type ResolvedPopoverContent = {
  body: ReactNode[];
  title: ReactElement<GlPopoverTitleProps, typeof GlPopoverTitle> | null;
};

const DEFAULT_TRIGGERS: readonly GlPopoverTriggerMode[] = ["hover", "focus"];
const PopoverContext = createContext<PopoverContextValue | null>(null);
const PopoverTitleContext = createContext(false);

const popoverVariants = cva(["popover", "gl-popover"], {
  variants: {
    fade: {
      false: null,
      true: "fade",
    },
    hasCloseButton: {
      false: null,
      true: "has-close-button",
    },
    hasTitle: {
      false: null,
      true: "has-title",
    },
    placement: {
      bottom: "bs-popover-bottom",
      left: "bs-popover-left",
      right: "bs-popover-right",
      top: "bs-popover-top",
    },
  },
  defaultVariants: {
    fade: true,
    hasCloseButton: false,
    hasTitle: false,
    placement: "top",
  },
});
const closeButtonVariants = cva([], {
  variants: {
    withoutTitle: {
      false: null,
      true: "gl-float-right gl-mt-2",
    },
  },
  defaultVariants: {
    withoutTitle: false,
  },
});
const popoverTitleVariants = cva("gl-popover-title");

function usePopoverContext(componentName: string): PopoverContextValue {
  const context = useContext(PopoverContext);
  if(!context) throw new Error(`${componentName} must be used inside GlPopover.`);
  return context;
}

function modeForChangeReason(
  reason: BasePopover.Root.ChangeEventReason,
): GlPopoverTriggerMode | null {
  switch(reason) {
    case "trigger-hover":
      return "hover";
    case "trigger-focus":
      return "focus";
    case "trigger-press":
      return "click";
    default:
      return null;
  }
}

export function shouldCancelPopoverTriggerClose(
  nextOpen: boolean,
  reason: BasePopover.Root.ChangeEventReason,
  hasActiveTrigger: boolean,
): boolean {
  return !nextOpen
    && hasActiveTrigger
    && (modeForChangeReason(reason) !== null || reason === "focus-out");
}

function resolveContainer(
  container: GlPopoverContentProps["container"],
): HTMLElement | ShadowRoot | null | undefined {
  if(typeof container !== "string") return container;
  if(typeof document === "undefined") return null;

  try {
    return document.querySelector<HTMLElement>(container);
  } catch {
    return null;
  }
}

export function resolvePopoverBoundary(
  boundary: GlPopoverContentProps["boundary"] = "clipping-ancestors",
): BasePopover.Positioner.Props["collisionBoundary"] {
  // Floating UI always intersects the supplied boundary with its viewport root
  // boundary. An empty list therefore opts out of clipping ancestors.
  return boundary === "viewport" ? [] : boundary;
}

export function resolvePopoverFallbackLabelledBy(
  hasTitle: boolean,
  triggerId: string,
  ariaLabel: BasePopover.Popup.Props["aria-label"],
  ariaLabelledBy: BasePopover.Popup.Props["aria-labelledby"],
): string | undefined {
  if(hasTitle || ariaLabel || ariaLabelledBy) return undefined;
  return triggerId;
}

function physicalPlacement(side: BasePopover.Popup.State["side"]): GlPopoverPlacement {
  if(side === "inline-start") return "left";
  if(side === "inline-end") return "right";
  return side;
}

function containsPopoverTitle(children: ReactNode): boolean {
  let containsTitle = false;

  Children.forEach(children, (child) => {
    if(containsTitle || !isValidElement<{ children?: ReactNode }>(child)) return;

    containsTitle = child.type === GlPopoverTitle
      || containsPopoverTitle(child.props.children);
  });

  return containsTitle;
}

function resolvePopoverContent(children: ReactNode): ResolvedPopoverContent {
  const result: ResolvedPopoverContent = { body: [], title: null };

  const visit = (child: ReactNode) => {
    if(child === null || child === undefined || typeof child === "boolean") return;

    if(isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      Children.forEach(child.props.children, visit);
      return;
    }

    if(isValidElement<GlPopoverTitleProps>(child) && child.type === GlPopoverTitle) {
      if(result.title) {
        throw new Error("GlPopoverContent accepts only one GlPopoverTitle child.");
      }
      result.title = child as ResolvedPopoverContent["title"];
      return;
    }

    if(isValidElement<{ children?: ReactNode }>(child)
      && containsPopoverTitle(child.props.children)) {
      throw new Error(
        "GlPopoverTitle must be used as a direct child of GlPopoverContent. "
        + "Fragments are supported.",
      );
    }

    result.body.push(child);
  };

  Children.forEach(children, visit);
  return result;
}

export default function GlPopover({
  children,
  closeDelay = 150,
  defaultOpen = false,
  delay = 50,
  disabled = false,
  onOpenChange,
  open,
  triggers = DEFAULT_TRIGGERS,
}: GlPopoverProps) {
  const generatedId = useId();
  const triggerId = `gl-popover-trigger-${generatedId}`;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = open ?? uncontrolledOpen;
  const triggerModes = useMemo(() => new Set(triggers), [triggers]);
  // Base UI owns hover and click, while focus is adapted here. Track them
  // together so leaving one mode cannot close while another remains active.
  const activeTriggerModesRef = useRef(new Set<GlPopoverTriggerMode>());
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousOpenRef = useRef(isOpen);

  const requestOpenChange = useCallback((nextOpen: boolean) => {
    if(nextOpen === isOpen || (nextOpen && disabled)) return;

    if(!isControlled) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }, [disabled, isControlled, isOpen, onOpenChange]);
  const requestOpenChangeRef = useRef(requestOpenChange);
  requestOpenChangeRef.current = requestOpenChange;

  const cancelPendingFocusOpen = useCallback(() => {
    if(focusTimerRef.current === null) return;

    clearTimeout(focusTimerRef.current);
    focusTimerRef.current = null;
  }, []);

  const deactivateFocusTrigger = useCallback(() => {
    activeTriggerModesRef.current.delete("focus");
    cancelPendingFocusOpen();
  }, [cancelPendingFocusOpen]);

  const activateFocusTrigger = useCallback(() => {
    if(disabled || !triggerModes.has("focus")) return;

    activeTriggerModesRef.current.add("focus");
    cancelPendingFocusOpen();
    if(isOpen) return;

    if(delay <= 0) {
      requestOpenChangeRef.current(true);
      return;
    }

    focusTimerRef.current = setTimeout(() => {
      focusTimerRef.current = null;
      if(activeTriggerModesRef.current.has("focus")) requestOpenChangeRef.current(true);
    }, delay);
  }, [cancelPendingFocusOpen, delay, disabled, isOpen, triggerModes]);

  const activateHoverTrigger = useCallback(() => {
    if(disabled || !triggerModes.has("hover")) return;

    activeTriggerModesRef.current.add("hover");
  }, [disabled, triggerModes]);

  const deactivateHoverTrigger = useCallback(() => {
    activeTriggerModesRef.current.delete("hover");
  }, []);

  const toggleClickTrigger = useCallback(() => {
    if(disabled || !triggerModes.has("click")) return;

    cancelPendingFocusOpen();
    const activeTriggerModes = activeTriggerModesRef.current;
    if(activeTriggerModes.has("click")) activeTriggerModes.delete("click");
    else activeTriggerModes.add("click");
  }, [cancelPendingFocusOpen, disabled, triggerModes]);

  const resetActiveTriggers = useCallback(() => {
    activeTriggerModesRef.current.clear();
    cancelPendingFocusOpen();
  }, [cancelPendingFocusOpen]);

  const handleOpenChange = useCallback((
    nextOpen: boolean,
    details: BasePopover.Root.ChangeEventDetails,
  ) => {
    const triggerMode = modeForChangeReason(details.reason);
    if((triggerMode && !triggerModes.has(triggerMode)) || (nextOpen && disabled)) {
      details.cancel();
      return;
    }

    const activeTriggerModes = activeTriggerModesRef.current;
    if(nextOpen && triggerMode) activeTriggerModes.add(triggerMode);
    if(!nextOpen) {
      if(triggerMode) activeTriggerModes.delete(triggerMode);
      else if(details.reason === "focus-out") activeTriggerModes.delete("focus");
    }

    if(shouldCancelPopoverTriggerClose(
      nextOpen,
      details.reason,
      activeTriggerModes.size > 0,
    )) {
      details.cancel();
      return;
    }

    if(nextOpen) cancelPendingFocusOpen();
    requestOpenChange(nextOpen);
  }, [
    cancelPendingFocusOpen,
    disabled,
    requestOpenChange,
    triggerModes,
  ]);

  useEffect(() => {
    const wasOpen = previousOpenRef.current;
    previousOpenRef.current = isOpen;

    if(isOpen) cancelPendingFocusOpen();
    else if(wasOpen) resetActiveTriggers();
  }, [cancelPendingFocusOpen, isOpen, resetActiveTriggers]);

  useEffect(() => {
    if(disabled) {
      resetActiveTriggers();
      return;
    }

    activeTriggerModesRef.current.forEach((triggerMode) => {
      if(!triggerModes.has(triggerMode)) activeTriggerModesRef.current.delete(triggerMode);
    });
    if(!triggerModes.has("focus")) cancelPendingFocusOpen();
  }, [cancelPendingFocusOpen, disabled, resetActiveTriggers, triggerModes]);

  useEffect(() => cancelPendingFocusOpen, [cancelPendingFocusOpen]);

  const context = useMemo<PopoverContextValue>(() => ({
    activateFocusTrigger,
    activateHoverTrigger,
    closeDelay,
    delay,
    deactivateFocusTrigger,
    deactivateHoverTrigger,
    disabled,
    open: isOpen,
    resetActiveTriggers,
    toggleClickTrigger,
    triggerId,
    triggerModes,
  }), [
    activateFocusTrigger,
    activateHoverTrigger,
    closeDelay,
    delay,
    deactivateFocusTrigger,
    deactivateHoverTrigger,
    disabled,
    isOpen,
    resetActiveTriggers,
    toggleClickTrigger,
    triggerId,
    triggerModes,
  ]);

  return (
    <PopoverContext.Provider value={context}>
      <BasePopover.Root
        modal={false}
        onOpenChange={handleOpenChange}
        open={isOpen}
        triggerId={triggerId}>
        {children}
      </BasePopover.Root>
    </PopoverContext.Provider>
  );
}

export function GlPopoverTrigger({
  children,
  nativeButton = true,
}: GlPopoverTriggerProps) {
  const context = usePopoverContext("GlPopoverTrigger");
  const trigger = Children.only(children);

  useEffect(
    () => context.resetActiveTriggers,
    [context.resetActiveTriggers],
  );

  const handleFocus: NonNullable<BasePopover.Trigger.Props["onFocus"]> = (event) => {
    if(!event.currentTarget.matches(":focus-visible")) return;

    context.activateFocusTrigger();
  };

  const handleBlur = () => {
    if(!context.open) context.deactivateFocusTrigger();
  };

  const handleClick = () => {
    context.toggleClickTrigger();
  };

  const handleMouseEnter = () => {
    context.activateHoverTrigger();
  };

  const handleMouseLeave = () => {
    context.deactivateHoverTrigger();
  };

  return (
    <BasePopover.Trigger
      closeDelay={context.closeDelay}
      delay={context.delay}
      disabled={context.disabled}
      id={context.triggerId}
      nativeButton={nativeButton}
      onBlur={handleBlur}
      onClick={handleClick}
      onFocus={handleFocus}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      openOnHover={context.triggerModes.has("hover")}
      render={trigger} />
  );
}

export const GlPopoverContent = forwardRef<HTMLDivElement, GlPopoverContentProps>(
  function GlPopoverContent({
    boundary,
    boundaryPadding = 5,
    children,
    className,
    closeButtonLabel = "Close",
    container,
    noFade = false,
    onCloseButtonClick,
    onMouseEnter,
    onMouseLeave,
    placement = "top",
    showCloseButton = false,
    style,
    ...popupProps
  }, forwardedRef) {
    const context = usePopoverContext("GlPopoverContent");
    const content = resolvePopoverContent(children);
    const hasTitle = content.title !== null;
    const hasBody = content.body.length > 0;
    const portalContainer = resolveContainer(container);
    const collisionBoundary = resolvePopoverBoundary(boundary);
    const fallbackLabelledBy = resolvePopoverFallbackLabelledBy(
      hasTitle,
      context.triggerId,
      popupProps["aria-label"],
      popupProps["aria-labelledby"],
    );
    const fallbackAccessibleNameProps = fallbackLabelledBy
      ? { "aria-labelledby": fallbackLabelledBy }
      : {};
    const popupClassName = (state: BasePopover.Popup.State) => popoverVariants({
      className,
      fade: !noFade,
      hasCloseButton: showCloseButton,
      hasTitle,
      placement: physicalPlacement(state.side),
    });
    const handleMouseEnter: NonNullable<BasePopover.Popup.Props["onMouseEnter"]> = (event) => {
      onMouseEnter?.(event);
      if(event.baseUIHandlerPrevented) return;

      context.activateHoverTrigger();
    };
    const handleMouseLeave: NonNullable<BasePopover.Popup.Props["onMouseLeave"]> = (event) => {
      onMouseLeave?.(event);
      if(event.baseUIHandlerPrevented) return;

      context.deactivateHoverTrigger();
    };

    return (
      <BasePopover.Portal container={portalContainer}>
        <BasePopover.Positioner
          arrowPadding={8}
          className="gl-popover-positioner"
          collisionBoundary={collisionBoundary}
          collisionPadding={boundaryPadding}
          side={placement}
          sideOffset={8}>
          <BasePopover.Popup
            {...popupProps}
            {...fallbackAccessibleNameProps}
            ref={forwardedRef}
            className={popupClassName}
            initialFocus={false}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            role="dialog"
            style={style}>
            <BasePopover.Arrow className="arrow" />
            {hasTitle || showCloseButton ? (
              <div className="popover-header">
                {hasTitle ? (
                  <PopoverTitleContext.Provider value>
                    {content.title}
                  </PopoverTitleContext.Provider>
                ) : null}
                {showCloseButton ? (
                  <div className="-gl-mr-3 -gl-mt-2 gl-ml-3 gl-h-0">
                    <BasePopover.Close
                      aria-label={closeButtonLabel}
                      className={closeButtonVariants({ withoutTitle: !hasTitle })}
                      data-testid="close-button"
                      onClick={onCloseButtonClick}
                      render={(
                        <GlButton category="tertiary" icon="close" size="small" />
                      )} />
                  </div>
                ) : null}
              </div>
            ) : null}
            {hasBody ? <div className="popover-body">{content.body}</div> : null}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    );
  },
);

export const GlPopoverTitle = forwardRef<HTMLHeadingElement, GlPopoverTitleProps>(
  function GlPopoverTitle({ className, ...titleProps }, forwardedRef) {
    const isDirectContentChild = useContext(PopoverTitleContext);
    if(!isDirectContentChild) {
      throw new Error(
        "GlPopoverTitle must be used as a direct child of GlPopoverContent. "
        + "Fragments are supported.",
      );
    }

    return (
      <BasePopover.Title
        {...titleProps}
        ref={forwardedRef}
        className={popoverTitleVariants({ className })} />
    );
  },
);
