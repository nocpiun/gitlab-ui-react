/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/drawer/drawer.vue
 *
 * Adaptations:
 * - Vue's slots map to strict compound React parts.
 * - Base UI Dialog supplies portal, dismissal, focus trapping, and dialog semantics.
 * - The visual props live on GlDrawerContent and sticky behavior lives on GlDrawerHeader.
 * - The close event maps to onOpenChange(false), while opened maps to onOpened.
 */

import {
  Children,
  Fragment,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { cva } from "class-variance-authority";
import {
  resolveTriggerContent,
  resolveTriggerRender,
  type GlTriggerAsChildProps,
  type GlTriggerDefaultProps,
} from "../../internal/trigger/trigger-composition";
import { useMergedRefs } from "../../internal/utils/merge-refs";
import GlButton from "../button/button";

export type GlDrawerVariant = "default" | "sidebar";

export type GlDrawerProps = {
  /** Drawer parts and supporting content. Multiple triggers may open the same drawer. */
  children?: ReactNode;
  /** Whether the drawer is initially open when uncontrolled. */
  defaultOpen?: boolean;
  /** Called after the opening transition finishes. */
  onOpened?: () => void;
  /** Called when interaction requests an open-state change. */
  onOpenChange?: (open: boolean) => void;
  /** Controlled open state. */
  open?: boolean;
};

type DrawerTriggerBaseProps = Omit<
  BaseDialog.Trigger.Props,
  "children" | "className" | "disabled" | "nativeButton" | "render" | "style"
>;

type DrawerDefaultTriggerProps = GlTriggerDefaultProps & {
  nativeButton?: never;
};

type DrawerAsChildTriggerProps = GlTriggerAsChildProps & {
  /** Set to false when the child does not ultimately render a native button. */
  nativeButton?: BaseDialog.Trigger.Props["nativeButton"];
};

export type GlDrawerTriggerProps = DrawerTriggerBaseProps & (
  DrawerDefaultTriggerProps | DrawerAsChildTriggerProps
);

type PopupProps = Omit<
  BaseDialog.Popup.Props,
  "children" | "className" | "render" | "role" | "style"
>;

export type GlDrawerContentProps = PopupProps & {
  /** Exactly one header and an optional footer; all other nodes become drawer body content. */
  children?: ReactNode;
  /** Extra class applied to the drawer surface. */
  className?: string;
  /** Portal container. Defaults to document.body. */
  container?: BaseDialog.Portal.Props["container"];
  /** Height of a fixed page header above the drawer, for example `64px`. */
  headerHeight?: string;
  style?: CSSProperties;
  /** Visual treatment of the drawer. */
  variant?: GlDrawerVariant;
  /** Drawer stacking level. */
  zIndex?: number;
};

export type GlDrawerHeaderProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  /** GlDrawerTitle and GlDrawerActions compound parts. */
  children?: ReactNode;
  /** Accessible label for the automatic close button. */
  closeButtonLabel?: string;
  /** Keeps the header visible while the drawer body scrolls. */
  sticky?: boolean;
};

export type GlDrawerTitleProps = Omit<
  BaseDialog.Title.Props,
  "className" | "render"
> & {
  className?: string;
};

export type GlDrawerActionsProps = HTMLAttributes<HTMLDivElement>;
export type GlDrawerFooterProps = HTMLAttributes<HTMLDivElement>;

type DrawerContentContextValue = {
  directChild: boolean;
  zIndex: number;
};

type ResolvedDrawerContent = {
  body: ReactNode[];
  footer: ReactElement<GlDrawerFooterProps, typeof GlDrawerFooter> | null;
  header: ReactElement<GlDrawerHeaderProps, typeof GlDrawerHeader>;
};

type PendingDrawerContent = Omit<ResolvedDrawerContent, "header"> & {
  header: ResolvedDrawerContent["header"] | null;
};

type ResolvedDrawerHeader = {
  actions: ReactElement<GlDrawerActionsProps, typeof GlDrawerActions> | null;
  title: ReactElement<GlDrawerTitleProps, typeof GlDrawerTitle> | null;
};

const MAX_Z_INDEX = 10;
const DrawerRootContext = createContext(false);
const DrawerContentContext = createContext<DrawerContentContextValue | null>(null);
const DrawerHeaderContext = createContext(false);

const drawerVariants = cva("gl-drawer", {
  variants: {
    variant: {
      default: "gl-drawer-default",
      sidebar: "gl-drawer-sidebar",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});
const drawerHeaderVariants = cva("gl-drawer-header", {
  variants: {
    sticky: {
      false: null,
      true: "gl-drawer-header-sticky",
    },
  },
  defaultVariants: {
    sticky: false,
  },
});
const drawerTitleVariants = cva("gl-drawer-heading");
const drawerActionsVariants = cva("gl-drawer-actions");
const drawerBodyVariants = cva("gl-drawer-body", {
  variants: {
    hasFooter: {
      false: "gl-drawer-body-scrim",
      true: null,
    },
    stickyHeader: {
      false: null,
      true: "gl-drawer-body-shrink",
    },
  },
  defaultVariants: {
    hasFooter: false,
    stickyHeader: false,
  },
});
const drawerFooterVariants = cva([
  "gl-drawer-footer",
  "gl-drawer-footer-sticky",
  "gl-drawer-body-scrim-on-footer",
]);

function useDrawerRootContext(componentName: string) {
  const insideRoot = useContext(DrawerRootContext);
  if(!insideRoot) throw new Error(`${componentName} must be used inside GlDrawer.`);
}

function useDirectDrawerContentContext(componentName: string): DrawerContentContextValue {
  const context = useContext(DrawerContentContext);
  if(!context?.directChild) {
    throw new Error(
      `${componentName} must be used as a direct child of GlDrawerContent. `
      + "Fragments are supported.",
    );
  }
  return context;
}

function useDrawerHeaderContext(componentName: string) {
  const insideHeader = useContext(DrawerHeaderContext);
  if(!insideHeader) {
    throw new Error(
      `${componentName} must be used as a direct child of GlDrawerHeader. `
      + "Fragments are supported.",
    );
  }
}

export function resolveDrawerContent(children: ReactNode): ResolvedDrawerContent {
  const result: PendingDrawerContent = { body: [], footer: null, header: null };

  const visit = (child: ReactNode) => {
    if(child === null || child === undefined || typeof child === "boolean") return;

    if(isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      Children.forEach(child.props.children, visit);
      return;
    }

    if(isValidElement<GlDrawerHeaderProps>(child) && child.type === GlDrawerHeader) {
      if(result.header) {
        throw new Error("GlDrawerContent accepts at most one GlDrawerHeader child.");
      }
      result.header = child as ResolvedDrawerContent["header"];
      return;
    }

    if(isValidElement<GlDrawerFooterProps>(child) && child.type === GlDrawerFooter) {
      if(result.footer) {
        throw new Error("GlDrawerContent accepts at most one GlDrawerFooter child.");
      }
      result.footer = child as ResolvedDrawerContent["footer"];
      return;
    }

    if(isValidElement(child) && (
      child.type === GlDrawerTrigger
      || child.type === GlDrawerContent
      || child.type === GlDrawerTitle
      || child.type === GlDrawerActions
    )) {
      throw new Error(
        "GlDrawerContent accepts GlDrawerHeader and GlDrawerFooter as named direct children; "
        + "GlDrawerTitle and GlDrawerActions belong directly inside GlDrawerHeader.",
      );
    }

    result.body.push(child);
  };

  Children.forEach(children, visit);
  if(!result.header) {
    throw new Error("GlDrawerContent requires exactly one GlDrawerHeader child.");
  }

  return { ...result, header: result.header };
}

export function resolveDrawerHeader(children: ReactNode): ResolvedDrawerHeader {
  const result: ResolvedDrawerHeader = { actions: null, title: null };

  const visit = (child: ReactNode) => {
    if(child === null || child === undefined || typeof child === "boolean") return;

    if(isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      Children.forEach(child.props.children, visit);
      return;
    }

    if(isValidElement<GlDrawerTitleProps>(child) && child.type === GlDrawerTitle) {
      if(result.title) {
        throw new Error("GlDrawerHeader accepts at most one GlDrawerTitle child.");
      }
      result.title = child as ResolvedDrawerHeader["title"];
      return;
    }

    if(isValidElement<GlDrawerActionsProps>(child) && child.type === GlDrawerActions) {
      if(result.actions) {
        throw new Error("GlDrawerHeader accepts at most one GlDrawerActions child.");
      }
      result.actions = child as ResolvedDrawerHeader["actions"];
      return;
    }

    throw new Error(
      "GlDrawerHeader only accepts GlDrawerTitle and GlDrawerActions as direct children. "
      + "Arrays, Fragments, and conditional children are supported.",
    );
  };

  Children.forEach(children, visit);
  return result;
}

export function getDrawerPopupStyle(
  headerHeight: string,
  zIndex: number,
  style?: CSSProperties,
): CSSProperties {
  return {
    ...style,
    maxHeight: headerHeight ? `calc(100vh - ${headerHeight})` : undefined,
    top: headerHeight || 0,
    zIndex,
  };
}

export const GlDrawerTitle = forwardRef<HTMLHeadingElement, GlDrawerTitleProps>(
  function GlDrawerTitle({ className, ...titleProps }, forwardedRef) {
    useDrawerHeaderContext("GlDrawerTitle");

    return (
      <BaseDialog.Title
        {...titleProps}
        ref={forwardedRef}
        className={drawerTitleVariants({ className })} />
    );
  },
);

export const GlDrawerActions = forwardRef<HTMLDivElement, GlDrawerActionsProps>(
  function GlDrawerActions({ className, ...elementProps }, forwardedRef) {
    useDrawerHeaderContext("GlDrawerActions");

    return (
      <div
        {...elementProps}
        ref={forwardedRef}
        className={drawerActionsVariants({ className })} />
    );
  },
);

export const GlDrawerHeader = forwardRef<HTMLDivElement, GlDrawerHeaderProps>(
  function GlDrawerHeader({
    children,
    className,
    closeButtonLabel = "Close drawer",
    sticky = false,
    style,
    ...elementProps
  }, forwardedRef) {
    useDirectDrawerContentContext("GlDrawerHeader");
    const resolved = resolveDrawerHeader(children);
    const headerStyle = sticky ? { ...style, zIndex: MAX_Z_INDEX } : style;

    return (
      <div
        {...elementProps}
        ref={forwardedRef}
        className={drawerHeaderVariants({ className, sticky })}
        style={headerStyle}>
        <div className="gl-drawer-title">
          <DrawerHeaderContext.Provider value>
            {resolved.title}
          </DrawerHeaderContext.Provider>
          <BaseDialog.Close
            aria-label={closeButtonLabel}
            className="gl-drawer-close-button"
            render={<GlButton category="tertiary" icon="close" size="small" />} />
        </div>
        <DrawerHeaderContext.Provider value>
          {resolved.actions}
        </DrawerHeaderContext.Provider>
      </div>
    );
  },
);

export const GlDrawerFooter = forwardRef<HTMLDivElement, GlDrawerFooterProps>(
  function GlDrawerFooter({ className, style, ...elementProps }, forwardedRef) {
    const context = useDirectDrawerContentContext("GlDrawerFooter");

    return (
      <div
        {...elementProps}
        ref={forwardedRef}
        className={drawerFooterVariants({ className })}
        style={{ ...style, zIndex: context.zIndex }} />
    );
  },
);

export const GlDrawerTrigger = forwardRef<HTMLElement, GlDrawerTriggerProps>(
  function GlDrawerTrigger({
    asChild = false,
    block = false,
    category = "primary",
    children,
    className,
    disabled = false,
    icon,
    loading = false,
    nativeButton,
    size = "medium",
    style,
    variant = "default",
    ...triggerProps
  }, forwardedRef) {
    useDrawerRootContext("GlDrawerTrigger");
    const effectiveDisabled = disabled || loading;
    const triggerRender = resolveTriggerRender(
      "GlDrawerTrigger",
      asChild,
      children,
      { block, category, disabled, icon, loading, size, variant },
    );
    const mergedRef = useMergedRefs(forwardedRef);

    return (
      <BaseDialog.Trigger
        {...triggerProps}
        ref={mergedRef}
        className={className}
        disabled={effectiveDisabled}
        nativeButton={asChild ? nativeButton : true}
        render={triggerRender}
        style={style}>
        {resolveTriggerContent(asChild, children)}
      </BaseDialog.Trigger>
    );
  },
);

export const GlDrawerContent = forwardRef<HTMLElement, GlDrawerContentProps>(
  function GlDrawerContent({
    children,
    className,
    container,
    headerHeight = "",
    style,
    variant = "default",
    zIndex = MAX_Z_INDEX,
    ...popupProps
  }, forwardedRef) {
    useDrawerRootContext("GlDrawerContent");
    const resolved = resolveDrawerContent(children);
    const stickyHeader = resolved.header.props.sticky ?? false;
    const popupStyle = getDrawerPopupStyle(headerHeight, zIndex, style);

    return (
      <BaseDialog.Portal container={container}>
        <BaseDialog.Popup
          {...popupProps}
          aria-modal="true"
          className={drawerVariants({ className, variant })}
          render={<aside ref={forwardedRef} />}
          role="dialog"
          style={popupStyle}>
          <DrawerContentContext.Provider value={{ directChild: true, zIndex }}>
            {resolved.header}
          </DrawerContentContext.Provider>
          <DrawerContentContext.Provider value={{ directChild: false, zIndex }}>
            <div className={drawerBodyVariants({
              hasFooter: resolved.footer !== null,
              stickyHeader,
            })}>
              {resolved.body}
            </div>
          </DrawerContentContext.Provider>
          <DrawerContentContext.Provider value={{ directChild: true, zIndex }}>
            {resolved.footer}
          </DrawerContentContext.Provider>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    );
  },
);

function validateSingleDrawerContent(children: ReactNode) {
  let hasContent = false;

  const visit = (nodes: ReactNode) => {
    Children.forEach(nodes, (child) => {
      if(child === null || child === undefined || typeof child === "boolean") return;

      if(isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
        visit(child.props.children);
        return;
      }

      if(!isValidElement(child) || child.type !== GlDrawerContent) return;
      if(hasContent) throw new Error("GlDrawer accepts at most one GlDrawerContent child.");
      hasContent = true;
    });
  };

  visit(children);
}

export default function GlDrawer({
  children,
  defaultOpen = false,
  onOpened,
  onOpenChange,
  open,
}: GlDrawerProps) {
  validateSingleDrawerContent(children);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen);
  };
  const handleOpenChangeComplete = (nextOpen: boolean) => {
    if(nextOpen) onOpened?.();
  };

  return (
    <BaseDialog.Root
      defaultOpen={defaultOpen}
      disablePointerDismissal
      modal
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
      open={open}>
      <DrawerRootContext.Provider value>
        {children}
      </DrawerRootContext.Provider>
    </BaseDialog.Root>
  );
}
