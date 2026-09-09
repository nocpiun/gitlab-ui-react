/**
 * React-only responsive navigation helpers inspired by GitLab's Super Sidebar.
 * These components intentionally compose the base Nav API instead of exposing
 * the upstream application's sidebar state and persistence mechanisms.
 */

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEventHandler,
  type MouseEventHandler,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { cva } from "class-variance-authority";
import { mergeRefs } from "../../internal/utils/merge-refs";
import GlButton from "../button/button";
import GlIcon from "../icon/icon";
import GlPopover, {
  GlPopoverContent,
  GlPopoverTitle,
  GlPopoverTrigger,
} from "../popover/popover";
import GlTooltip, { GlTooltipContent, GlTooltipTrigger } from "../tooltip/tooltip";
import {
  ButtonOwnerContext,
  COLLAPSIBLE_NAV_TOGGLE_MARKER,
  NavContext,
  SubNavContext,
  SubNavPanelIdContext,
  flattenChildren,
  getElementProps,
  hasElementType,
  invariant,
  withoutChildren,
  withoutChildrenAndId,
  type NavProviderContextValue,
  type NavSubNavRenderProps,
} from "./nav-contexts";
import {
  GlNavItem,
  useNavButtonInternal,
  type GlNavButtonProps,
  type GlNavProps,
  type GlSubNavProps,
} from "./nav";

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

const navClass = ["gl", "nav"].join("-");
const collapsibleNavVariants = cva([navClass, "gl-collapsible-nav"]);
const navListVariants = cva("gl-nav-list");
const DESKTOP_NAV_QUERY = "(min-width: 1200px)";
const NavProviderContext = createContext<NavProviderContextValue | null>(null);

function canReceiveRestoredFocus(element: HTMLElement | null) {
  return Boolean(
    element?.isConnected
    && element !== element.ownerDocument.body
    && element !== element.ownerDocument.documentElement
    && !element.hasAttribute("disabled")
    && element.getAttribute("aria-disabled") !== "true"
    && !element.closest("[aria-hidden='true'], [hidden], [inert]"),
  );
}

function useNavProviderContext(component: string) {
  const context = useContext(NavProviderContext);
  if(!context) invariant(component, "must be used within GlNavProvider.");
  return context;
}

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
  const externalToggles = useRef(new Set<HTMLElement>());
  const hasExplicitFocusReturnTarget = useRef(false);
  const focusReturnTarget = useRef<HTMLElement | null>(null);
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
    if(!wasOpen || resolvedOpen) return;

    const shouldRestoreFocus = restoreFocusOnClose.current;
    restoreFocusOnClose.current = false;
    const rememberedTarget = focusReturnTarget.current;
    hasExplicitFocusReturnTarget.current = false;
    focusReturnTarget.current = null;
    if(!shouldRestoreFocus) return;

    const activeElement = typeof document === "undefined" ? null : document.activeElement;
    if(activeElement instanceof HTMLElement && canReceiveRestoredFocus(activeElement)) return;

    const fallbackTarget = Array.from(externalToggles.current)
      .find((element) => canReceiveRestoredFocus(element));
    const target = canReceiveRestoredFocus(rememberedTarget)
      ? rememberedTarget
      : fallbackTarget;
    target?.focus();
  }, [resolvedOpen]);

  const captureFocusReturnTarget = useCallback((element: HTMLElement | null) => {
    restoreFocusOnClose.current = true;
    if(
      hasExplicitFocusReturnTarget.current
      && canReceiveRestoredFocus(focusReturnTarget.current)
    ) return;

    hasExplicitFocusReturnTarget.current = false;
    focusReturnTarget.current = canReceiveRestoredFocus(element) ? element : null;
  }, []);

  useEffect(() => {
    if(!isDesktop) return;

    restoreFocusOnClose.current = false;
    hasExplicitFocusReturnTarget.current = false;
    focusReturnTarget.current = null;
  }, [isDesktop]);

  const requestOpen = useCallback<NavProviderContextValue["requestOpen"]>((
    nextOpen,
    options,
  ) => {
    if(nextOpen === resolvedOpen) return;
    if(nextOpen && options?.externalOpener) {
      hasExplicitFocusReturnTarget.current = true;
      focusReturnTarget.current = options.externalOpener;
    }
    if(!nextOpen && options?.restoreFocus) restoreFocusOnClose.current = true;
    if(!isControlled) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }, [isControlled, onOpenChange, resolvedOpen]);

  const registerExternalToggle = useCallback((element: HTMLElement) => {
    externalToggles.current.add(element);
    return () => {
      externalToggles.current.delete(element);
    };
  }, []);

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
    captureFocusReturnTarget,
    isDesktop,
    navId: resolvedNavId,
    open: resolvedOpen,
    registerExternalToggle,
    registerNav,
    requestOpen,
    setActiveFlyoutId,
    viewportReady,
  }), [
    activeFlyoutId,
    captureFocusReturnTarget,
    isDesktop,
    registerExternalToggle,
    registerNav,
    requestOpen,
    resolvedNavId,
    resolvedOpen,
    viewportReady,
  ]);

  return <NavProviderContext.Provider value={value}>{children}</NavProviderContext.Provider>;
}

function InternalCollapsibleNavToggle({
  collapseLabel = "Collapse sidebar",
  disabled = false,
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

  return useNavButtonInternal("GlCollapsibleNavToggle", {
    ...buttonProps,
    "aria-controls": provider.navId,
    "aria-expanded": provider.open,
    "aria-label": label,
    children: (
      <>
        <GlIcon
          className="gl-collapsible-nav-toggle-icon"
          name={provider.open ? "collapse-left" : "collapse-right"} />
        {label}
      </>
    ),
    onClick: handleClick,
    type,
  } as GlNavButtonProps, forwardedRef, disabled);
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
  const elementRef = useRef<HTMLElement | null>(null);
  const registerExternalToggle = provider.registerExternalToggle;
  const label = provider.open ? collapseLabel : expandLabel;

  useEffect(() => {
    const element = elementRef.current;
    if(element) return registerExternalToggle(element);
  }, [registerExternalToggle]);

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
      ref={mergeRefs(forwardedRef, elementRef)}
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

export const GlCollapsibleNavToggle = Object.assign(
  forwardRef<HTMLElement, GlCollapsibleNavToggleProps>(
    function GlCollapsibleNavToggle(props, forwardedRef) {
      const owner = useContext(ButtonOwnerContext);
      const componentProps = { ...props, forwardedRef };
      return owner?.isToggle
        ? <InternalCollapsibleNavToggle {...componentProps} />
        : <ExternalCollapsibleNavToggle {...componentProps} />;
    },
  ),
  { [COLLAPSIBLE_NAV_TOGGLE_MARKER]: true as const },
);

function CollapsibleSubNav({
  button,
  disabled,
  flyoutLabel,
  forwardedRef,
  item,
  owner,
  subNav,
}: NavSubNavRenderProps) {
  const nav = useContext(NavContext);
  if(nav?.kind !== "collapsible") {
    invariant("GlNavItem", "collapsible SubNav rendering requires GlCollapsibleNav.");
  }

  const provider = nav.provider;
  const generatedFlyoutId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const flyoutId = `gl-collapsible-nav-flyout-${generatedFlyoutId}`;
  const isFlyout = provider.isDesktop && !provider.open;
  const flyoutOpen = provider.activeFlyoutId === flyoutId;
  const buttonProps = getElementProps(button);
  const subNavProps = getElementProps(subNav);
  const onOpenChange = subNavProps.onOpenChange as GlSubNavProps["onOpenChange"];
  const open = typeof subNavProps.open === "boolean" ? subNavProps.open : undefined;
  const panelId = typeof subNavProps.id === "string" ? subNavProps.id : undefined;

  if(isFlyout) {
    const flyoutOwner = {
      ...owner,
      flyout: {
        close: () => provider.setActiveFlyoutId(null),
        open: flyoutOpen,
        toggle: () => provider.setActiveFlyoutId(flyoutOpen ? null : flyoutId),
      },
      triggerRef,
    };
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
          <ButtonOwnerContext.Provider value={flyoutOwner}>
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
}

function renderCollapsibleSubNav(props: NavSubNavRenderProps) {
  return <CollapsibleSubNav {...props} />;
}

function validateNavChildren(children: ReactNode) {
  const nodes = flattenChildren(children);
  if(nodes.some((node) => !hasElementType(node, GlNavItem))) {
    invariant("GlCollapsibleNav", "only accepts GlNavItem children.");
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
    const captureFocusReturnTarget = provider.captureFocusReturnTarget;
    const isMobile = provider.viewportReady && !provider.isDesktop;
    const isMobileOpen = isMobile && provider.open;

    validateNavChildren(children);

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

      const nav = navElement.current!;
      const activeElement = document.activeElement;
      captureFocusReturnTarget(
        activeElement instanceof HTMLElement
        && activeElement !== document.body
        && activeElement !== document.documentElement
        && !nav.contains(activeElement)
          ? activeElement
          : null,
      );
      getFocusableElements(nav).at(0)?.focus();
    }, [captureFocusReturnTarget, isMobileOpen]);

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
      <NavContext.Provider value={{
        kind: "collapsible",
        provider,
        renderSubNav: renderCollapsibleSubNav,
      }}>
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
