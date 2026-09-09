import {
  Children,
  Fragment,
  createContext,
  createElement,
  isValidElement,
  type ElementType,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

export type ButtonOwner = {
  disabled: boolean;
  flyout?: {
    close(): void;
    open: boolean;
    toggle(): void;
  };
  hasSubNav: boolean;
  indicatorPosition: "bottom" | "left" | "right";
  isToggle?: boolean;
  level: "nav" | "subnav";
  selected: boolean;
  triggerRef?: { current: HTMLElement | null };
};

export type NavProviderContextValue = {
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

export type NavSubNavRenderProps = {
  button: ReactElement;
  disabled: boolean;
  flyoutLabel: string;
  forwardedRef: Ref<HTMLLIElement>;
  item: ReactElement;
  owner: ButtonOwner;
  subNav: ReactElement;
};

export type NavContextValue =
  | {
    kind: "collapsible";
    provider: NavProviderContextValue;
    renderSubNav(props: NavSubNavRenderProps): ReactNode;
  }
  | { kind: "plain" };

export const NavContext = createContext<NavContextValue | null>(null);
export const SubNavContext = createContext(false);
export const SubNavPanelIdContext = createContext<string | undefined>(undefined);
export const ButtonOwnerContext = createContext<ButtonOwner | null>(null);
export const AddonContext = createContext(false);

export const COLLAPSIBLE_NAV_TOGGLE_MARKER = Symbol("GlCollapsibleNavToggle");

type CollapsibleNavToggleComponent = ElementType & {
  [COLLAPSIBLE_NAV_TOGGLE_MARKER]?: true;
};

export function isCollapsibleNavToggleElement(node: ReactNode) {
  return isValidElement(node)
    && Boolean((node.type as CollapsibleNavToggleComponent)[COLLAPSIBLE_NAV_TOGGLE_MARKER]);
}

export function invariant(component: string, message: string): never {
  throw new Error(`[${component}] ${message}`);
}

export function flattenChildren(children: ReactNode, result: ReactNode[] = []): ReactNode[] {
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

export function hasElementType(node: ReactNode, component: React.ElementType) {
  return isValidElement(node) && node.type === component;
}

export function getElementProps(element: ReactElement) {
  return element.props as Record<string, unknown> & { children?: ReactNode };
}

export function withoutChildren(element: ReactElement) {
  const props = { ...getElementProps(element) };
  delete props.children;
  return createElement(element.type as ElementType, props);
}

export function withoutChildrenAndId(element: ReactElement) {
  const props = { ...getElementProps(element) };
  delete props.children;
  delete props.id;
  return createElement(element.type as ElementType, props);
}
