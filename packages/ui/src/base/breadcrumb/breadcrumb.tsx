/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/breadcrumb/breadcrumb.vue
 * packages/gitlab-ui/src/components/base/breadcrumb/breadcrumb_item.vue
 *
 * Adaptations:
 * - Vue's items prop maps to strict GlBreadcrumbItem composition.
 * - Vue Router's `to` prop maps to GlLink's Base UI `render` composition.
 * - The shared ClipboardButton is kept private to this component.
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
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type ReactElement,
} from "react";
import { cva } from "class-variance-authority";
import { useMergedRefs } from "../../internal/utils/merge-refs";
import GlAvatar from "../avatar/avatar";
import GlButton, { type GlButtonSize } from "../button/button";
import GlDisclosureDropdown, {
  GlDisclosureDropdownContent,
  GlDisclosureDropdownItem,
  GlDisclosureDropdownTrigger,
} from "../disclosure-dropdown/disclosure-dropdown";
import {
  GlDisclosureDropdownGroup,
} from "../disclosure-dropdown/disclosure-dropdown-group";
import GlLink, { type GlLinkProps } from "../link/link";
import GlTooltip, {
  GlTooltipContent,
  GlTooltipTrigger,
} from "../tooltip/tooltip";

const RESIZE_DEBOUNCE_MS = 25;
const COPY_FEEDBACK_DURATION_MS = 1000;

export type GlBreadcrumbSize = "sm" | "md";

type GlBreadcrumbItemDestination =
  | {
    /** URL for a standard anchor. */
    href: string;
    render?: never;
  }
  | {
    href?: never;
    /** Base UI composition hook for router links. */
    render: NonNullable<GlLinkProps["render"]>;
  };

export type GlBreadcrumbItemProps = Omit<
  LiHTMLAttributes<HTMLLIElement>,
  "aria-current" | "children"
> & GlBreadcrumbItemDestination & {
  /** Optional decorative avatar displayed before the item text. */
  avatarPath?: string;
  /** Canonical text used by the visible link, overflow menu, and copied path. */
  children: string;
};

type GlBreadcrumbItemElement = ReactElement<
  GlBreadcrumbItemProps,
  typeof GlBreadcrumbItem
>;
type GlBreadcrumbChild =
  | GlBreadcrumbItemElement
  | readonly GlBreadcrumbChild[]
  | boolean
  | null
  | undefined;

export type GlBreadcrumbProps = Omit<
  HTMLAttributes<HTMLElement>,
  "children"
> & {
  /** Collapses leading items into a disclosure menu when space is limited. */
  autoResize?: boolean;
  /** Direct GlBreadcrumbItem children; arrays, Fragments, and conditionals are supported. */
  children?: GlBreadcrumbChild;
  /** Tooltip and accessible label for the copy button. */
  clipboardTooltipText?: string | null;
  /** Overrides the slash-delimited path copied by the clipboard button. */
  pathToCopy?: string | null;
  /** Adds a button that copies the breadcrumb path. */
  showClipboardButton?: boolean;
  /** Screen-reader-only label for the collapsed-items trigger. */
  showMoreLabel?: string;
  /** Visual size shared by items, avatars, the overflow trigger, and copy button. */
  size?: GlBreadcrumbSize;
};

type BreadcrumbItemContextValue = {
  current: boolean;
  index: number;
  onlyVisible: boolean;
  registerElement(index: number, element: HTMLLIElement | null): void;
  size: GlBreadcrumbSize;
};

type BreadcrumbStyle = CSSProperties & {
  "--gl-breadcrumb-truncated-item-max-width"?: string;
};

type ClipboardButtonProps = {
  size: GlButtonSize;
  text: string;
  title: string;
};

type BreadcrumbLayout = {
  collapsedCount: number;
  truncatedItemMaxWidth: number;
};

const BreadcrumbItemContext = createContext<BreadcrumbItemContextValue | null>(null);

const breadcrumbVariants = cva("gl-breadcrumbs");
const breadcrumbListVariants = cva(["gl-breadcrumb-list", "breadcrumb"]);
const breadcrumbItemVariants = cva("gl-breadcrumb-item", {
  variants: {
    onlyVisible: {
      false: null,
      true: "gl-breadcrumb-only-item",
    },
    size: {
      md: "gl-breadcrumb-item-md",
      sm: "gl-breadcrumb-item-sm",
    },
  },
  defaultVariants: {
    onlyVisible: false,
    size: "sm",
  },
});

/** @internal Exported for deterministic unit coverage of DOM measurements. */
export function calculateBreadcrumbLayout(
  itemWidths: readonly number[],
  containerWidth: number,
  dropdownWidth: number,
  clipboardWidth: number,
): BreadcrumbLayout {
  const totalBreadcrumbsWidth = itemWidths.reduce((total, width) => total + width, 0)
    + clipboardWidth;
  let collapsedCount = 0;

  if(totalBreadcrumbsWidth > containerWidth) {
    let widthNeeded = totalBreadcrumbsWidth;
    for(let index = 0; index < itemWidths.length - 1; index += 1) {
      collapsedCount += 1;
      widthNeeded -= itemWidths[index] ?? 0;
      if(widthNeeded + dropdownWidth < containerWidth) break;
    }
  }

  return {
    collapsedCount,
    truncatedItemMaxWidth: Math.max(
      0,
      containerWidth - (dropdownWidth + clipboardWidth),
    ),
  };
}

/** @internal Exported for unit coverage of the composite text contract. */
export function resolveBreadcrumbClipboardText(
  itemTexts: readonly string[],
  pathToCopy?: string | null,
) {
  return pathToCopy || itemTexts.join("/");
}

function collectBreadcrumbItems(children: GlBreadcrumbChild): GlBreadcrumbItemElement[] {
  const items: GlBreadcrumbItemElement[] = [];

  const visit = (nodes: GlBreadcrumbChild) => {
    Children.forEach(nodes, (child) => {
      if(child === null || child === undefined || typeof child === "boolean") return;

      if(isValidElement<{ children?: GlBreadcrumbChild }>(child) && child.type === Fragment) {
        visit(child.props.children);
        return;
      }

      if(isValidElement<GlBreadcrumbItemProps>(child) && child.type === GlBreadcrumbItem) {
        items.push(child as GlBreadcrumbItemElement);
        return;
      }

      throw new Error(
        "GlBreadcrumb only accepts GlBreadcrumbItem as direct children. "
        + "Arrays, Fragments, and conditional children are supported.",
      );
    });
  };

  visit(children);
  return items;
}

const BreadcrumbClipboardButton = forwardRef<HTMLElement, ClipboardButtonProps>(
  function BreadcrumbClipboardButton({ size, text, title }, forwardedRef) {
    const [localTitle, setLocalTitle] = useState(title);
    const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearResetTimer = useCallback(() => {
      if(resetTimerRef.current === null) return;
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }, []);

    useEffect(() => {
      clearResetTimer();
      setLocalTitle(title);
    }, [clearResetTimer, title]);

    useEffect(() => clearResetTimer, [clearResetTimer]);

    const showFeedback = (feedback: string) => {
      clearResetTimer();
      setLocalTitle(feedback);
      resetTimerRef.current = setTimeout(() => {
        setLocalTitle(title);
        resetTimerRef.current = null;
      }, COPY_FEEDBACK_DURATION_MS);
    };

    const handleClick = async () => {
      try {
        await navigator.clipboard.writeText(text);
        showFeedback("Copied");
      } catch {
        showFeedback("Copy failed");
      }
    };

    return (
      <GlTooltip>
        <GlTooltipTrigger asChild>
          <GlButton
            ref={forwardedRef}
            aria-label={localTitle}
            category="tertiary"
            className="gl-ml-2"
            icon="copy-to-clipboard"
            onClick={handleClick}
            size={size}
            variant="default" />
        </GlTooltipTrigger>
        <GlTooltipContent placement="top">{localTitle}</GlTooltipContent>
      </GlTooltip>
    );
  },
);

export const GlBreadcrumbItem = forwardRef<HTMLLIElement, GlBreadcrumbItemProps>(
  function GlBreadcrumbItem({
    avatarPath,
    children,
    className,
    href,
    render,
    ...elementProps
  }, forwardedRef) {
    const context = useContext(BreadcrumbItemContext);
    const registerRef = useCallback((element: HTMLLIElement | null) => {
      if(context) context.registerElement(context.index, element);
    }, [context]);
    const itemRef = useMergedRefs(forwardedRef, registerRef);

    if(!context) throw new Error("GlBreadcrumbItem must be used as a child of GlBreadcrumb.");

    const avatarSize = context.size === "sm" ? 16 : 24;

    return (
      <li
        {...elementProps}
        ref={itemRef}
        className={breadcrumbItemVariants({
          className,
          onlyVisible: context.onlyVisible,
          size: context.size,
        })}>
        <GlLink
          aria-current={context.current ? "page" : undefined}
          href={href}
          render={render}
          variant="unstyled">
          {avatarPath ? (
            <GlAvatar
              aria-hidden="true"
              alt=""
              className="gl-breadcrumb-avatar-tile gl-border gl-mr-2"
              shape="rect"
              size={avatarSize}
              src={avatarPath} />
          ) : null}
          <span className="gl-align-middle">{children}</span>
        </GlLink>
      </li>
    );
  },
);

const GlBreadcrumb = forwardRef<HTMLElement, GlBreadcrumbProps>(function GlBreadcrumb({
  "aria-label": ariaLabel = "Breadcrumb",
  autoResize = true,
  children,
  className,
  clipboardTooltipText,
  pathToCopy,
  showClipboardButton = false,
  showMoreLabel = "Show more breadcrumbs",
  size = "sm",
  style,
  ...elementProps
}, forwardedRef) {
  const items = collectBreadcrumbItems(children);
  const [collapsedCount, setCollapsedCount] = useState(0);
  const [measurementPending, setMeasurementPending] = useState(
    autoResize && items.length > 0,
  );
  const [truncatedItemMaxWidth, setTruncatedItemMaxWidth] = useState<number | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const dropdownItemRef = useRef<HTMLLIElement>(null);
  const clipboardButtonRef = useRef<HTMLElement>(null);
  const itemElementsRef = useRef(new Map<number, HTMLLIElement>());
  const observedWidthRef = useRef<number | null>(null);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setRootRef = useMergedRefs(rootRef, forwardedRef);

  const registerItemElement = useCallback((index: number, element: HTMLLIElement | null) => {
    if(element) itemElementsRef.current.set(index, element);
    else itemElementsRef.current.delete(index);
  }, []);

  const clearResizeTimer = useCallback(() => {
    if(resizeTimerRef.current === null) return;
    clearTimeout(resizeTimerRef.current);
    resizeTimerRef.current = null;
  }, []);

  const scheduleMeasurement = useCallback(() => {
    clearResizeTimer();
    resizeTimerRef.current = setTimeout(() => {
      setMeasurementPending(true);
      resizeTimerRef.current = null;
    }, RESIZE_DEBOUNCE_MS);
  }, [clearResizeTimer]);

  useEffect(() => {
    if(!autoResize) return;

    const rootElement = rootRef.current;
    if(!rootElement) return;

    const handleWindowResize = () => scheduleMeasurement();
    if(typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", handleWindowResize);
      return () => {
        clearResizeTimer();
        window.removeEventListener("resize", handleWindowResize);
      };
    }

    observedWidthRef.current = rootElement.clientWidth;
    const resizeObserver = new ResizeObserver(([entry]) => {
      const observedWidth = entry?.contentRect.width ?? rootElement.clientWidth;
      if(observedWidth === observedWidthRef.current) return;

      observedWidthRef.current = observedWidth;
      scheduleMeasurement();
    });
    resizeObserver.observe(rootElement);
    return () => {
      clearResizeTimer();
      observedWidthRef.current = null;
      resizeObserver.disconnect();
    };
  }, [autoResize, clearResizeTimer, scheduleMeasurement]);

  useLayoutEffect(() => {
    if(autoResize && items.length > 0) {
      setMeasurementPending(true);
      return;
    }

    setCollapsedCount(0);
    setMeasurementPending(false);
    setTruncatedItemMaxWidth(null);
  }, [autoResize, children, items.length, showClipboardButton, size]);

  useLayoutEffect(() => {
    if(!measurementPending || !autoResize) return;

    const rootElement = rootRef.current;
    if(!rootElement || items.length === 0) {
      setCollapsedCount(0);
      setMeasurementPending(false);
      setTruncatedItemMaxWidth(null);
      return;
    }

    const widths = items.map((_, index) => (
      itemElementsRef.current.get(index)?.clientWidth ?? 0
    ));
    const clipboardElement = showClipboardButton ? clipboardButtonRef.current : null;
    const clipboardMargin = clipboardElement
      ? Number.parseFloat(getComputedStyle(clipboardElement).marginLeft) || 0
      : 0;
    const clipboardWidth = clipboardElement
      ? clipboardElement.offsetWidth + clipboardMargin
      : 0;
    const dropdownWidth = dropdownItemRef.current?.clientWidth ?? 0;
    const containerWidth = rootElement.clientWidth;
    observedWidthRef.current = containerWidth;
    const layout = calculateBreadcrumbLayout(
      widths,
      containerWidth,
      dropdownWidth,
      clipboardWidth,
    );

    setCollapsedCount(layout.collapsedCount);
    setTruncatedItemMaxWidth(layout.truncatedItemMaxWidth);
    setMeasurementPending(false);
  }, [autoResize, items, measurementPending, showClipboardButton]);

  const effectiveCollapsedCount = autoResize && !measurementPending
    ? Math.min(collapsedCount, Math.max(0, items.length - 1))
    : 0;
  const overflowingItems = items.slice(0, effectiveCollapsedCount);
  const fittingItems = items.slice(effectiveCollapsedCount);
  const dropdownSize: GlButtonSize = size === "sm" ? "small" : "medium";
  const clipboardText = resolveBreadcrumbClipboardText(
    items.map((item) => item.props.children),
    pathToCopy,
  );
  const clipboardTitle = clipboardTooltipText || "Copy to clipboard";
  const rootStyle: BreadcrumbStyle = { ...style };

  if(truncatedItemMaxWidth !== null) {
    rootStyle["--gl-breadcrumb-truncated-item-max-width"] = `${truncatedItemMaxWidth}px`;
  }
  if(measurementPending) rootStyle.opacity = 0;

  return (
    <nav
      {...elementProps}
      ref={setRootRef}
      aria-label={ariaLabel}
      className={breadcrumbVariants({ className })}
      style={rootStyle}>
      <ol className={breadcrumbListVariants()}>
        {autoResize && items.length > 0 && (measurementPending || overflowingItems.length > 0) ? (
          <li
            ref={dropdownItemRef}
            className={breadcrumbItemVariants({ size })}>
            <GlDisclosureDropdown>
              <GlDisclosureDropdownTrigger
                icon="ellipsis_h"
                noCaret
                size={dropdownSize}
                textSrOnly>
                {showMoreLabel}
              </GlDisclosureDropdownTrigger>
              <GlDisclosureDropdownContent fluidWidth>
                <GlDisclosureDropdownGroup>
                  {overflowingItems.map((item, index) => (
                    <GlDisclosureDropdownItem
                      href={item.props.href}
                      key={item.key ?? `overflow-${index}`}
                      label={item.props.children}
                      render={item.props.render}
                      value={index}>
                      {item.props.children}
                    </GlDisclosureDropdownItem>
                  ))}
                </GlDisclosureDropdownGroup>
              </GlDisclosureDropdownContent>
            </GlDisclosureDropdown>
          </li>
        ) : null}

        {fittingItems.map((item, visibleIndex) => {
          const originalIndex = effectiveCollapsedCount + visibleIndex;
          const contextValue: BreadcrumbItemContextValue = {
            current: originalIndex === items.length - 1,
            index: originalIndex,
            onlyVisible: !measurementPending && fittingItems.length === 1,
            registerElement: registerItemElement,
            size,
          };

          return (
            <BreadcrumbItemContext
              key={item.key ?? `breadcrumb-${originalIndex}`}
              value={contextValue}>
              {item}
            </BreadcrumbItemContext>
          );
        })}

        {showClipboardButton ? (
          <li className="gl-breadcrumb-clipboard-button">
            <BreadcrumbClipboardButton
              ref={clipboardButtonRef}
              size={dropdownSize}
              text={clipboardText}
              title={clipboardTitle} />
          </li>
        ) : null}
      </ol>
    </nav>
  );
});

export default GlBreadcrumb;
