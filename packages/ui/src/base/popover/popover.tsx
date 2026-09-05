/**
 * Ported from packages/gitlab-ui/src/components/base/popover/popover.vue and
 * packages/gitlab-ui/src/vendor/bootstrap-vue/src/components/tooltip/helpers/bv-tooltip.js
 * in gitlab-org/gitlab-services/design.gitlab.com.
 *
 * React composition replaces target/slots; controlled state replaces show and
 * Vue root events. Base UI supplies positioning and non-modal dialog semantics.
 * Legacy Popper options, variants, directives, noninteractive mode, and automatic
 * Bootstrap modal container discovery are not exposed.
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
  type HTMLAttributes,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { cva } from "class-variance-authority";
import { clsx } from "cn";
import GlButton, { type GlButtonProps } from "../button/button";
import { useMergedRefs } from "../../internal/utils/merge-refs";

export type GlPopoverPlacement = "top" | "right" | "bottom" | "left";
export type GlPopoverTriggerType = "hover" | "focus" | "click";
export type GlPopoverTriggers = GlPopoverTriggerType | "manual" | readonly GlPopoverTriggerType[];

export type GlPopoverProps = {
  children?: ReactNode;
  /** Automatic closing delay in milliseconds. Defaults to 150. */
  closeDelay?: number;
  /** Initial visibility for an uncontrolled popover. Defaults to false. */
  defaultOpen?: boolean;
  /** Automatic opening delay in milliseconds. Defaults to 50. */
  delay?: number;
  /** Prevents automatic opening without disabling explicit state control or dismissal. */
  disabled?: boolean;
  /** Requests visibility changes. Controlled popovers wait for an updated `open`. */
  onOpenChange?: (open: boolean) => void;
  /** Called after an opening or closing transition finishes. */
  onOpenChangeComplete?: (open: boolean) => void;
  /** Controlled visibility; replaces the upstream `show` prop. */
  open?: boolean;
  /** Defaults to hover and focus-visible. Manual mode only disables automatic triggers. */
  triggers?: GlPopoverTriggers;
};

export type GlPopoverTriggerProps = Omit<
  BasePopover.Trigger.Props,
  "className" | "handle" | "payload" | "openOnHover" | "delay" | "closeDelay"
> & Pick<
  GlButtonProps,
  "active" | "block" | "category" | "icon" | "loading" | "selected" | "size" | "variant"
> & {
  className?: string;
};

export type GlPopoverContentProps = Omit<
  BasePopover.Popup.Props,
  "className" | "render" | "title" | "role" | "initialFocus" | "finalFocus"
> & {
  /** Collision boundary; defaults to the viewport, following Pajamas guidance. */
  boundary?: "viewport" | "clipping-ancestors" | HTMLElement;
  /** Distance from the collision boundary in pixels. Defaults to 5. */
  boundaryPadding?: number;
  className?: string;
  /** Accessible close button label. Defaults to "Close". */
  closeButtonLabel?: string;
  /** Portal destination; null or an unmatched selector falls back to document.body. */
  container?: HTMLElement | RefObject<HTMLElement | null> | string | null;
  /** Disables the fade transition. */
  noFade?: boolean;
  /** Called once for close button activation, including keyboard activation. */
  onCloseButtonClick?: MouseEventHandler<HTMLElement>;
  /** Preferred side; flips when space is insufficient. Defaults to top. */
  placement?: GlPopoverPlacement;
  /** Defaults to true. Set false for content adjacent to the trigger in DOM reading order. */
  portalled?: boolean;
  /** Shows a small tertiary close button in the header. */
  showCloseButton?: boolean;
};

export type GlPopoverTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  children: ReactNode;
};

type PopoverContextValue = {
  cancelTriggers(): void;
  contains(element: EventTarget | null): boolean;
  enter(trigger: GlPopoverTriggerType): void;
  focusContent(): void;
  leave(trigger: "hover" | "focus"): void;
  restoreFocus(): HTMLElement | false;
  setPopupElement(element: HTMLDivElement | null): void;
  setTriggerElement(element: HTMLElement | null): void;
  shouldIgnoreFocus(): boolean;
  triggerId: string;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);
const PopoverContentContext = createContext(false);
const defaultTriggers: readonly GlPopoverTriggerType[] = ["hover", "focus"];
const triggerVariants = cva("gl-popover-trigger");
const titleVariants = cva("gl-popover-title");
const popupVariants = cva("popover gl-popover", {
  variants: {
    hasTitle: { true: "has-title" },
    showCloseButton: { true: "has-close-button" },
    noFade: { false: "fade" },
    side: {
      top: "bs-popover-top",
      right: "bs-popover-right",
      bottom: "bs-popover-bottom",
      left: "bs-popover-left",
    },
  },
});

function usePopoverContext(component: string) {
  const context = useContext(PopoverContext);
  if(!context) throw new Error(`${component} must be used within GlPopover.`);
  return context;
}

function resolveContentChildren(children: ReactNode) {
  const result: { title: ReactElement<GlPopoverTitleProps> | null; body: ReactNode[] } = {
    title: null,
    body: [],
  };
  const visit = (child: ReactNode) => {
    if(isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      Children.forEach(child.props.children, visit);
    } else if(isValidElement<GlPopoverTitleProps>(child) && child.type === GlPopoverTitle) {
      if(result.title) throw new Error("GlPopoverContent accepts only one GlPopoverTitle.");
      result.title = child;
    } else if(child !== null && child !== undefined && typeof child !== "boolean") {
      result.body.push(child);
    }
  };

  Children.forEach(children, visit);
  result.body = Children.toArray(result.body);
  return result;
}

function resolveContainer(container: GlPopoverContentProps["container"]) {
  if(typeof container !== "string") return container ?? undefined;
  return typeof document === "undefined" ? undefined : document.querySelector<HTMLElement>(container) ?? undefined;
}

export default function GlPopover({
  children,
  closeDelay = 150,
  defaultOpen = false,
  delay = 50,
  disabled = false,
  onOpenChange,
  onOpenChangeComplete,
  open,
  triggers = defaultTriggers,
}: GlPopoverProps) {
  const generatedId = useId();
  const [triggerId, setTriggerId] = useState(`gl-popover-trigger-${generatedId}`);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = open ?? uncontrolledOpen;
  const triggerKey = typeof triggers === "string" ? triggers : [...new Set(triggers)].sort().join(" ");
  const triggerRef = useRef<HTMLElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef({ hover: false, focus: false, click: false });
  const returnFocusRef = useRef(false);
  const ignoreFocusRef = useRef(false);
  const currentRef = useRef({ isOpen, open, disabled, onOpenChange });
  currentRef.current = { isOpen, open, disabled, onOpenChange };

  const clearTimer = useCallback(() => {
    if(timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const cancelTriggers = useCallback(() => {
    clearTimer();
    activeRef.current = { hover: false, focus: false, click: false };
  }, [clearTimer]);

  const requestOpen = useCallback((nextOpen: boolean, restoreFocus = false) => {
    clearTimer();
    if(!nextOpen) cancelTriggers();
    if(nextOpen === currentRef.current.isOpen) return;

    returnFocusRef.current = !nextOpen && restoreFocus;
    if(currentRef.current.open === undefined) setUncontrolledOpen(nextOpen);
    currentRef.current.onOpenChange?.(nextOpen);

    // Refused controlled dismissals must not steal focus on a later external close.
    if(!nextOpen && restoreFocus) queueMicrotask(() => {
      if(currentRef.current.isOpen) returnFocusRef.current = false;
    });
  }, [cancelTriggers, clearTimer]);

  const scheduleOpen = useCallback((nextOpen: boolean) => {
    clearTimer();
    if(nextOpen === currentRef.current.isOpen) return;
    const wait = nextOpen ? delay : closeDelay;
    const commit = () => {
      if(nextOpen && currentRef.current.disabled) return;
      requestOpen(nextOpen);
    };
    if(wait <= 0) commit();
    else timerRef.current = setTimeout(commit, wait);
  }, [clearTimer, closeDelay, delay, requestOpen]);

  const contains = useCallback((element: EventTarget | null) => typeof Node !== "undefined"
    && element instanceof Node
    && Boolean(triggerRef.current?.contains(element) || popupRef.current?.contains(element)), []);

  const enter = useCallback((trigger: GlPopoverTriggerType) => {
    if(currentRef.current.disabled) return;
    const enabled = triggerKey.split(" ").includes(trigger);
    if(!enabled) return;

    activeRef.current[trigger] = trigger === "click" ? !activeRef.current.click : true;
    scheduleOpen(Object.values(activeRef.current).some(Boolean));
  }, [scheduleOpen, triggerKey]);

  const leave = useCallback((trigger: "hover" | "focus") => {
    activeRef.current[trigger] = false;
    if(Object.values(activeRef.current).some(Boolean)) return;
    if(trigger === "focus") requestOpen(false);
    else scheduleOpen(false);
  }, [requestOpen, scheduleOpen]);

  const setTriggerElement = useCallback((element: HTMLElement | null) => {
    if(element && triggerRef.current && element !== triggerRef.current) {
      throw new Error("GlPopover accepts only one GlPopoverTrigger.");
    }
    triggerRef.current = element;
    if(element) setTriggerId(element.id);
  }, []);

  const setPopupElement = useCallback((element: HTMLDivElement | null) => {
    if(element && popupRef.current && element !== popupRef.current) {
      throw new Error("GlPopover accepts only one GlPopoverContent.");
    }
    popupRef.current = element;
  }, []);

  const restoreFocus = useCallback(() => {
    if(!returnFocusRef.current) return false;
    returnFocusRef.current = false;
    ignoreFocusRef.current = true;
    return triggerRef.current ?? false;
  }, []);

  const shouldIgnoreFocus = useCallback(() => {
    const ignore = ignoreFocusRef.current;
    ignoreFocusRef.current = false;
    return ignore;
  }, []);

  const focusContent = useCallback(() => {
    if(currentRef.current.isOpen) {
      clearTimer();
      activeRef.current.focus = true;
    }
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);
  useEffect(() => {
    if(disabled || !isOpen) cancelTriggers();
  }, [cancelTriggers, disabled, isOpen]);
  useEffect(() => cancelTriggers(), [cancelTriggers, triggerKey]);

  const context = useMemo(() => ({
    cancelTriggers,
    contains,
    enter,
    focusContent,
    leave,
    restoreFocus,
    setPopupElement,
    setTriggerElement,
    shouldIgnoreFocus,
    triggerId,
  }), [cancelTriggers, contains, enter, focusContent, leave, restoreFocus,
    setPopupElement, setTriggerElement, shouldIgnoreFocus, triggerId]);

  return (
    <PopoverContext.Provider value={context}>
      <BasePopover.Root
        modal={false}
        onOpenChange={(nextOpen, details) => {
          // React handlers own trigger changes, including manual mode.
          if(details.reason === "trigger-press") return;
          requestOpen(nextOpen, details.reason === "escape-key" || details.reason === "close-press");
        }}
        onOpenChangeComplete={onOpenChangeComplete}
        open={isOpen}
        triggerId={triggerId}>
        {children}
      </BasePopover.Root>
    </PopoverContext.Provider>
  );
}

export const GlPopoverTrigger = forwardRef<HTMLElement, GlPopoverTriggerProps>(function GlPopoverTrigger({
  active,
  block,
  category,
  children,
  className,
  disabled = false,
  icon,
  id,
  loading = false,
  nativeButton,
  onBlur,
  onClick,
  onFocus,
  onMouseEnter,
  onMouseLeave,
  render,
  selected,
  size,
  variant,
  ...elementProps
}, forwardedRef) {
  const context = usePopoverContext("GlPopoverTrigger");
  const mergedRef = useMergedRefs(forwardedRef, context.setTriggerElement);
  const isDisabled = disabled || loading;
  const { cancelTriggers } = context;

  useEffect(() => {
    if(isDisabled) cancelTriggers();
  }, [isDisabled, cancelTriggers]);

  return (
    <BasePopover.Trigger
      {...elementProps}
      ref={mergedRef}
      className={triggerVariants({ className })}
      disabled={isDisabled}
      id={id ?? context.triggerId}
      nativeButton={render ? nativeButton : true}
      onBlur={(event) => {
        onBlur?.(event);
        if(!context.contains(event.relatedTarget)) context.leave("focus");
      }}
      onClick={(event) => {
        onClick?.(event);
        const prevented = event.defaultPrevented || event.baseUIHandlerPrevented;
        event.preventBaseUIHandler();
        if(!prevented && !isDisabled) context.enter("click");
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if(context.shouldIgnoreFocus() || isDisabled || event.defaultPrevented) return;
        if(event.target.matches(":focus-visible")) context.enter("focus");
      }}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        if(!isDisabled && !event.defaultPrevented) context.enter("hover");
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        if(!context.contains(event.relatedTarget)) context.leave("hover");
      }}
      openOnHover={false}
      render={render ?? (
        <GlButton
          active={active}
          block={block}
          category={category}
          disabled={disabled}
          icon={icon}
          loading={loading}
          selected={selected}
          size={size}
          variant={variant} />
      )}>
      {children}
    </BasePopover.Trigger>
  );
});

export const GlPopoverTitle = forwardRef<HTMLHeadingElement, GlPopoverTitleProps>(function GlPopoverTitle({
  className,
  ...elementProps
}, forwardedRef) {
  if(!useContext(PopoverContentContext)) {
    throw new Error("GlPopoverTitle must be a direct child of GlPopoverContent (or inside a Fragment).");
  }

  return (
    <BasePopover.Title
      {...elementProps}
      ref={forwardedRef}
      className={titleVariants({ className })}
      render={<h3 />} />
  );
});

export const GlPopoverContent = forwardRef<HTMLDivElement, GlPopoverContentProps>(function GlPopoverContent({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  boundary = "viewport",
  boundaryPadding = 5,
  children,
  className,
  closeButtonLabel = "Close",
  container,
  noFade = false,
  onBlur,
  onCloseButtonClick,
  onFocus,
  onMouseEnter,
  onMouseLeave,
  placement = "top",
  portalled = true,
  showCloseButton = false,
  ...elementProps
}, forwardedRef) {
  const context = usePopoverContext("GlPopoverContent");
  const [inlineContainer, setInlineContainer] = useState<HTMLDivElement | null>(null);
  const mergedRef = useMergedRefs(forwardedRef, context.setPopupElement);
  const content = resolveContentChildren(children);
  const hasTitle = content.title !== null;
  const nameProps = ariaLabelledBy ? { "aria-labelledby": ariaLabelledBy }
    : ariaLabel ? { "aria-label": ariaLabel, "aria-labelledby": undefined }
      : hasTitle ? {} : { "aria-labelledby": context.triggerId };

  const popup = (
    <BasePopover.Positioner
      className="gl-popover-positioner"
      collisionBoundary={boundary === "viewport" ? [] : boundary}
      collisionPadding={boundaryPadding}
      positionMethod="fixed"
      side={placement}
      sideOffset={4}>
      <BasePopover.Popup
        {...elementProps}
        {...nameProps}
        ref={mergedRef}
        className={(state) => popupVariants({
          className,
          hasTitle,
          noFade,
          showCloseButton,
          side: state.side as GlPopoverPlacement,
        })}
        finalFocus={context.restoreFocus}
        initialFocus={false}
        onBlur={(event) => {
          onBlur?.(event);
          if(!context.contains(event.relatedTarget)) context.leave("focus");
        }}
        onFocus={(event) => {
          onFocus?.(event);
          context.focusContent();
        }}
        onMouseEnter={(event) => {
          onMouseEnter?.(event);
          context.enter("hover");
        }}
        onMouseLeave={(event) => {
          onMouseLeave?.(event);
          if(!context.contains(event.relatedTarget)) context.leave("hover");
        }}>
        <BasePopover.Arrow className="arrow" />
        {hasTitle || showCloseButton ? (
          <div className="popover-header">
            <PopoverContentContext.Provider value>
              {content.title}
            </PopoverContentContext.Provider>
            {showCloseButton ? (
              <div className="-gl-mr-3 -gl-mt-2 gl-ml-3 gl-h-0">
                <BasePopover.Close
                  aria-label={closeButtonLabel}
                  className={clsx(!hasTitle && "gl-float-right gl-mt-2")}
                  onClick={onCloseButtonClick}
                  render={<GlButton category="tertiary" icon="close" size="small" />} />
              </div>
            ) : null}
          </div>
        ) : null}
        {content.body.length > 0 ? <div className="popover-body">{content.body}</div> : null}
      </BasePopover.Popup>
    </BasePopover.Positioner>
  );

  // Base UI requires a Portal even in inline mode. Its local destination keeps
  // the popup next to Content in DOM order without borrowing private contexts.
  return (
    <>
      {!portalled ? <div ref={setInlineContainer} className="gl-contents" /> : null}
      <BasePopover.Portal container={portalled ? resolveContainer(container) : inlineContainer}>
        {popup}
      </BasePopover.Portal>
    </>
  );
});
