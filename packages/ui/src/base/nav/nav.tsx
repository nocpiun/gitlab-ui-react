/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/nav_item/nav_item.vue
 *
 * Adaptations:
 * - The single Vue component is exposed as a React compound component so the
 *   navigation list and nested-list semantics are explicit.
 * - Icons, avatars, labels, and addons are children of the same interactive
 *   element instead of named Vue slots.
 * - Parent expansion uses an internal Base UI Collapsible with uncontrolled
 *   and controlled APIs whose trigger and panel merge into the public button
 *   and list elements.
 * - GlNavProvider and GlCollapsibleNav are React-only responsive composition
 *   helpers inspired by, but not exposed by, GitLab's Super Sidebar.
 */

import {
  Children,
  Fragment,
  cloneElement,
  createContext,
  createElement,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ElementType,
  type HTMLAttributes,
  type KeyboardEventHandler,
  type LiHTMLAttributes,
  type MouseEventHandler,
  type PointerEventHandler,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { Button as BaseButton } from "@base-ui/react/button";
import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { cva } from "class-variance-authority";
import { mergeRefs } from "../../internal/utils/merge-refs";
import GlAvatar from "../avatar/avatar";
import GlButton from "../button/button";
import GlIcon from "../icon/icon";
import GlLink, { type GlLinkProps } from "../link/link";
import GlPopover, {
  GlPopoverContent,
  GlPopoverTitle,
  GlPopoverTrigger,
} from "../popover/popover";
import GlTooltip, { GlTooltipContent, GlTooltipTrigger } from "../tooltip/tooltip";

export type GlNavItemIndicatorPosition = "bottom" | "left" | "right";

export type GlNavProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  children?: ReactNode;
};

export type GlCollapsibleNavProps = Omit<GlNavProps, "id"> & {
  /** The navigation ID is owned by GlNavProvider so every remote toggle shares it. */
  id?: never;
};

export type GlNavProviderProps = {
  children?: ReactNode;
  /** Initial state when uncontrolled. */
  defaultOpen?: boolean;
  /** ID used by the navigation and every toggle's aria-controls. */
  navId?: string;
  /** Called when a toggle, backdrop, or Escape requests a state change. */
  onOpenChange?: (open: boolean) => void;
  /** Controlled expanded state. */
  open?: boolean;
};

export type GlCollapsibleNavToggleProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-controls" | "aria-expanded" | "aria-label" | "children"
> & {
  /** Accessible and visible label used while the sidebar is expanded. */
  collapseLabel?: string;
  /** Accessible label used while the sidebar is collapsed. */
  expandLabel?: string;
};

export type GlNavItemProps = Omit<LiHTMLAttributes<HTMLLIElement>, "children"> & {
  children: ReactNode;
  /** Prevents the item's button or link from being activated. */
  disabled?: boolean;
  /** Position of the selected indicator. */
  indicatorPosition?: GlNavItemIndicatorPosition;
  /** Places the item's button or link in its selected visual state. */
  selected?: boolean;
};

export type GlSubNavProps = Omit<HTMLAttributes<HTMLUListElement>, "children"> & {
  children?: ReactNode;
  /** Initial expansion state when uncontrolled. Changes after mount do not control the item. */
  defaultOpen?: boolean;
  /** Called when interaction requests an expansion-state change. */
  onOpenChange?: (open: boolean) => void;
  /** Controlled expansion state. */
  open?: boolean;
};

export type GlSubNavItemProps = Omit<LiHTMLAttributes<HTMLLIElement>, "children"> & {
  children: ReactNode;
  /** Prevents the item's button or link from being activated. */
  disabled?: boolean;
  /** Position of the selected indicator. */
  indicatorPosition?: GlNavItemIndicatorPosition;
  /** Places the item's button or link in its selected visual state. */
  selected?: boolean;
};

type NavButtonSharedProps = {
  children?: ReactNode;
  className?: string;
  /** Shows only the leading icon or avatar. An accessible label is required. */
  isIconOnly?: boolean;
  onClick?: React.MouseEventHandler<HTMLElement>;
  onEscape?: KeyboardEventHandler<HTMLElement>;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
  onPointerLeave?: React.PointerEventHandler<HTMLElement>;
  onPointerOver?: React.PointerEventHandler<HTMLElement>;
};

type NativeNavButtonProps = Omit<
  BaseButton.Props,
  keyof NavButtonSharedProps | "disabled" | "focusableWhenDisabled" | "nativeButton" | "render"
> & {
  href?: never;
  render?: never;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
};

type NavLinkBaseProps = Omit<
  GlLinkProps,
  | keyof NavButtonSharedProps
  | "active"
  | "disabled"
  | "href"
  | "render"
  | "showExternalIcon"
  | "variant"
>;

type HrefNavButtonProps = NavLinkBaseProps & {
  /** A non-empty value renders a safe GlLink; an empty string renders a button. */
  href: string;
  render?: never;
  type?: never;
};

type RenderNavButtonProps = NavLinkBaseProps & {
  href?: never;
  /** Base UI composition hook for a router link that ultimately renders an anchor. */
  render: NonNullable<GlLinkProps["render"]>;
  type?: never;
};

export type GlNavButtonProps = NavButtonSharedProps & (
  | HrefNavButtonProps
  | NativeNavButtonProps
  | RenderNavButtonProps
);

export type GlSubNavButtonProps = GlNavButtonProps;

export type GlNavItemAddonProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children" | "onClick" | "onKeyDown" | "role" | "tabIndex"
> & {
  /** Non-interactive, static-width content such as a count or badge. */
  children?: ReactNode;
};

type ButtonOwner = {
  disabled: boolean;
  flyout?: {
    close(): void;
    open: boolean;
    toggle(): void;
  };
  hasSubNav: boolean;
  indicatorPosition: GlNavItemIndicatorPosition;
  isToggle?: boolean;
  level: "nav" | "subnav";
  selected: boolean;
  triggerRef?: { current: HTMLElement | null };
};

type NavProviderContextValue = {
  activeFlyoutId: string | null;
  isDesktop: boolean;
  navId: string;
  open: boolean;
  registerNav(id: symbol): () => void;
  requestOpen(
    open: boolean,
    options?: { externalOpener?: HTMLElement | null; restoreFocus?: boolean },
  ): void;
  setActiveFlyoutId(id: string | null): void;
  viewportReady: boolean;
};

type NavContextValue =
  | { kind: "collapsible"; provider: NavProviderContextValue }
  | { kind: "plain" };

const NavProviderContext = createContext<NavProviderContextValue | null>(null);
const NavContext = createContext<NavContextValue | null>(null);
const SubNavContext = createContext(false);
const SubNavPanelIdContext = createContext<string | undefined>(undefined);
const ButtonOwnerContext = createContext<ButtonOwner | null>(null);
const AddonContext = createContext(false);

// Keep these component selectors assembled at runtime. The Tailwind 3 prefix
// compatibility scanner otherwise mistakes them for the `nav` and `nav-item`
// utilities and rewrites Bootstrap compatibility selectors used by GlTabs.
const navClass = ["gl", "nav"].join("-");
const navItemClass = ["gl", "nav", "item"].join("-");

const navButtonVariants = cva(navItemClass, {
  variants: {
    hasEndSlot: { false: null, true: "gl-nav-item-has-end-slot" },
    hasStartSlot: { false: null, true: "gl-nav-item-has-start-slot" },
    iconOnly: { false: null, true: "gl-nav-item-is-icon-only" },
    indicatorPosition: {
      bottom: "gl-nav-item-indicator-bottom",
      left: "gl-nav-item-indicator-left",
      right: "gl-nav-item-indicator-right",
    },
    level: { nav: null, subnav: "gl-sub-nav-button" },
    selected: { false: null, true: "selected" },
  },
  defaultVariants: {
    hasEndSlot: false,
    hasStartSlot: false,
    iconOnly: false,
    indicatorPosition: "left",
    level: "nav",
    selected: false,
  },
});

const navVariants = cva(navClass);
const collapsibleNavVariants = cva([navClass, "gl-collapsible-nav"]);
const navListVariants = cva("gl-nav-list");
const navListItemVariants = cva("gl-nav-list-item");
const subNavVariants = cva("gl-sub-nav");
const subNavListItemVariants = cva("gl-sub-nav-item");
const navSlotVariants = cva("gl-nav-item-slot");

function invariant(component: string, message: string): never {
  throw new Error(`[${component}] ${message}`);
}

function useNavProviderContext(component: string) {
  const context = useContext(NavProviderContext);
  if(!context) invariant(component, "must be used within GlNavProvider.");
  return context;
}

const DESKTOP_NAV_QUERY = "(min-width: 1200px)";

export function GlNavProvider({
  children,
  defaultOpen,
  navId,
  onOpenChange,
  open,
}: GlNavProviderProps) {
  const generatedId = useId();
  const resolvedNavId = navId ?? `gl-collapsible-nav-${generatedId}`;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [viewportReady, setViewportReady] = useState(false);
  const [activeFlyoutId, setActiveFlyoutId] = useState<string | null>(null);
  const registeredNav = useRef<symbol | null>(null);
  const externalOpener = useRef<HTMLElement | null>(null);
  const restoreFocusOnClose = useRef(false);
  const previousOpen = useRef(open ?? uncontrolledOpen);
  const hasAutomaticInitialState = open === undefined && defaultOpen === undefined;
  const isControlled = open !== undefined;
  const resolvedOpen = open ?? uncontrolledOpen;

  useEffect(() => {
    if(typeof window === "undefined") return;
    if(typeof window.matchMedia !== "function") {
      setViewportReady(true);
      return;
    }

    const mediaQuery = window.matchMedia(DESKTOP_NAV_QUERY);
    setIsDesktop(mediaQuery.matches);
    if(hasAutomaticInitialState) setUncontrolledOpen(mediaQuery.matches);
    setViewportReady(true);

    const handleChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    mediaQuery.addEventListener?.("change", handleChange);
    return () => mediaQuery.removeEventListener?.("change", handleChange);
  }, [hasAutomaticInitialState]);

  useEffect(() => {
    if(resolvedOpen || !isDesktop) setActiveFlyoutId(null);
  }, [isDesktop, resolvedOpen]);

  useEffect(() => {
    const wasOpen = previousOpen.current;
    previousOpen.current = resolvedOpen;
    if(!wasOpen || resolvedOpen || !restoreFocusOnClose.current) return;

    restoreFocusOnClose.current = false;
    const opener = externalOpener.current;
    if(opener?.isConnected) opener.focus();
  }, [resolvedOpen]);

  const requestOpen = useCallback<NavProviderContextValue["requestOpen"]>((
    nextOpen,
    options,
  ) => {
    if(nextOpen === resolvedOpen) return;
    if(nextOpen && options?.externalOpener) externalOpener.current = options.externalOpener;
    if(!nextOpen && options?.restoreFocus) restoreFocusOnClose.current = true;
    if(!isControlled) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }, [isControlled, onOpenChange, resolvedOpen]);

  const registerNav = useCallback((id: symbol) => {
    if(registeredNav.current && registeredNav.current !== id) {
      invariant("GlCollapsibleNav", "GlNavProvider accepts exactly one GlCollapsibleNav.");
    }

    registeredNav.current = id;
    return () => {
      if(registeredNav.current === id) registeredNav.current = null;
    };
  }, []);

  const value = useMemo<NavProviderContextValue>(() => ({
    activeFlyoutId,
    isDesktop,
    navId: resolvedNavId,
    open: resolvedOpen,
    registerNav,
    requestOpen,
    setActiveFlyoutId,
    viewportReady,
  }), [
    activeFlyoutId,
    isDesktop,
    registerNav,
    requestOpen,
    resolvedNavId,
    resolvedOpen,
    viewportReady,
  ]);

  return <NavProviderContext.Provider value={value}>{children}</NavProviderContext.Provider>;
}

function flattenChildren(children: ReactNode, result: ReactNode[] = []): ReactNode[] {
  Children.forEach(children, (child) => {
    if(child === null || child === undefined || typeof child === "boolean") return;

    if(isValidElement(child) && child.type === Fragment) {
      flattenChildren((child.props as { children?: ReactNode }).children, result);
      return;
    }

    result.push(child);
  });

  return result;
}

function hasElementType(node: ReactNode, component: React.ElementType) {
  return isValidElement(node) && node.type === component;
}

function getElementProps(element: ReactElement) {
  return element.props as Record<string, unknown> & { children?: ReactNode };
}

function withoutChildren(element: ReactElement) {
  const props = { ...getElementProps(element) };
  delete props.children;
  return createElement(element.type as ElementType, props);
}

function withoutChildrenAndId(element: ReactElement) {
  const props = { ...getElementProps(element) };
  delete props.children;
  delete props.id;
  return createElement(element.type as ElementType, props);
}

function isLeading(node: ReactNode) {
  return hasElementType(node, GlIcon) || hasElementType(node, GlAvatar);
}

function isAddon(node: ReactNode): node is ReactElement<GlNavItemAddonProps> {
  return hasElementType(node, GlNavItemAddon);
}

function containsAddon(node: ReactNode): boolean {
  return flattenChildren(node).some((child) => {
    if(!isValidElement(child)) return false;
    if(isAddon(child)) return true;
    return containsAddon(getElementProps(child).children);
  });
}

type ResolvedButtonContent = {
  addon?: ReactElement<GlNavItemAddonProps>;
  label: ReactNode[];
  leading?: ReactNode;
};

function resolveButtonContent(children: ReactNode, component: string): ResolvedButtonContent {
  const nodes = flattenChildren(children);
  const leading = isLeading(nodes[0]) ? nodes.shift() : undefined;

  nodes.forEach((node) => {
    if(isLeading(node)) {
      invariant(
        component,
        "GlIcon or GlAvatar must be the first effective child and may appear at most once.",
      );
    }

    if(!isAddon(node) && containsAddon(node)) {
      invariant(component, "GlNavItemAddon must be a direct child.");
    }
  });

  const addons = nodes.filter(isAddon);
  if(addons.length > 1) invariant(component, "accepts at most one GlNavItemAddon.");

  const addon = addons[0];
  if(addon && nodes.at(-1) !== addon) {
    invariant(component, "GlNavItemAddon must be the last effective child.");
  }

  return { addon, label: addon ? nodes.slice(0, -1) : nodes, leading };
}

function simpleTextLabel(nodes: ReactNode[]) {
  if(nodes.some((node) => typeof node !== "string" && typeof node !== "number")) return undefined;
  const label = nodes.join("").replace(/\s+/gu, " ").trim();
  return label || undefined;
}

function NavItemChevron() {
  return (
    <span
      className={navSlotVariants()}
      data-testid="nav-item-chevron"
      aria-hidden="true">
      <svg
        className="gl-nav-item-animated-chevron gl-nav-item-chevron"
        fill="none"
        focusable="false"
        height="16"
        viewBox="0 0 16 16"
        width="16">
        <path
          className="gl-nav-item-animated-chevron-arrow"
          d="M6.75 4.75L10 8L6.75 11.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5" />
      </svg>
    </span>
  );
}

type NavButtonRuntimeProps = NavButtonSharedProps & NavLinkBaseProps & {
  href?: string;
  onPointerDown?: PointerEventHandler<HTMLElement>;
  render?: GlLinkProps["render"];
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
};

function useNavButton(
  component: "GlCollapsibleNavToggle" | "GlNavButton" | "GlSubNavButton",
  props: GlNavButtonProps,
  forwardedRef: Ref<HTMLElement>,
) {
  const owner = useContext(ButtonOwnerContext);
  const nav = useContext(NavContext);
  const subNavPanelId = useContext(SubNavPanelIdContext);
  const expectedLevel = component === "GlSubNavButton" ? "subnav" : "nav";

  if(owner?.level !== expectedLevel || (component === "GlCollapsibleNavToggle" && !owner.isToggle)) {
    invariant(
      component,
      component === "GlSubNavButton"
        ? "must be the direct button child of GlSubNavItem."
        : component === "GlNavButton"
        ? "must be the direct button child of GlNavItem."
        : "must be the direct toggle child of GlNavItem in GlCollapsibleNav.",
    );
  }

  const {
    "aria-controls": ariaControls,
    "aria-current": ariaCurrent,
    "aria-expanded": ariaExpanded,
    "aria-label": ariaLabel,
    children,
    className,
    download,
    href,
    hrefLang,
    isUnsafeLink = false,
    isIconOnly = false,
    media,
    onClick,
    onEscape,
    onKeyDown,
    onPointerDown,
    onPointerLeave,
    onPointerOver,
    ping,
    referrerPolicy,
    rel,
    render,
    target,
    type = "button",
    ...elementProps
  } = props as NavButtonRuntimeProps;
  const { addon, label, leading } = resolveButtonContent(children, component);
  const isCollapsibleTopLevel = nav?.kind === "collapsible" && owner.level === "nav";
  const isRail = Boolean(isCollapsibleTopLevel && nav.provider.isDesktop && !nav.provider.open);
  const effectiveIconOnly = isIconOnly || isRail;
  const derivedLabel = simpleTextLabel(label);
  const hasAutomaticChevron = Boolean(owner.hasSubNav && !addon && !effectiveIconOnly);
  const hasEndSlot = Boolean(!effectiveIconOnly && (addon || hasAutomaticChevron));
  const resolvedAriaControls = subNavPanelId
    && (ariaExpanded === true || ariaExpanded === "true")
    ? subNavPanelId
    : ariaControls;
  const classes = navButtonVariants({
    className,
    hasEndSlot,
    hasStartSlot: Boolean(leading),
    iconOnly: effectiveIconOnly,
    indicatorPosition: owner.indicatorPosition,
    level: owner.level,
    selected: owner.selected,
  });

  if(isIconOnly && !leading) {
    invariant(component, "isIconOnly requires a leading GlIcon or GlAvatar.");
  }
  if(isIconOnly && !ariaLabel) invariant(component, "isIconOnly requires aria-label.");
  if(isCollapsibleTopLevel && !leading) {
    invariant(component, "requires a direct leading GlIcon or GlAvatar in GlCollapsibleNav.");
  }
  if(isCollapsibleTopLevel && !ariaLabel && !derivedLabel) {
    invariant(component, "requires aria-label when its label is not simple text.");
  }

  const pointerType = useRef("");
  const buttonRef = mergeRefs(forwardedRef, owner.triggerRef);
  const handlePointerDown: PointerEventHandler<HTMLElement> = (event) => {
    pointerType.current = event.pointerType;
    onPointerDown?.(event);
  };
  const handleClick: MouseEventHandler<HTMLElement> = (event) => {
    onClick?.(event);
    if(event.defaultPrevented || !owner.flyout || pointerType.current !== "touch") return;

    event.preventDefault();
    owner.flyout.toggle();
  };

  const handleKeyDown: KeyboardEventHandler<HTMLElement> = (event) => {
    onKeyDown?.(event);
    if(event.defaultPrevented) return;
    if(owner.flyout && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      owner.flyout.toggle();
      return;
    }
    if(event.key === "Escape") {
      if(owner.flyout?.open) {
        event.preventDefault();
        owner.flyout.close();
        event.currentTarget.focus();
      }
      onEscape?.(event);
    }
  };
  const resolvedAriaLabel = ariaLabel ?? (isRail ? derivedLabel : undefined);
  const content = (
    <>
      {leading ? (
        <span className={navSlotVariants()} data-testid="nav-item-start">{leading}</span>
      ) : null}
      {!isIconOnly ? (
        <>
          {label.length > 0 ? (
            <span className="gl-nav-item-label" data-testid="nav-item-label">{label}</span>
          ) : null}
          {addon ? (
            <AddonContext.Provider value>{addon}</AddonContext.Provider>
          ) : hasAutomaticChevron ? <NavItemChevron /> : null}
        </>
      ) : null}
    </>
  );

  let button: ReactElement;
  if(Boolean(href) || render !== undefined) {
    button = (
      <GlLink
        {...elementProps}
        ref={buttonRef as Ref<HTMLAnchorElement>}
        aria-controls={resolvedAriaControls}
        aria-current={ariaCurrent ?? (owner.selected ? "page" : undefined)}
        aria-expanded={ariaExpanded}
        aria-label={resolvedAriaLabel}
        className={classes}
        disabled={owner.disabled}
        download={download}
        href={href || undefined}
        hrefLang={hrefLang}
        isUnsafeLink={isUnsafeLink}
        media={media}
        onClick={handleClick as React.MouseEventHandler<HTMLAnchorElement>}
        onKeyDown={handleKeyDown as KeyboardEventHandler<HTMLAnchorElement>}
        onPointerDown={handlePointerDown as React.PointerEventHandler<HTMLAnchorElement>}
        onPointerLeave={onPointerLeave as React.PointerEventHandler<HTMLAnchorElement>}
        onPointerOver={onPointerOver as React.PointerEventHandler<HTMLAnchorElement>}
        ping={ping}
        referrerPolicy={referrerPolicy}
        rel={rel}
        render={render}
        target={target}
        variant="unstyled">
        {content}
      </GlLink>
    );
  } else {
    button = (
      <BaseButton
        {...elementProps as unknown as BaseButton.Props}
        ref={buttonRef}
        aria-controls={resolvedAriaControls}
        aria-current={ariaCurrent}
        aria-expanded={ariaExpanded}
        aria-label={resolvedAriaLabel}
        className={classes}
        disabled={owner.disabled}
        nativeButton
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerLeave={onPointerLeave}
        onPointerOver={onPointerOver}
        type={type}>
        {content}
      </BaseButton>
    );
  }

  const tooltipLabel = ariaLabel ?? derivedLabel;
  if(!isRail || owner.hasSubNav || !tooltipLabel) return button;

  return (
    <GlTooltip>
      <GlTooltipTrigger>{button}</GlTooltipTrigger>
      <GlTooltipContent boundary="viewport" placement="right">
        {tooltipLabel}
      </GlTooltipContent>
    </GlTooltip>
  );
}

export const GlNavButton = forwardRef<HTMLElement, GlNavButtonProps>(function GlNavButton(
  props,
  forwardedRef,
) {
  return useNavButton("GlNavButton", props, forwardedRef);
});

export const GlSubNavButton = forwardRef<HTMLElement, GlSubNavButtonProps>(
  function GlSubNavButton(props, forwardedRef) {
    return useNavButton("GlSubNavButton", props, forwardedRef);
  },
);

function InternalCollapsibleNavToggle({
  collapseLabel = "Collapse sidebar",
  disabled: _disabled,
  expandLabel = "Expand sidebar",
  forwardedRef,
  onClick,
  type = "button",
  ...buttonProps
}: GlCollapsibleNavToggleProps & { forwardedRef: Ref<HTMLElement> }) {
  const provider = useNavProviderContext("GlCollapsibleNavToggle");
  const label = provider.open ? collapseLabel : expandLabel;

  const handleClick: MouseEventHandler<HTMLElement> = (event) => {
    (onClick as MouseEventHandler<HTMLElement> | undefined)?.(event);
    if(event.defaultPrevented) return;
    provider.requestOpen(!provider.open, {
      restoreFocus: !provider.isDesktop && provider.open,
    });
  };

  return useNavButton("GlCollapsibleNavToggle", {
    ...buttonProps,
    "aria-controls": provider.navId,
    "aria-expanded": provider.open,
    "aria-label": label,
    children: (
      <>
        <GlIcon name={provider.open ? "collapse-left" : "collapse-right"} />
        {label}
      </>
    ),
    onClick: handleClick,
    type,
  } as GlNavButtonProps, forwardedRef);
}

function ExternalCollapsibleNavToggle({
  collapseLabel = "Collapse sidebar",
  expandLabel = "Expand sidebar",
  forwardedRef,
  onClick,
  type = "button",
  ...buttonProps
}: GlCollapsibleNavToggleProps & { forwardedRef: Ref<HTMLElement> }) {
  const provider = useNavProviderContext("GlCollapsibleNavToggle");
  const label = provider.open ? collapseLabel : expandLabel;
  const handleClick: MouseEventHandler<HTMLElement> = (event) => {
    (onClick as MouseEventHandler<HTMLElement> | undefined)?.(event);
    if(event.defaultPrevented) return;
    provider.requestOpen(!provider.open, {
      externalOpener: event.currentTarget,
    });
  };
  const button = (
    <GlButton
      {...buttonProps as Omit<React.ComponentProps<typeof GlButton>, "children">}
      ref={forwardedRef}
      aria-controls={provider.navId}
      aria-expanded={provider.open}
      aria-label={label}
      category="tertiary"
      data-gl-collapsible-nav-toggle="external"
      icon="sidebar"
      onClick={handleClick}
      type={type} />
  );

  return (
    <GlTooltip>
      <GlTooltipTrigger>{button}</GlTooltipTrigger>
      <GlTooltipContent boundary="viewport" placement="right">{label}</GlTooltipContent>
    </GlTooltip>
  );
}

export const GlCollapsibleNavToggle = forwardRef<HTMLElement, GlCollapsibleNavToggleProps>(
  function GlCollapsibleNavToggle(props, forwardedRef) {
    const owner = useContext(ButtonOwnerContext);
    const componentProps = { ...props, forwardedRef };
    return owner?.isToggle
      ? <InternalCollapsibleNavToggle {...componentProps} />
      : <ExternalCollapsibleNavToggle {...componentProps} />;
  },
);

export const GlNavItemAddon = forwardRef<HTMLSpanElement, GlNavItemAddonProps>(
  function GlNavItemAddon({ children, className, ...elementProps }, forwardedRef) {
    if(!useContext(AddonContext)) {
      invariant(
        "GlNavItemAddon",
        "must be the last effective direct child of GlNavButton or GlSubNavButton.",
      );
    }

    return (
      <span
        {...elementProps}
        ref={forwardedRef}
        className={navSlotVariants({ className: ["gl-nav-item-addon", className] })}
        data-testid="nav-item-end">
        {children}
      </span>
    );
  },
);

function requireSingleButton(
  children: ReactNode,
  component: "GlSubNavItem",
) {
  const nodes = flattenChildren(children);
  const buttons = nodes.filter((node) => hasElementType(node, GlSubNavButton));

  if(buttons.length !== 1) {
    invariant(component, "requires exactly one GlSubNavButton.");
  }

  return { button: buttons[0] as ReactElement<GlNavButtonProps>, nodes };
}

function validateSubNavChildren(children: ReactNode) {
  const nodes = flattenChildren(children);
  if(nodes.some((node) => !hasElementType(node, GlSubNavItem))) {
    invariant("GlSubNav", "only accepts GlSubNavItem children.");
  }

  nodes.forEach((node) => {
    const props = getElementProps(node as ReactElement);
    const structure = requireSingleButton(props.children, "GlSubNavItem");
    if(structure.nodes.length !== 1) {
      invariant("GlSubNavItem", "only accepts one GlSubNavButton.");
    }
  });
}

export const GlNavItem = forwardRef<HTMLLIElement, GlNavItemProps>(function GlNavItem({
  children,
  className,
  disabled = false,
  indicatorPosition = "left",
  selected = false,
  ...elementProps
}, forwardedRef) {
  const nav = useContext(NavContext);
  const generatedFlyoutId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  if(!nav) invariant("GlNavItem", "must be a direct child of GlNav or GlCollapsibleNav.");

  const nodes = flattenChildren(children);
  const buttons = nodes.filter((node) => hasElementType(node, GlNavButton));
  const toggles = nodes.filter((node) => hasElementType(node, GlCollapsibleNavToggle));
  if(nav.kind === "plain" && toggles.length > 0) {
    invariant("GlNavItem", "GlCollapsibleNavToggle is only accepted by GlCollapsibleNav.");
  }
  if(buttons.length + toggles.length !== 1) {
    invariant(
      "GlNavItem",
      nav.kind === "collapsible"
        ? "requires exactly one GlNavButton or GlCollapsibleNavToggle."
        : "requires exactly one GlNavButton.",
    );
  }

  const button = (buttons[0] ?? toggles[0]) as ReactElement<GlNavButtonProps>;
  const isToggle = toggles.length === 1;
  const subNavs = nodes.filter((node) => hasElementType(node, GlSubNav));
  const unexpected = nodes.filter(
    (node) => !hasElementType(node, GlNavButton)
      && !hasElementType(node, GlCollapsibleNavToggle)
      && !hasElementType(node, GlSubNav),
  );

  if(unexpected.length > 0) {
    invariant(
      "GlNavItem",
      "only accepts GlNavButton or GlCollapsibleNavToggle and an optional GlSubNav.",
    );
  }
  if(subNavs.length > 1) invariant("GlNavItem", "accepts at most one GlSubNav.");
  if(nodes[0] !== button) {
    invariant(
      "GlNavItem",
      isToggle ? "GlCollapsibleNavToggle must precede GlSubNav." : "GlNavButton must precede GlSubNav.",
    );
  }
  if(isToggle && subNavs.length > 0) {
    invariant("GlNavItem", "GlCollapsibleNavToggle cannot be used with GlSubNav.");
  }

  const subNav = subNavs[0] as ReactElement<GlSubNavProps> | undefined;
  const provider = nav.kind === "collapsible" ? nav.provider : undefined;
  const flyoutId = `gl-collapsible-nav-flyout-${generatedFlyoutId}`;
  const isFlyout = Boolean(subNav && provider?.isDesktop && !provider.open);
  const flyoutOpen = provider?.activeFlyoutId === flyoutId;
  const owner: ButtonOwner = {
    disabled,
    flyout: isFlyout && provider ? {
      close: () => provider.setActiveFlyoutId(null),
      open: flyoutOpen,
      toggle: () => provider.setActiveFlyoutId(flyoutOpen ? null : flyoutId),
    } : undefined,
    hasSubNav: Boolean(subNav),
    indicatorPosition,
    isToggle,
    level: "nav",
    selected,
    triggerRef,
  };
  const item = <li {...elementProps} className={navListItemVariants({ className })} />;

  if(!subNav) {
    return cloneElement(item, { ref: forwardedRef }, (
      <ButtonOwnerContext.Provider value={owner}>{button}</ButtonOwnerContext.Provider>
    ));
  }

  const buttonProps = getElementProps(button);
  if(Boolean(buttonProps.href) || buttonProps.render !== undefined) {
    invariant("GlNavItem", "a GlNavButton with GlSubNav cannot use href or render.");
  }

  const subNavProps = getElementProps(subNav);
  validateSubNavChildren(subNavProps.children);
  const onOpenChange = subNavProps.onOpenChange as GlSubNavProps["onOpenChange"];
  const open = typeof subNavProps.open === "boolean" ? subNavProps.open : undefined;
  const panelId = typeof subNavProps.id === "string" ? subNavProps.id : undefined;

  if(isFlyout && provider) {
    const resolvedContent = resolveButtonContent(buttonProps.children, "GlNavButton");
    const flyoutLabel = typeof buttonProps["aria-label"] === "string"
      ? buttonProps["aria-label"]
      : simpleTextLabel(resolvedContent.label) ?? "Navigation";
    const handleFlyoutOpenChange = (nextOpen: boolean) => {
      if(nextOpen) provider.setActiveFlyoutId(flyoutId);
      else if(provider.activeFlyoutId === flyoutId) provider.setActiveFlyoutId(null);
    };
    const handleFlyoutKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
      if(event.defaultPrevented || event.key !== "Escape") return;

      event.preventDefault();
      event.stopPropagation();
      provider.setActiveFlyoutId(null);
      triggerRef.current?.focus();
    };

    return (
      <BaseCollapsible.Root
        ref={forwardedRef as Ref<HTMLDivElement>}
        defaultOpen={Boolean(subNavProps.defaultOpen)}
        disabled={disabled}
        onOpenChange={(nextOpen) => onOpenChange?.(nextOpen)}
        open={open}
        render={item}>
        <GlPopover
          disabled={disabled}
          onOpenChange={handleFlyoutOpenChange}
          open={flyoutOpen}
          triggers={["hover"]}>
          <ButtonOwnerContext.Provider value={owner}>
            <GlPopoverTrigger>{button}</GlPopoverTrigger>
          </ButtonOwnerContext.Provider>
          <GlPopoverContent
            boundary="viewport"
            className="gl-collapsible-nav-flyout"
            onKeyDown={handleFlyoutKeyDown}
            placement="right">
            <GlPopoverTitle>{flyoutLabel}</GlPopoverTitle>
            <SubNavContext.Provider value>{subNav}</SubNavContext.Provider>
          </GlPopoverContent>
        </GlPopover>
      </BaseCollapsible.Root>
    );
  }

  return (
    <BaseCollapsible.Root
      ref={forwardedRef as Ref<HTMLDivElement>}
      defaultOpen={Boolean(subNavProps.defaultOpen)}
      disabled={disabled}
      onOpenChange={(nextOpen) => onOpenChange?.(nextOpen)}
      open={open}
      render={item}>
      <ButtonOwnerContext.Provider value={owner}>
        <SubNavPanelIdContext.Provider value={panelId}>
          <BaseCollapsible.Trigger render={withoutChildren(button)}>
            {buttonProps.children}
          </BaseCollapsible.Trigger>
        </SubNavPanelIdContext.Provider>
      </ButtonOwnerContext.Provider>
      <SubNavContext.Provider value>
        <BaseCollapsible.Panel id={panelId} render={withoutChildrenAndId(subNav)}>
          {subNavProps.children}
        </BaseCollapsible.Panel>
      </SubNavContext.Provider>
    </BaseCollapsible.Root>
  );
});

export const GlSubNav = forwardRef<HTMLUListElement, GlSubNavProps>(function GlSubNav({
  children,
  className,
  defaultOpen: _defaultOpen = false,
  onOpenChange: _onOpenChange,
  open: _open,
  ...elementProps
}, forwardedRef) {
  if(!useContext(SubNavContext)) invariant("GlSubNav", "must be a direct child of GlNavItem.");

  validateSubNavChildren(children);

  return (
    <ul {...elementProps} ref={forwardedRef} className={subNavVariants({ className })}>
      {children}
    </ul>
  );
});

export const GlSubNavItem = forwardRef<HTMLLIElement, GlSubNavItemProps>(
  function GlSubNavItem({
    children,
    className,
    disabled = false,
    indicatorPosition = "left",
    selected = false,
    ...elementProps
  }, forwardedRef) {
    if(!useContext(SubNavContext)) {
      invariant("GlSubNavItem", "must be a direct child of GlSubNav.");
    }

    const { button, nodes } = requireSingleButton(children, "GlSubNavItem");
    if(nodes.length !== 1) invariant("GlSubNavItem", "only accepts one GlSubNavButton.");

    return (
      <li
        {...elementProps}
        ref={forwardedRef}
        className={subNavListItemVariants({ className })}>
        <ButtonOwnerContext.Provider value={{
          disabled,
          hasSubNav: false,
          indicatorPosition,
          level: "subnav",
          selected,
        }}>
          {button}
        </ButtonOwnerContext.Provider>
      </li>
    );
  },
);

function validateNavChildren(children: ReactNode, component: "GlCollapsibleNav" | "GlNav") {
  const nodes = flattenChildren(children);
  if(nodes.some((node) => !hasElementType(node, GlNavItem))) {
    invariant(component, "only accepts GlNavItem children.");
  }
}

function getFocusableElements(container: HTMLElement) {
  const selector = [
    "a[href]:not([aria-disabled='true'])",
    "button:not(:disabled)",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");
  return Array.from(container.querySelectorAll<HTMLElement>(selector))
    .filter((element) => !element.closest("[aria-hidden='true'], [hidden], [inert]"));
}

export const GlCollapsibleNav = forwardRef<HTMLElement, GlCollapsibleNavProps>(
  function GlCollapsibleNav({
    children,
    className,
    onKeyDown,
    ...elementProps
  }, forwardedRef) {
    const provider = useNavProviderContext("GlCollapsibleNav");
    const registerNav = provider.registerNav;
    const instanceId = useRef(Symbol("GlCollapsibleNav"));
    const navElement = useRef<HTMLElement | null>(null);
    const [mounted, setMounted] = useState(false);
    const previousMobileOpen = useRef(false);
    const isMobile = provider.viewportReady && !provider.isDesktop;
    const isMobileOpen = isMobile && provider.open;

    validateNavChildren(children, "GlCollapsibleNav");

    useEffect(() => registerNav(instanceId.current), [registerNav]);
    useEffect(() => setMounted(true), []);

    useEffect(() => {
      if(!isMobileOpen || typeof document === "undefined") return;

      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }, [isMobileOpen]);

    useEffect(() => {
      const wasOpen = previousMobileOpen.current;
      previousMobileOpen.current = isMobileOpen;
      if(wasOpen || !isMobileOpen) return;

      getFocusableElements(navElement.current!).at(0)?.focus();
    }, [isMobileOpen]);

    const handleKeyDown: KeyboardEventHandler<HTMLElement> = (event) => {
      onKeyDown?.(event);
      if(event.defaultPrevented || !isMobileOpen) return;

      if(event.key === "Escape") {
        event.preventDefault();
        provider.requestOpen(false, { restoreFocus: true });
        return;
      }

      if(event.key !== "Tab") return;
      const focusable = getFocusableElements(event.currentTarget);
      if(focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable.at(-1)!;
      if(event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if(!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const nav = (
      <NavContext.Provider value={{ kind: "collapsible", provider }}>
        <nav
          {...elementProps}
          ref={mergeRefs(forwardedRef, navElement)}
          id={provider.navId}
          aria-hidden={isMobile && !provider.open || undefined}
          className={collapsibleNavVariants({ className })}
          data-desktop={provider.isDesktop || undefined}
          data-open={provider.open}
          inert={isMobile && !provider.open || undefined}
          onKeyDown={handleKeyDown}>
          <ul className={navListVariants()}>{children}</ul>
        </nav>
      </NavContext.Provider>
    );

    const backdrop = mounted && isMobile && typeof document !== "undefined"
      ? createPortal(
        <div
          className="gl-collapsible-nav-backdrop"
          data-open={provider.open}
          data-testid="collapsible-nav-backdrop"
          aria-hidden="true"
          onClick={() => {
            if(provider.open) provider.requestOpen(false, { restoreFocus: true });
          }} />,
        document.body,
      )
      : null;

    return <>{backdrop}{nav}</>;
  },
);

const GlNav = forwardRef<HTMLElement, GlNavProps>(function GlNav({
  children,
  className,
  ...elementProps
}, forwardedRef) {
  validateNavChildren(children, "GlNav");

  return (
    <NavContext.Provider value={{ kind: "plain" }}>
      <nav {...elementProps} ref={forwardedRef} className={navVariants({ className })}>
        <ul className={navListVariants()}>{children}</ul>
      </nav>
    </NavContext.Provider>
  );
});

export default GlNav;
