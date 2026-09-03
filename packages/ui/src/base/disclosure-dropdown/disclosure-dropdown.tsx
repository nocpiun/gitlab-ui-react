/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/new_dropdowns/base_dropdown/base_dropdown.vue
 * packages/gitlab-ui/src/components/base/new_dropdowns/disclosure/disclosure_dropdown.vue
 * packages/gitlab-ui/src/components/base/new_dropdowns/disclosure/disclosure_dropdown_item.vue
 */

import type {
  GlDropdownBeforeCloseDetails,
  GlDropdownFooterProps,
  GlDropdownHandle,
  GlDropdownHeaderProps,
  GlDropdownOffset,
  GlDropdownOpenChangeDetails,
  GlDropdownPlacement,
  GlDropdownPositioningStrategy,
} from "../../internal/dropdown/dropdown-types";
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
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
} from "react";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { cva } from "class-variance-authority";
import { clsx } from "cn";
import GlButton, {
  type GlButtonCategory,
  type GlButtonSize,
  type GlButtonVariant,
} from "../button/button";
import GlIcon from "../icon/icon";
import GlLink from "../link/link";
import {
  mapDropdownChangeReason,
  resolveDropdownOffset,
  resolveDropdownPlacement,
  shouldRestoreDropdownFocus,
} from "../../internal/dropdown/dropdown-utils";
import { useMergedRefs } from "../../internal/utils/merge-refs";

export type GlDisclosureDropdownActionDetails = {
  /** The original React click event, including keyboard-generated clicks. */
  event: MouseEvent<HTMLElement>;
  value: unknown;
};

export type GlDisclosureDropdownProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "onChange"
> & {
  /** Controls whether item activation closes the menu unless an item overrides it. */
  autoClose?: boolean;
  children?: ReactNode;
  defaultOpen?: boolean;
  onAction?: (details: GlDisclosureDropdownActionDetails) => void;
  onBeforeClose?: (details: GlDropdownBeforeCloseDetails) => void;
  onHidden?: () => void;
  onOpenChange?: (
    open: boolean,
    details: GlDropdownOpenChangeDetails,
  ) => void;
  onShown?: () => void;
  open?: boolean;
};

export type GlDisclosureDropdownTriggerProps = Omit<
  BaseMenu.Trigger.Props,
  "children" | "className" | "disabled" | "nativeButton" | "render"
> & {
  block?: boolean;
  category?: GlButtonCategory;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  icon?: string;
  loading?: boolean;
  nativeButton?: boolean;
  noCaret?: boolean;
  render?: BaseMenu.Trigger.Props["render"];
  size?: GlButtonSize;
  textSrOnly?: boolean;
  variant?: GlButtonVariant;
};

type PopupProps = Omit<
  BaseMenu.Popup.Props,
  "children" | "className" | "finalFocus" | "render" | "role" | "style"
>;

export type GlDisclosureDropdownContentProps = PopupProps & {
  children?: ReactNode;
  className?: string;
  fluidWidth?: boolean;
  offset?: GlDropdownOffset;
  placement?: GlDropdownPlacement;
  positioningStrategy?: GlDropdownPositioningStrategy;
  style?: CSSProperties;
};

type InteractiveElementProps = Omit<
  BaseMenu.Item.Props,
  | "children"
  | "className"
  | "disabled"
  | "href"
  | "label"
  | "onClick"
  | "ref"
  | "render"
  | "nativeButton"
  | "type"
  | "value"
> & Pick<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "download" | "hrefLang" | "media" | "ping" | "referrerPolicy" | "rel" | "target"
> & Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | "form"
  | "formAction"
  | "formEncType"
  | "formMethod"
  | "formNoValidate"
  | "formTarget"
  | "name"
>;

export type GlDisclosureDropdownItemVariant = "default" | "danger";

export type GlDisclosureDropdownItemProps = InteractiveElementProps & {
  children?: ReactNode;
  className?: string;
  closeOnClick?: boolean;
  disabled?: boolean;
  href?: string;
  icon?: string;
  /** Overrides the text used by Base UI typeahead. */
  label?: string;
  /** Set to true when a custom `render` ultimately renders a native button. */
  nativeButton?: boolean;
  onAction?: (details: GlDisclosureDropdownActionDetails) => void;
  onClick?: MouseEventHandler<HTMLElement>;
  render?: BaseMenu.Item.Props["render"];
  value: unknown;
  variant?: GlDisclosureDropdownItemVariant;
};

type DropdownContextValue = {
  autoClose: boolean;
  dispatchAction(details: GlDisclosureDropdownActionDetails): void;
  handle: BaseMenu.Handle<unknown>;
  returnFocusRef: React.MutableRefObject<boolean>;
  rootElementRef: React.MutableRefObject<HTMLDivElement | null>;
  setPopupElement(element: HTMLDivElement | null): void;
  setTriggerElement(element: HTMLElement | null): void;
  triggerElementRef: React.MutableRefObject<HTMLElement | null>;
  triggerId: string;
  updateTriggerId(id: string): void;
};

const DropdownContext = createContext<DropdownContextValue | null>(null);

/** @internal Shared with the colocated group implementation. */
export const DisclosureDropdownIconSpacingContext = createContext(false);
/** @internal Enforces the public Item-within-Group composition contract. */
export const DisclosureDropdownGroupContext = createContext(false);

const rootVariants = cva(["gl-disclosure-dropdown", "gl-new-dropdown"]);

const triggerVariants = cva("gl-new-dropdown-toggle", {
  variants: {
    caretOnly: {
      false: null,
      true: "gl-new-dropdown-caret-only btn-icon",
    },
    iconOnly: {
      false: null,
      true: "gl-new-dropdown-icon-only btn-icon",
    },
    noCaret: {
      false: null,
      true: "gl-new-dropdown-toggle-no-caret",
    },
  },
  defaultVariants: {
    caretOnly: false,
    iconOnly: false,
    noCaret: false,
  },
});

const popupVariants = cva("gl-new-dropdown-panel", {
  variants: {
    fluidWidth: {
      false: "gl-new-dropdown-panel-fixed-width",
      true: "gl-new-dropdown-panel-fluid-width",
    },
  },
  defaultVariants: {
    fluidWidth: false,
  },
});

const itemVariants = cva("gl-new-dropdown-item", {
  variants: {
    disabled: {
      false: null,
      true: "disabled",
    },
    variant: {
      danger: "gl-new-dropdown-item-danger",
      default: null,
    },
  },
  defaultVariants: {
    disabled: false,
    variant: "default",
  },
});

function useDropdownContext(componentName: string) {
  const context = useContext(DropdownContext);

  if(!context) {
    throw new Error(`${componentName} must be used inside GlDisclosureDropdown.`);
  }

  return context;
}

export const GlDisclosureDropdown = forwardRef<
  GlDropdownHandle,
  GlDisclosureDropdownProps
>(function GlDisclosureDropdown({
  autoClose = true,
  children,
  className,
  defaultOpen = false,
  onAction,
  onBeforeClose,
  onHidden,
  onOpenChange,
  onShown,
  open,
  ...rootProps
}, forwardedRef) {
  const generatedTriggerId = useId();
  const defaultTriggerId = `gl-disclosure-dropdown-trigger-${generatedTriggerId}`;
  const [triggerId, setTriggerId] = useState(defaultTriggerId);
  const rootElementRef = useRef<HTMLDivElement>(null);
  const popupElementRef = useRef<HTMLDivElement | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const returnFocusRef = useRef(false);
  const forceReturnFocusRef = useRef(false);
  const handle = useMemo(() => BaseMenu.createHandle<unknown>(), []);

  const dispatchAction = useCallback((details: GlDisclosureDropdownActionDetails) => {
    if(!onAction) return;

    onAction(details);
  }, [onAction]);

  const handleOpenChange = useCallback((
    nextOpen: boolean,
    details: BaseMenu.Root.ChangeEventDetails,
  ) => {
    const reason = mapDropdownChangeReason(details.reason);
    const publicDetails = { event: details.event, reason };

    if(!nextOpen) {
      let defaultPrevented = false;
      const beforeCloseDetails: GlDropdownBeforeCloseDetails = {
        ...publicDetails,
        get defaultPrevented() {
          return defaultPrevented;
        },
        preventDefault() {
          if(defaultPrevented) return;

          defaultPrevented = true;
          details.cancel();
        },
      };

      onBeforeClose?.(beforeCloseDetails);
      if(defaultPrevented) {
        forceReturnFocusRef.current = false;
        return;
      }

      returnFocusRef.current = forceReturnFocusRef.current || shouldRestoreDropdownFocus(reason);
      forceReturnFocusRef.current = false;
    }

    onOpenChange?.(nextOpen, publicDetails);
  }, [onBeforeClose, onOpenChange]);

  const handleOpenChangeComplete = useCallback((nextOpen: boolean) => {
    if(nextOpen) {
      onShown?.();
    } else {
      onHidden?.();
      forceReturnFocusRef.current = false;
    }
  }, [onHidden, onShown]);

  const openMenu = useCallback(() => {
    returnFocusRef.current = false;
    forceReturnFocusRef.current = false;
    handle.open(triggerId);
  }, [handle, triggerId]);

  const closeMenu = useCallback(() => {
    returnFocusRef.current = false;
    forceReturnFocusRef.current = false;
    handle.close();
  }, [handle]);

  const closeMenuAndFocus = useCallback(() => {
    forceReturnFocusRef.current = true;
    handle.close();
  }, [handle]);

  const containsElement = useCallback((element: Element | null) => {
    if(!element) return false;

    return Boolean(
      rootElementRef.current?.contains(element)
      || popupElementRef.current?.contains(element),
    );
  }, []);

  useImperativeHandle(forwardedRef, () => ({
    close: closeMenu,
    closeAndFocus: closeMenuAndFocus,
    containsElement,
    open: openMenu,
  }), [closeMenu, closeMenuAndFocus, containsElement, openMenu]);

  const contextValue = useMemo<DropdownContextValue>(() => ({
    autoClose,
    dispatchAction,
    handle,
    returnFocusRef,
    rootElementRef,
    setPopupElement(element) {
      popupElementRef.current = element;
    },
    setTriggerElement(element) {
      triggerElementRef.current = element;
    },
    triggerElementRef,
    triggerId,
    updateTriggerId: setTriggerId,
  }), [autoClose, dispatchAction, handle, triggerId]);

  return (
    <DropdownContext.Provider value={contextValue}>
      <BaseMenu.Root
        defaultOpen={defaultOpen}
        defaultTriggerId={defaultTriggerId}
        handle={handle}
        highlightItemOnHover={false}
        loopFocus={false}
        modal={false}
        onOpenChange={handleOpenChange}
        onOpenChangeComplete={handleOpenChangeComplete}
        open={open}
        triggerId={triggerId}>
        <div {...rootProps} ref={rootElementRef} className={rootVariants({ className })}>
          {children}
        </div>
      </BaseMenu.Root>
    </DropdownContext.Provider>
  );
});

export const GlDisclosureDropdownTrigger = forwardRef<
  HTMLElement,
  GlDisclosureDropdownTriggerProps
>(function GlDisclosureDropdownTrigger({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  block = false,
  category = "primary",
  children,
  className,
  disabled = false,
  icon,
  id,
  loading = false,
  nativeButton,
  noCaret = false,
  onKeyDown,
  render,
  size = "medium",
  textSrOnly = false,
  variant = "default",
  ...triggerProps
}, forwardedRef) {
  const context = useDropdownContext("GlDisclosureDropdownTrigger");
  const actualId = id ?? context.triggerId;
  const hasText = Children.toArray(children).length > 0;
  const iconOnly = Boolean(icon) && (!hasText || textSrOnly);
  const caretOnly = !noCaret && !icon && (!hasText || textSrOnly);
  const mergedRef = useMergedRefs(forwardedRef, context.setTriggerElement);
  const environment = typeof process === "undefined" ? undefined : process.env.NODE_ENV;

  useEffect(() => {
    context.updateTriggerId(actualId);
  }, [actualId, context]);

  if(environment !== "production" && ariaLabel && ariaLabelledBy) {
    console.warn(
      "[GlDisclosureDropdownTrigger] Do not provide both `aria-label` and "
      + "`aria-labelledby`. `aria-labelledby` takes precedence.",
    );
  }

  if(
    environment !== "production"
    && !render
    && !hasText
    && !ariaLabel
    && !ariaLabelledBy
  ) {
    console.warn(
      "[GlDisclosureDropdownTrigger] Icon-only triggers require accessible text, "
      + "`aria-label`, or `aria-labelledby`.",
    );
  }

  const classes = triggerVariants({ caretOnly, className, iconOnly, noCaret });
  const handleKeyDown = useCallback((event: ReactKeyboardEvent<HTMLElement>) => {
    const baseEvent = event as Parameters<NonNullable<BaseMenu.Trigger.Props["onKeyDown"]>>[0];
    onKeyDown?.(baseEvent);
    if(event.defaultPrevented) baseEvent.preventBaseUIHandler();
  }, [onKeyDown]);
  const defaultContent = hasText || !noCaret ? (
    <>
      {hasText ? (
        <span className={clsx("gl-new-dropdown-button-text", textSrOnly && "gl-sr-only")}>
          {children}
        </span>
      ) : null}
      {!noCaret ? (
        <GlIcon
          className="gl-button-icon gl-new-dropdown-chevron"
          name="chevron-down"
          size={16} />
      ) : null}
    </>
  ) : null;

  const triggerRender = render ?? (
    <GlButton
      block={block}
      category={category}
      disabled={disabled}
      icon={icon}
      loading={loading}
      size={size}
      variant={variant} />
  );

  return (
    <BaseMenu.Trigger
      {...triggerProps}
      ref={mergedRef}
      aria-label={ariaLabelledBy ? undefined : ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={classes}
      disabled={disabled || loading}
      handle={context.handle}
      id={actualId}
      nativeButton={render ? nativeButton : true}
      onKeyDown={handleKeyDown}
      render={triggerRender}>
      {render ? children : defaultContent}
    </BaseMenu.Trigger>
  );
});

export const GlDisclosureDropdownHeader = forwardRef<
  HTMLDivElement,
  GlDropdownHeaderProps
>(function GlDisclosureDropdownHeader({ children, className, ...elementProps }, forwardedRef) {
  return (
    <div
      {...elementProps}
      ref={forwardedRef}
      className={clsx("gl-new-dropdown-header", className)}>
      <div className="gl-new-dropdown-header-content">{children}</div>
    </div>
  );
});

export const GlDisclosureDropdownFooter = forwardRef<
  HTMLDivElement,
  GlDropdownFooterProps
>(function GlDisclosureDropdownFooter({ className, ...elementProps }, forwardedRef) {
  return (
    <div
      {...elementProps}
      ref={forwardedRef}
      className={clsx("gl-new-dropdown-footer", className)} />
  );
});

type DisclosureDropdownContentChildren = {
  body: ReactNode[];
  footer: ReactElement<GlDropdownFooterProps> | null;
  header: ReactElement<GlDropdownHeaderProps> | null;
};

function resolveDisclosureDropdownContentChildren(
  children: ReactNode,
): DisclosureDropdownContentChildren {
  const result: DisclosureDropdownContentChildren = { body: [], footer: null, header: null };

  const visit = (child: ReactNode) => {
    if(child === null || child === undefined || typeof child === "boolean") return;
    if(isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      Children.forEach(child.props.children, visit);
      return;
    }
    if(isValidElement<GlDropdownHeaderProps>(child)
      && child.type === GlDisclosureDropdownHeader) {
      if(result.header) {
        throw new Error("GlDisclosureDropdownContent accepts only one GlDisclosureDropdownHeader.");
      }
      result.header = child;
      return;
    }
    if(isValidElement<GlDropdownFooterProps>(child)
      && child.type === GlDisclosureDropdownFooter) {
      if(result.footer) {
        throw new Error("GlDisclosureDropdownContent accepts only one GlDisclosureDropdownFooter.");
      }
      result.footer = child;
      return;
    }
    result.body.push(child);
  };

  Children.forEach(children, visit);
  return result;
}

export const GlDisclosureDropdownContent = forwardRef<
  HTMLDivElement,
  GlDisclosureDropdownContentProps
>(function GlDisclosureDropdownContent({
  children,
  className,
  fluidWidth = false,
  offset = 8,
  onKeyDown,
  placement = "bottom-start",
  positioningStrategy = "absolute",
  style,
  ...popupProps
}, forwardedRef) {
  const context = useDropdownContext("GlDisclosureDropdownContent");
  const [arrowPadding, setArrowPadding] = useState(5);
  const [nonScrollableHeight, setNonScrollableHeight] = useState(0);
  const [popupElement, setPopupElement] = useState<HTMLDivElement | null>(null);
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  const [showBottomScrim, setShowBottomScrim] = useState(false);
  const [showTopScrim, setShowTopScrim] = useState(false);
  const typeaheadRef = useRef({ timeout: 0, value: "" });
  const popupRef = useMergedRefs(forwardedRef, context.setPopupElement, setPopupElement);
  const resolvedPlacement = resolveDropdownPlacement(placement);
  const resolvedOffset = resolveDropdownOffset(offset);
  const contentChildren = resolveDisclosureDropdownContentChildren(children);

  const updateScrims = useCallback(() => {
    if(!scrollElement) return;

    const currentTop = scrollElement.scrollTop > 0;
    const currentBottom = Math.ceil(scrollElement.scrollTop + scrollElement.clientHeight)
      < scrollElement.scrollHeight;

    setShowTopScrim(currentTop);
    setShowBottomScrim(currentBottom);
  }, [scrollElement]);

  const updateContentMeasurements = useCallback(() => {
    if(!scrollElement) return;

    const innerElement = scrollElement.parentElement;
    const measuredHeight = innerElement
      ? Math.max(
        0,
        innerElement.getBoundingClientRect().height
          - scrollElement.getBoundingClientRect().height,
      )
      : 0;

    setNonScrollableHeight((currentHeight) => (
      Math.abs(currentHeight - measuredHeight) < 0.5 ? currentHeight : measuredHeight
    ));
    updateScrims();
  }, [scrollElement, updateScrims]);

  useEffect(() => {
    if(!scrollElement) return;

    const innerElement = scrollElement.parentElement;
    updateContentMeasurements();
    window.addEventListener("resize", updateContentMeasurements);

    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(updateContentMeasurements);
    resizeObserver?.observe(scrollElement);
    if(innerElement) resizeObserver?.observe(innerElement);

    const mutationObserver = typeof MutationObserver === "undefined"
      ? null
      : new MutationObserver(updateContentMeasurements);
    mutationObserver?.observe(innerElement ?? scrollElement, {
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateContentMeasurements);
    };
  }, [scrollElement, updateContentMeasurements]);

  useEffect(() => {
    const triggerElement = context.triggerElementRef.current;
    if(!popupElement || !triggerElement) return;

    const updateArrowPadding = () => {
      const shouldClampArrow = triggerElement.getBoundingClientRect().width
        > popupElement.getBoundingClientRect().width;
      setArrowPadding(shouldClampArrow ? 24 : 5);
    };

    updateArrowPadding();
    window.addEventListener("resize", updateArrowPadding);

    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(updateArrowPadding);
    resizeObserver?.observe(triggerElement);
    resizeObserver?.observe(popupElement);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateArrowPadding);
    };
  }, [context.triggerElementRef, popupElement]);

  useEffect(() => () => {
    window.clearTimeout(typeaheadRef.current.timeout);
  }, []);

  const handleKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    const baseEvent = event as Parameters<NonNullable<BaseMenu.Popup.Props["onKeyDown"]>>[0];
    onKeyDown?.(baseEvent);
    if(event.defaultPrevented) {
      baseEvent.preventBaseUIHandler();
      return;
    }

    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
      "[role='menuitem']:not([data-disabled])",
    ));
    if(items.length === 0) return;

    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    let nextItem: HTMLElement | undefined;

    if(event.key === "ArrowDown") {
      nextItem = items[Math.min(currentIndex + 1, items.length - 1)];
    } else if(event.key === "ArrowUp") {
      nextItem = items[currentIndex < 0 ? items.length - 1 : Math.max(currentIndex - 1, 0)];
    } else if(event.key === "Home") {
      nextItem = items[0];
    } else if(event.key === "End") {
      nextItem = items.at(-1);
    } else if(
      event.key.length === 1
      && !event.altKey
      && !event.ctrlKey
      && !event.metaKey
    ) {
      const character = event.key.toLocaleLowerCase();
      const previousValue = typeaheadRef.current.value;
      const isRepeatedCharacter = previousValue.length > 0
        && [...previousValue].every((value) => value === character);
      const search = isRepeatedCharacter ? character : previousValue + character;
      const orderedItems = [
        ...items.slice(currentIndex + 1),
        ...items.slice(0, currentIndex + 1),
      ];

      nextItem = orderedItems.find((item) => (
        item.dataset.typeaheadLabel ?? item.textContent ?? ""
      ).trim().toLocaleLowerCase().startsWith(search));
      typeaheadRef.current.value = search;
      window.clearTimeout(typeaheadRef.current.timeout);
      typeaheadRef.current.timeout = window.setTimeout(() => {
        typeaheadRef.current.value = "";
      }, 500);
    }

    if(!nextItem) return;

    event.preventDefault();
    event.stopPropagation();
    (event as Parameters<NonNullable<BaseMenu.Popup.Props["onKeyDown"]>>[0])
      .preventBaseUIHandler();
    nextItem.focus();
  }, [onKeyDown]);

  const positionedPopup = (
    <BaseMenu.Positioner
      align={resolvedPlacement.align}
      alignOffset={resolvedOffset.alignOffset}
      arrowPadding={arrowPadding}
      className="gl-new-dropdown-container"
      collisionAvoidance={{ align: "shift", fallbackAxisSide: "none", side: "flip" }}
      positionMethod={positioningStrategy}
      side={resolvedPlacement.side}
      sideOffset={resolvedOffset.sideOffset}>
      <BaseMenu.Popup
        {...popupProps}
        ref={popupRef}
        className={popupVariants({ className, fluidWidth })}
        finalFocus={() => context.returnFocusRef.current
          ? context.triggerElementRef.current
          : false}
        onKeyDown={handleKeyDown}
        style={style}>
        <BaseMenu.Arrow className="gl-new-dropdown-arrow" />
        <div className="gl-new-dropdown-inner">
          {contentChildren.header}
          <div
            ref={setScrollElement}
            className={clsx(
              "gl-new-dropdown-contents",
              "gl-new-dropdown-contents-with-scrim-overlay",
              showTopScrim && "top-scrim-visible",
              showBottomScrim && "bottom-scrim-visible",
            )}
            onScroll={updateScrims}
            style={{
              "--gl-new-dropdown-non-scroll-height": `${nonScrollableHeight}px`,
            } as CSSProperties}>
            <span aria-hidden className="top-scrim-wrapper">
              <span className={clsx(
                "top-scrim",
                contentChildren.header === null ? "top-scrim-light" : "top-scrim-dark",
              )} />
            </span>
            {contentChildren.body}
            <span aria-hidden className="bottom-scrim-wrapper">
              <span className="bottom-scrim" />
            </span>
          </div>
          {contentChildren.footer}
        </div>
      </BaseMenu.Popup>
    </BaseMenu.Positioner>
  );

  return (
    <BaseMenu.Portal
      container={positioningStrategy === "absolute" ? context.rootElementRef : undefined}>
      {positionedPopup}
    </BaseMenu.Portal>
  );
});

export const GlDisclosureDropdownItem = forwardRef<
  HTMLElement,
  GlDisclosureDropdownItemProps
>(function GlDisclosureDropdownItem({
  children,
  className,
  closeOnClick,
  disabled = false,
  href,
  icon,
  label,
  nativeButton,
  onAction,
  onClick,
  render,
  value,
  variant = "default",
  ...elementProps
}, forwardedRef) {
  const context = useDropdownContext("GlDisclosureDropdownItem");
  const insideGroup = useContext(DisclosureDropdownGroupContext);
  const reserveIconSpace = useContext(DisclosureDropdownIconSpacingContext);
  if(!insideGroup) {
    throw new Error("GlDisclosureDropdownItem must be used inside GlDisclosureDropdownGroup.");
  }
  const handleClick: MouseEventHandler<HTMLElement> = (event) => {
    onClick?.(event);
    if(event.defaultPrevented) {
      (event as Parameters<NonNullable<BaseMenu.Item.Props["onClick"]>>[0])
        .preventBaseUIHandler();
      return;
    }

    const details = { event, value };
    onAction?.(details);
    context.dispatchAction(details);
  };

  const itemRender = render
    ?? (href !== undefined
      ? <GlLink disabled={disabled} href={href} variant="unstyled" />
      : <button disabled={disabled} type="button" />);

  return (
    <BaseMenu.Item
      {...elementProps}
      ref={forwardedRef}
      className={itemVariants({ className, disabled, variant })}
      closeOnClick={closeOnClick ?? context.autoClose}
      disabled={disabled}
      data-typeahead-label={label}
      label={label}
      nativeButton={render ? nativeButton : href === undefined}
      onClick={handleClick}
      render={itemRender}>
      <span className="gl-new-dropdown-item-content">
        <span className="gl-new-dropdown-item-text-wrapper">
          {icon || reserveIconSpace ? (
            <span aria-hidden className="gl-new-dropdown-item-icon">
              {icon ? <GlIcon name={icon} variant="current" /> : null}
            </span>
          ) : null}
          {children}
        </span>
      </span>
    </BaseMenu.Item>
  );
});

/** @internal Shared with the colocated group implementation. */
export function hasDirectDisclosureDropdownItemIcon(children: ReactNode): boolean {
  return Children.toArray(children).some((child) => {
    if(!isValidElement<{ children?: ReactNode; icon?: string }>(child)) return false;
    if(child.type === GlDisclosureDropdownItem) return Boolean(child.props.icon);
    if(child.type === Fragment) return hasDirectDisclosureDropdownItemIcon(child.props.children);
    return false;
  });
}

export default GlDisclosureDropdown;
