/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/modal/modal.vue
 *
 * Adaptations:
 * - Vue's model, slots, and action objects map to Base UI state and compound React parts.
 * - The BootstrapVue modal shell maps to Base UI's portal, backdrop, viewport, and popup.
 * - The header close control remains automatic; GlModalClose is a footer action button.
 */

import type { GlOverlayOpenChangeDetails } from "../../internal/overlay/overlay-types.js";
import {
  Children,
  Fragment,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useId,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { cva } from "class-variance-authority";
import { useMergedRefs } from "../../internal/utils/merge-refs.js";
import {
  resolveTriggerContent,
  resolveTriggerRender,
  type GlTriggerAsChildProps,
  type GlTriggerDefaultProps,
} from "../../internal/trigger/trigger-composition.js";
import { mapOverlayOpenChangeDetails } from "../../internal/overlay/overlay-utils.js";
import GlButton, { type GlButtonProps } from "../button/button.js";

export type GlModalSize = "sm" | "md" | "lg";

export type GlModalProps = {
  /** Modal parts and supporting content. Multiple triggers may open the same modal. */
  children?: ReactNode;
  /** Whether the modal is initially open when uncontrolled. */
  defaultOpen?: boolean;
  /** Called when interaction requests an open-state change. */
  onOpenChange?: (open: boolean, details: GlOverlayOpenChangeDetails) => void;
  /** Called after the opening or closing transition finishes. */
  onOpenChangeComplete?: (open: boolean) => void;
  /** Controlled open state. */
  open?: boolean;
};

type ModalTriggerBaseProps = Omit<
  BaseDialog.Trigger.Props,
  "children" | "className" | "disabled" | "nativeButton" | "render" | "style"
>;

type ModalDefaultTriggerProps = GlTriggerDefaultProps & {
  nativeButton?: never;
};

type ModalAsChildTriggerProps = GlTriggerAsChildProps & {
  /** Set to false when the child does not ultimately render a native button. */
  nativeButton?: BaseDialog.Trigger.Props["nativeButton"];
};

export type GlModalTriggerProps = ModalTriggerBaseProps & (
  ModalDefaultTriggerProps | ModalAsChildTriggerProps
);

type PopupProps = Omit<
  BaseDialog.Popup.Props,
  "aria-modal" | "children" | "className" | "render" | "role" | "style"
>;

export type GlModalContentProps = PopupProps & {
  /** Exactly one header and an optional footer; all other nodes become modal body content. */
  children?: ReactNode;
  /** Extra class applied to the dialog surface. */
  className?: string;
  /** Portal container. Defaults to document.body. */
  container?: BaseDialog.Portal.Props["container"];
  /** Whether only the modal body scrolls when content exceeds the available height. */
  scrollable?: boolean;
  /** Maximum width of the modal at supported viewports. */
  size?: GlModalSize;
  style?: CSSProperties;
};

export type GlModalHeaderProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  /** An optional title and custom header content. */
  children?: ReactNode;
  /** Accessible label for the automatic close icon button. */
  closeButtonLabel?: string;
};

export type GlModalTitleProps = Omit<
  BaseDialog.Title.Props,
  "className" | "render"
> & {
  className?: string;
};

export type GlModalFooterProps = HTMLAttributes<HTMLDivElement>;

type ModalCloseUnsupportedButtonProps =
  | "href"
  | "isUnsafeLink"
  | "label"
  | "nativeButton"
  | "rel"
  | "render"
  | "target";

export type GlModalCloseProps = Omit<GlButtonProps, ModalCloseUnsupportedButtonProps>;

type ResolvedModalContent = {
  body: ReactNode[];
  footer: ReactElement<GlModalFooterProps, typeof GlModalFooter> | null;
  header: ReactElement<GlModalHeaderProps, typeof GlModalHeader>;
};

type PendingModalContent = Omit<ResolvedModalContent, "header"> & {
  header: ResolvedModalContent["header"] | null;
};

type ResolvedModalHeader = {
  children: ReactNode[];
  title: ReactElement<GlModalTitleProps, typeof GlModalTitle> | null;
};

type ResolvedModalFooter = {
  children: ReactNode[];
};

type ModalAccessibleNameProps = Pick<
  BaseDialog.Popup.Props,
  "aria-label" | "aria-labelledby"
>;

type AccessibleNameElementProps = {
  "aria-hidden"?: boolean | "false" | "true";
  "aria-label"?: string;
  "aria-labelledby"?: string;
  children?: ReactNode;
  hidden?: boolean;
};

const ModalRootContext = createContext(false);
const ModalContentContext = createContext(false);
const ModalHeaderContext = createContext(false);
const ModalFooterContext = createContext(false);

const modalDialogVariants = cva("gl-modal-dialog", {
  variants: {
    scrollable: {
      false: null,
      true: "gl-modal-dialog-scrollable",
    },
    size: {
      lg: "gl-modal-lg",
      md: "gl-modal-md",
      sm: "gl-modal-sm",
    },
  },
  defaultVariants: {
    scrollable: false,
    size: "md",
  },
});
const modalContentVariants = cva("gl-modal-content");
const modalHeaderVariants = cva("gl-modal-header");
const modalTitleVariants = cva("gl-modal-title");
const modalBodyVariants = cva("gl-modal-body");
const modalFooterVariants = cva("gl-modal-footer");
const modalCloseVariants = cva("gl-modal-close");

const FOCUSABLE_SELECTOR = "input, textarea, a, button, select";

function useModalRootContext(componentName: string) {
  const insideRoot = useContext(ModalRootContext);
  if(!insideRoot) throw new Error(`${componentName} must be used inside GlModal.`);
}

function useDirectModalContentContext(componentName: string) {
  const directChild = useContext(ModalContentContext);
  if(!directChild) {
    throw new Error(
      `${componentName} must be used as a direct child of GlModalContent. `
      + "Fragments are supported.",
    );
  }
}

function useDirectModalHeaderContext(componentName: string) {
  const directChild = useContext(ModalHeaderContext);
  if(!directChild) {
    throw new Error(
      `${componentName} must be used as a direct child of GlModalHeader. `
      + "Fragments are supported.",
    );
  }
}

function useDirectModalFooterContext(componentName: string) {
  const directChild = useContext(ModalFooterContext);
  if(!directChild) {
    throw new Error(
      `${componentName} must be used as a direct child of GlModalFooter. `
      + "Fragments are supported.",
    );
  }
}

function isNamedModalPart(child: ReactElement) {
  return child.type === GlModalTrigger
    || child.type === GlModalContent
    || child.type === GlModalHeader
    || child.type === GlModalTitle
    || child.type === GlModalFooter
    || child.type === GlModalClose;
}

export function resolveModalContent(children: ReactNode): ResolvedModalContent {
  const result: PendingModalContent = { body: [], footer: null, header: null };

  const visit = (child: ReactNode) => {
    if(child === null || child === undefined || typeof child === "boolean") return;

    if(isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      Children.forEach(child.props.children, visit);
      return;
    }

    if(isValidElement<GlModalHeaderProps>(child) && child.type === GlModalHeader) {
      if(result.header) {
        throw new Error("GlModalContent accepts exactly one GlModalHeader child.");
      }
      result.header = child as ResolvedModalContent["header"];
      return;
    }

    if(isValidElement<GlModalFooterProps>(child) && child.type === GlModalFooter) {
      if(result.footer) {
        throw new Error("GlModalContent accepts at most one GlModalFooter child.");
      }
      result.footer = child as ResolvedModalContent["footer"];
      return;
    }

    if(isValidElement(child) && isNamedModalPart(child)) {
      throw new Error(
        "GlModalContent accepts GlModalHeader and GlModalFooter as named direct children; "
        + "GlModalTitle belongs directly inside GlModalHeader and GlModalClose belongs "
        + "directly inside GlModalFooter.",
      );
    }

    result.body.push(child);
  };

  Children.forEach(children, visit);
  if(!result.header) {
    throw new Error("GlModalContent requires exactly one GlModalHeader child.");
  }

  return { ...result, header: result.header };
}

export function resolveModalHeader(children: ReactNode): ResolvedModalHeader {
  const result: ResolvedModalHeader = { children: [], title: null };

  const visit = (child: ReactNode) => {
    if(child === null || child === undefined || typeof child === "boolean") return;

    if(isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      Children.forEach(child.props.children, visit);
      return;
    }

    if(isValidElement<GlModalTitleProps>(child) && child.type === GlModalTitle) {
      if(result.title) {
        throw new Error("GlModalHeader accepts at most one GlModalTitle child.");
      }
      result.title = child as ResolvedModalHeader["title"];
      result.children.push(child);
      return;
    }

    if(isValidElement(child) && isNamedModalPart(child)) {
      throw new Error(
        "GlModalHeader accepts at most one GlModalTitle as its only named direct child. "
        + "The header close button is rendered automatically.",
      );
    }

    result.children.push(child);
  };

  Children.forEach(children, visit);
  return result;
}

export function resolveModalFooter(children: ReactNode): ResolvedModalFooter {
  const result: ResolvedModalFooter = { children: [] };

  const visit = (child: ReactNode) => {
    if(child === null || child === undefined || typeof child === "boolean") return;

    if(isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      Children.forEach(child.props.children, visit);
      return;
    }

    if(isValidElement(child) && isNamedModalPart(child) && child.type !== GlModalClose) {
      throw new Error(
        "GlModalFooter accepts GlModalClose and ordinary action content; other Modal "
        + "compound parts are not allowed.",
      );
    }

    result.children.push(child);
  };

  Children.forEach(children, visit);
  return result;
}

export function getModalDialogClassName(size: GlModalSize, scrollable: boolean) {
  return modalDialogVariants({ scrollable, size });
}

function hasAccessibleNameContent(node: ReactNode): boolean {
  return Children.toArray(node).some((child) => {
    if(typeof child === "string") return Boolean(child.trim());
    if(typeof child === "number" || typeof child === "bigint") return true;
    if(!isValidElement<AccessibleNameElementProps>(child)) return false;

    const props = child.props;
    if(
      props.hidden
      || props["aria-hidden"] === true
      || props["aria-hidden"] === "true"
    ) return false;
    if(props["aria-label"]?.trim() || props["aria-labelledby"]?.trim()) return true;

    return hasAccessibleNameContent(props.children);
  });
}

export function getModalAccessibleNameProps(
  hasTitleName: boolean,
  ariaLabel: string | undefined,
  ariaLabelledBy: string | undefined,
): ModalAccessibleNameProps {
  const hasAriaLabel = Boolean(ariaLabel?.trim());
  const hasAriaLabelledBy = Boolean(ariaLabelledBy?.trim());

  if(!hasTitleName && !hasAriaLabel && !hasAriaLabelledBy) {
    throw new Error(
      "GlModalContent requires a non-empty GlModalTitle, a non-empty aria-label, "
      + "or a non-empty aria-labelledby.",
    );
  }

  if(hasAriaLabel) {
    return {
      "aria-label": ariaLabel,
      "aria-labelledby": undefined,
    };
  }

  if(hasAriaLabelledBy) return { "aria-labelledby": ariaLabelledBy };

  return {};
}

function isFocusableElement(element: HTMLElement) {
  if(element.getAttribute("type") === "hidden") return false;
  if("disabled" in element && Boolean(element.disabled)) return false;
  if(element.tagName === "A" && !element.hasAttribute("href")) return false;
  return true;
}

function findFirstFocusableElement(container: Element | null) {
  if(!container) return null;

  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)]
    .find(isFocusableElement) ?? null;
}

function findDefaultInitialFocus(popup: HTMLDivElement | null) {
  if(!popup) return null;

  return findFirstFocusableElement(popup.querySelector(".gl-modal-body"))
    ?? findFirstFocusableElement(popup.querySelector(".gl-modal-footer"))
    ?? popup.querySelector<HTMLElement>(".gl-modal-header-close")
    ?? popup;
}

export const GlModalTitle = forwardRef<HTMLHeadingElement, GlModalTitleProps>(
  function GlModalTitle({ className, ...titleProps }, forwardedRef) {
    useDirectModalHeaderContext("GlModalTitle");

    return (
      <BaseDialog.Title
        {...titleProps}
        ref={forwardedRef}
        className={modalTitleVariants({ className })} />
    );
  },
);

export function getModalProviderKey(child: ReactNode, index: number) {
  if(isValidElement(child) && child.key !== null) {
    return `child:${String(child.key)}`;
  }

  return `index:${index}`;
}

export const GlModalHeader = forwardRef<HTMLDivElement, GlModalHeaderProps>(
  function GlModalHeader({
    children,
    className,
    closeButtonLabel = "Close",
    ...elementProps
  }, forwardedRef) {
    useDirectModalContentContext("GlModalHeader");
    const resolved = resolveModalHeader(children);

    return (
      <div
        {...elementProps}
        ref={forwardedRef}
        className={modalHeaderVariants({ className })}>
        {resolved.children.map((child, index) => (
          <ModalHeaderContext.Provider
            key={getModalProviderKey(child, index)}
            value={isValidElement(child) && child.type === GlModalTitle}>
            {child}
          </ModalHeaderContext.Provider>
        ))}
        <BaseDialog.Close
          aria-label={closeButtonLabel}
          className="gl-modal-header-close"
          render={<GlButton category="tertiary" icon="close" size="small" />} />
      </div>
    );
  },
);

export const GlModalClose = forwardRef<HTMLButtonElement, GlModalCloseProps>(
  function GlModalClose({ className, ...buttonProps }, forwardedRef) {
    useDirectModalFooterContext("GlModalClose");

    return (
      <BaseDialog.Close
        ref={forwardedRef}
        className={modalCloseVariants({ className })}
        render={<GlButton {...buttonProps} />} />
    );
  },
);

export const GlModalFooter = forwardRef<HTMLDivElement, GlModalFooterProps>(
  function GlModalFooter({ children, className, ...elementProps }, forwardedRef) {
    useDirectModalContentContext("GlModalFooter");
    const resolved = resolveModalFooter(children);

    return (
      <div
        {...elementProps}
        ref={forwardedRef}
        className={modalFooterVariants({ className })}>
        {resolved.children.map((child, index) => (
          <ModalFooterContext.Provider
            key={getModalProviderKey(child, index)}
            value={isValidElement(child) && child.type === GlModalClose}>
            {child}
          </ModalFooterContext.Provider>
        ))}
      </div>
    );
  },
);

export const GlModalTrigger = forwardRef<HTMLElement, GlModalTriggerProps>(
  function GlModalTrigger({
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
    useModalRootContext("GlModalTrigger");
    const effectiveDisabled = disabled || loading;
    const triggerRender = resolveTriggerRender(
      "GlModalTrigger",
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

export const GlModalContent = forwardRef<HTMLDivElement, GlModalContentProps>(
  function GlModalContent({
    "aria-describedby": ariaDescribedBy,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    children,
    className,
    container,
    initialFocus,
    scrollable = false,
    size = "md",
    style,
    ...popupProps
  }, forwardedRef) {
    useModalRootContext("GlModalContent");
    const bodyId = useId();
    const popupRef = useRef<HTMLDivElement>(null);
    const mergedPopupRef = useMergedRefs(popupRef, forwardedRef);
    const resolved = resolveModalContent(children);
    const resolvedHeader = resolveModalHeader(resolved.header.props.children);
    const accessibleNameProps = getModalAccessibleNameProps(
      hasAccessibleNameContent(resolvedHeader.title),
      ariaLabel,
      ariaLabelledBy,
    );
    const resolvedInitialFocus = initialFocus === undefined
      ? () => findDefaultInitialFocus(popupRef.current)
      : initialFocus;

    return (
      <BaseDialog.Portal container={container}>
        <BaseDialog.Backdrop className="gl-modal-backdrop" />
        <BaseDialog.Viewport className="gl-modal gl-modal-viewport">
          <div className={getModalDialogClassName(size, scrollable)}>
            <BaseDialog.Popup
              {...popupProps}
              {...accessibleNameProps}
              ref={mergedPopupRef}
              aria-describedby={ariaDescribedBy ?? bodyId}
              aria-modal="true"
              className={modalContentVariants({ className })}
              initialFocus={resolvedInitialFocus}
              role="dialog"
              style={style}>
              <ModalContentContext.Provider value>
                {resolved.header}
              </ModalContentContext.Provider>
              <ModalContentContext.Provider value={false}>
                <div id={bodyId} className={modalBodyVariants()}>{resolved.body}</div>
              </ModalContentContext.Provider>
              <ModalContentContext.Provider value>
                {resolved.footer}
              </ModalContentContext.Provider>
            </BaseDialog.Popup>
          </div>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    );
  },
);

function validateSingleModalContent(children: ReactNode) {
  let hasContent = false;

  const visit = (nodes: ReactNode) => {
    Children.forEach(nodes, (child) => {
      if(child === null || child === undefined || typeof child === "boolean") return;

      if(isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
        visit(child.props.children);
        return;
      }

      if(!isValidElement(child) || child.type !== GlModalContent) return;
      if(hasContent) throw new Error("GlModal accepts at most one GlModalContent child.");
      hasContent = true;
    });
  };

  visit(children);
}

export default function GlModal({
  children,
  defaultOpen = false,
  onOpenChange,
  onOpenChangeComplete,
  open,
}: GlModalProps) {
  validateSingleModalContent(children);

  const handleOpenChange = (
    nextOpen: boolean,
    details: BaseDialog.Root.ChangeEventDetails,
  ) => {
    onOpenChange?.(nextOpen, mapOverlayOpenChangeDetails(details));
  };

  return (
    <BaseDialog.Root
      defaultOpen={defaultOpen}
      modal
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={onOpenChangeComplete}
      open={open}>
      <ModalRootContext.Provider value>
        {children}
      </ModalRootContext.Provider>
    </BaseDialog.Root>
  );
}
