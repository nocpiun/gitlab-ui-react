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
 */

import {
  Children,
  Fragment,
  cloneElement,
  createContext,
  createElement,
  forwardRef,
  isValidElement,
  useContext,
  type ButtonHTMLAttributes,
  type ElementType,
  type HTMLAttributes,
  type KeyboardEventHandler,
  type LiHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { cva } from "class-variance-authority";
import GlAvatar from "../avatar/avatar";
import GlIcon from "../icon/icon";
import GlLink, { type GlLinkProps } from "../link/link";

export type GlNavItemIndicatorPosition = "bottom" | "left" | "right";

export type GlNavProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  children?: ReactNode;
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
  children?: ReactNode;
};

type ButtonOwner = {
  disabled: boolean;
  hasSubNav: boolean;
  indicatorPosition: GlNavItemIndicatorPosition;
  level: "nav" | "subnav";
  selected: boolean;
};

const NavContext = createContext(false);
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
const navListVariants = cva("gl-nav-list");
const navListItemVariants = cva("gl-nav-list-item");
const subNavVariants = cva("gl-sub-nav");
const subNavListItemVariants = cva("gl-sub-nav-item");
const navSlotVariants = cva("gl-nav-item-slot");

function invariant(component: string, message: string): never {
  throw new Error(`[${component}] ${message}`);
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

const interactiveTags = new Set([
  "a", "audio", "button", "details", "embed", "iframe", "input", "object", "select",
  "summary", "textarea", "video",
]);
const interactiveRoles = new Set([
  "button", "checkbox", "combobox", "link", "menuitem", "menuitemcheckbox", "menuitemradio",
  "option", "radio", "slider", "spinbutton", "switch", "tab", "textbox",
]);

function containsInteractiveContent(node: ReactNode): boolean {
  return flattenChildren(node).some((child) => {
    if(!isValidElement(child)) return false;

    const props = getElementProps(child);
    const isInteractiveTag = typeof child.type === "string" && interactiveTags.has(child.type);
    const isInteractiveRole = typeof props.role === "string" && interactiveRoles.has(props.role);
    const hasEventHandler = Object.entries(props).some(
      ([name, value]) => /^on[A-Z]/u.test(name) && typeof value === "function",
    );
    const hasInteractiveProps = props.contentEditable === true
      || props.href !== undefined
      || (typeof props.tabIndex === "number" && props.tabIndex >= 0)
      || hasEventHandler;

    return isInteractiveTag
      || isInteractiveRole
      || hasInteractiveProps
      || containsInteractiveContent(props.children);
  });
}

function validateAddon(addon: ReactElement<GlNavItemAddonProps>) {
  const props = getElementProps(addon);
  const hasEventHandler = Object.entries(props).some(
    ([name, value]) => /^on[A-Z]/u.test(name) && typeof value === "function",
  );

  if(
    hasEventHandler
    || props.href !== undefined
    || props.role !== undefined
    || props.tabIndex !== undefined
    || containsInteractiveContent(props.children)
  ) {
    invariant(
      "GlNavItemAddon",
      "must not be interactive or contain links, buttons, or other interactive controls.",
    );
  }
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
  if(addon) validateAddon(addon);

  return { addon, label: addon ? nodes.slice(0, -1) : nodes, leading };
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
  render?: GlLinkProps["render"];
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
};

function useNavButton(
  component: "GlNavButton" | "GlSubNavButton",
  props: GlNavButtonProps,
  forwardedRef: Ref<HTMLElement>,
) {
  const owner = useContext(ButtonOwnerContext);
  const subNavPanelId = useContext(SubNavPanelIdContext);
  const expectedLevel = component === "GlNavButton" ? "nav" : "subnav";

  if(owner?.level !== expectedLevel) {
    invariant(
      component,
      component === "GlNavButton"
        ? "must be the direct button child of GlNavItem."
        : "must be the direct button child of GlSubNavItem.",
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
  const hasAutomaticChevron = Boolean(owner.hasSubNav && !addon && !isIconOnly);
  const hasEndSlot = Boolean(!isIconOnly && (addon || hasAutomaticChevron));
  const resolvedAriaControls = subNavPanelId
    && (ariaExpanded === true || ariaExpanded === "true")
    ? subNavPanelId
    : ariaControls;
  const classes = navButtonVariants({
    className,
    hasEndSlot,
    hasStartSlot: Boolean(leading),
    iconOnly: isIconOnly,
    indicatorPosition: owner.indicatorPosition,
    level: owner.level,
    selected: owner.selected,
  });

  if(isIconOnly && !leading) {
    invariant(component, "isIconOnly requires a leading GlIcon or GlAvatar.");
  }
  if(isIconOnly && !ariaLabel) invariant(component, "isIconOnly requires aria-label.");

  const handleKeyDown: KeyboardEventHandler<HTMLElement> = (event) => {
    onKeyDown?.(event);
    if(!event.defaultPrevented && event.key === "Escape") onEscape?.(event);
  };
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

  if(Boolean(href) || render !== undefined) {
    return (
      <GlLink
        {...elementProps}
        ref={forwardedRef as Ref<HTMLAnchorElement>}
        aria-controls={resolvedAriaControls}
        aria-current={ariaCurrent ?? (owner.selected ? "page" : undefined)}
        aria-expanded={ariaExpanded}
        aria-label={ariaLabel}
        className={classes}
        disabled={owner.disabled}
        download={download}
        href={href || undefined}
        hrefLang={hrefLang}
        isUnsafeLink={isUnsafeLink}
        media={media}
        onClick={onClick as React.MouseEventHandler<HTMLAnchorElement>}
        onKeyDown={handleKeyDown as KeyboardEventHandler<HTMLAnchorElement>}
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
  }

  return (
    <BaseButton
      {...elementProps as unknown as BaseButton.Props}
      ref={forwardedRef}
      aria-controls={resolvedAriaControls}
      aria-expanded={ariaExpanded}
      aria-label={ariaLabel}
      className={classes}
      disabled={owner.disabled}
      nativeButton
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onPointerLeave={onPointerLeave}
      onPointerOver={onPointerOver}
      type={type}>
      {content}
    </BaseButton>
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
        className={navSlotVariants({ className })}
        data-testid="nav-item-end">
        {children}
      </span>
    );
  },
);

function requireSingleButton(
  children: ReactNode,
  component: "GlNavItem" | "GlSubNavItem",
) {
  const nodes = flattenChildren(children);
  const ButtonComponent = component === "GlNavItem" ? GlNavButton : GlSubNavButton;
  const buttons = nodes.filter((node) => hasElementType(node, ButtonComponent));

  if(buttons.length !== 1) {
    invariant(
      component,
      `requires exactly one ${component === "GlNavItem" ? "GlNavButton" : "GlSubNavButton"}.`,
    );
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
  if(!useContext(NavContext)) invariant("GlNavItem", "must be a direct child of GlNav.");

  const { button, nodes } = requireSingleButton(children, "GlNavItem");
  const subNavs = nodes.filter((node) => hasElementType(node, GlSubNav));
  const unexpected = nodes.filter(
    (node) => !hasElementType(node, GlNavButton) && !hasElementType(node, GlSubNav),
  );

  if(unexpected.length > 0) {
    invariant("GlNavItem", "only accepts GlNavButton and an optional GlSubNav.");
  }
  if(subNavs.length > 1) invariant("GlNavItem", "accepts at most one GlSubNav.");
  if(nodes[0] !== button) invariant("GlNavItem", "GlNavButton must precede GlSubNav.");

  const subNav = subNavs[0] as ReactElement<GlSubNavProps> | undefined;
  const owner: ButtonOwner = {
    disabled,
    hasSubNav: Boolean(subNav),
    indicatorPosition,
    level: "nav",
    selected,
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

const GlNav = forwardRef<HTMLElement, GlNavProps>(function GlNav({
  children,
  className,
  ...elementProps
}, forwardedRef) {
  const nodes = flattenChildren(children);
  if(nodes.some((node) => !hasElementType(node, GlNavItem))) {
    invariant("GlNav", "only accepts GlNavItem children.");
  }

  return (
    <NavContext.Provider value>
      <nav {...elementProps} ref={forwardedRef} className={navVariants({ className })}>
        <ul className={navListVariants()}>{children}</ul>
      </nav>
    </NavContext.Provider>
  );
});

export default GlNav;
