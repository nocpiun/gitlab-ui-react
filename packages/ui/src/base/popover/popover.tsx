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
  /** A title part followed by arbitrary body content. */
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
  closeDelay: number;
  delay: number;
  disabled: boolean;
  open: boolean;
  requestOpenChange(open: boolean): void;
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

  const requestOpenChange = useCallback((nextOpen: boolean) => {
    if(nextOpen === isOpen || (nextOpen && disabled)) return;

    if(!isControlled) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }, [disabled, isControlled, isOpen, onOpenChange]);

  const handleOpenChange = useCallback((
    nextOpen: boolean,
    details: BasePopover.Root.ChangeEventDetails,
  ) => {
    const triggerMode = modeForChangeReason(details.reason);
    if((triggerMode && !triggerModes.has(triggerMode)) || (nextOpen && disabled)) {
      details.cancel();
      return;
    }

    requestOpenChange(nextOpen);
  }, [disabled, requestOpenChange, triggerModes]);

  const context = useMemo<PopoverContextValue>(() => ({
    closeDelay,
    delay,
    disabled,
    open: isOpen,
    requestOpenChange,
    triggerId,
    triggerModes,
  }), [closeDelay, delay, disabled, isOpen, requestOpenChange, triggerId, triggerModes]);

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
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trigger = Children.only(children);

  const clearFocusTimer = useCallback(() => {
    if(focusTimerRef.current === null) return;

    clearTimeout(focusTimerRef.current);
    focusTimerRef.current = null;
  }, []);

  useEffect(() => clearFocusTimer, [clearFocusTimer]);

  const handleFocus = () => {
    if(
      context.disabled
      || context.open
      || !context.triggerModes.has("focus")
    ) return;

    clearFocusTimer();
    if(context.delay <= 0) {
      context.requestOpenChange(true);
      return;
    }

    focusTimerRef.current = setTimeout(() => {
      focusTimerRef.current = null;
      context.requestOpenChange(true);
    }, context.delay);
  };

  const handleBlur = () => {
    if(!context.open) clearFocusTimer();
  };

  const handleClick = () => {
    if(context.triggerModes.has("click")) clearFocusTimer();
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
    placement = "top",
    showCloseButton = false,
    style,
    ...popupProps
  }, forwardedRef) {
    usePopoverContext("GlPopoverContent");
    const content = resolvePopoverContent(children);
    const hasTitle = content.title !== null;
    const hasBody = content.body.length > 0;
    const portalContainer = resolveContainer(container);
    const collisionBoundary = resolvePopoverBoundary(boundary);
    const popupClassName = (state: BasePopover.Popup.State) => popoverVariants({
      className,
      fade: !noFade,
      hasCloseButton: showCloseButton,
      hasTitle,
      placement: physicalPlacement(state.side),
    });

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
            ref={forwardedRef}
            className={popupClassName}
            initialFocus={false}
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
