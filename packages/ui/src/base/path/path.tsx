/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/path/path.vue
 *
 * Adaptations:
 * - Vue's items prop maps to strict GlPathItem composition.
 * - The selected event maps to value/defaultValue/onValueChange with stable
 *   string values.
 * - The upstream scoped slot is intentionally replaced by the title and
 *   metric compound parts.
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
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEventHandler,
  type ReactElement,
  type Ref,
} from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { cva } from "class-variance-authority";
import { useMergedRefs } from "../../internal/utils/merge-refs.js";
import GlIcon from "../icon/icon.js";

const BOUNDARY_WIDTH = 40;
const DEFAULT_BACKGROUND_COLOR = "rgba(0,0,0,0)";

type PathRootElementProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "defaultValue"
>;

type GlPathItemElement = ReactElement<GlPathItemProps, typeof GlPathItem>;
type GlPathChild =
  | GlPathItemElement
  | readonly GlPathChild[]
  | boolean
  | null
  | undefined;

type GlPathItemTitleElement = ReactElement<
  GlPathItemTitleProps,
  typeof GlPathItemTitle
>;
type GlPathItemMetricElement = ReactElement<
  GlPathItemMetricProps,
  typeof GlPathItemMetric
>;
type GlPathItemChild =
  | GlPathItemTitleElement
  | GlPathItemMetricElement
  | readonly GlPathItemChild[]
  | boolean
  | null
  | undefined;

export type GlPathProps = PathRootElementProps & {
  /** The background color beneath the overflow fades. */
  backgroundColor?: string;
  /** GlPathItem children. Arrays, Fragments, and conditional children are supported. */
  children?: GlPathChild;
  /** Initial selected item value for an uncontrolled path. */
  defaultValue?: string;
  /** Called whenever an enabled item requests selection. */
  onValueChange?: (value: string) => void;
  /** Accessible label for the button that scrolls the path left. */
  scrollLeftLabel?: string;
  /** Accessible label for the button that scrolls the path right. */
  scrollRightLabel?: string;
  /** Selected item value for a controlled path. */
  value?: string;
};

export type GlPathItemProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-current" | "children" | "type"
> & {
  /** One GlPathItemTitle and, optionally, one GlPathItemMetric. */
  children: GlPathItemChild;
  /** Optional decorative icon from @gitlab/svgs. */
  icon?: string;
  /** Stable, unique selection value. */
  value: string;
};

export type GlPathItemTitleProps = HTMLAttributes<HTMLSpanElement>;
export type GlPathItemMetricProps = HTMLAttributes<HTMLSpanElement>;

type PathContextValue = {
  onSelect(value: string): void;
  selectedValue: string | undefined;
};

type PathItemContent = {
  metric: GlPathItemMetricElement | null;
  title: GlPathItemTitleElement;
};

type ScrollMetrics = {
  scrollLeft: number;
  scrollWidth: number;
  width: number;
};

type PathStyle = CSSProperties & {
  "--path-bg-color": string;
};

const EMPTY_SCROLL_METRICS: ScrollMetrics = {
  scrollLeft: 0,
  scrollWidth: 0,
  width: 0,
};

const PathContext = createContext<PathContextValue | null>(null);

const pathVariants = cva("gl-path-nav");
const pathListVariants = cva("gl-path-nav-list");
const pathListItemVariants = cva("gl-path-nav-list-item");
const pathButtonVariants = cva("gl-path-button", {
  variants: {
    active: {
      false: null,
      true: "gl-path-active-item",
    },
  },
  defaultVariants: {
    active: false,
  },
});
const pathTitleVariants = cva("gl-path-item-title");
const pathMetricVariants = cva([
  "gl-path-item-metric",
  "gl-pl-2",
  "gl-font-normal",
]);

export const GlPathItemTitle = forwardRef<HTMLSpanElement, GlPathItemTitleProps>(
  function GlPathItemTitle({ className, ...elementProps }, forwardedRef) {
    return (
      <span
        {...elementProps}
        ref={forwardedRef}
        className={pathTitleVariants({ className })} />
    );
  },
);

export const GlPathItemMetric = forwardRef<HTMLSpanElement, GlPathItemMetricProps>(
  function GlPathItemMetric({ className, ...elementProps }, forwardedRef) {
    return (
      <span
        {...elementProps}
        ref={forwardedRef}
        className={pathMetricVariants({ className })} />
    );
  },
);

function resolvePathItemContent(children: GlPathItemChild): PathItemContent {
  let title: GlPathItemTitleElement | null = null;
  let metric: GlPathItemMetricElement | null = null;

  const visit = (nodes: GlPathItemChild) => {
    Children.forEach(nodes, (child) => {
      if(child === null || child === undefined || typeof child === "boolean") return;

      if(isValidElement<{ children?: GlPathItemChild }>(child) && child.type === Fragment) {
        visit(child.props.children);
        return;
      }

      if(isValidElement<GlPathItemTitleProps>(child) && child.type === GlPathItemTitle) {
        if(title) throw new Error("GlPathItem accepts exactly one GlPathItemTitle child.");
        title = child as GlPathItemTitleElement;
        return;
      }

      if(isValidElement<GlPathItemMetricProps>(child) && child.type === GlPathItemMetric) {
        if(metric) throw new Error("GlPathItem accepts at most one GlPathItemMetric child.");
        metric = child as GlPathItemMetricElement;
        return;
      }

      throw new Error(
        "GlPathItem only accepts GlPathItemTitle and GlPathItemMetric as direct children. "
        + "Arrays, Fragments, and conditional children are supported.",
      );
    });
  };

  visit(children);
  if(!title) throw new Error("GlPathItem requires exactly one GlPathItemTitle child.");

  return { metric, title };
}

export const GlPathItem = forwardRef<HTMLButtonElement, GlPathItemProps>(
  function GlPathItem({
    children,
    className,
    disabled = false,
    icon,
    id,
    onClick,
    value,
    ...buttonProps
  }, forwardedRef) {
    const context = useContext(PathContext);
    if(!context) throw new Error("GlPathItem must be used as a child of GlPath.");

    const content = resolvePathItemContent(children);
    const generatedId = useId().replace(/[^a-zA-Z0-9_-]/gu, "");
    const itemId = id ?? `path-item-${generatedId}`;
    const isSelected = context.selectedValue === value;

    const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
      onClick?.(event);
      if(!event.defaultPrevented) context.onSelect(value);
    };

    return (
      <li className={pathListItemVariants()}>
        <BaseButton
          {...buttonProps}
          ref={forwardedRef as Ref<HTMLElement>}
          aria-current={isSelected}
          className={pathButtonVariants({ active: isSelected, className })}
          disabled={disabled}
          id={itemId}
          nativeButton
          onClick={handleClick as MouseEventHandler<HTMLElement>}
          type="button">
          {icon ? <GlIcon className="gl-mr-2" name={icon} /> : null}
          {content.title}
          {content.metric}
        </BaseButton>
      </li>
    );
  },
);

function collectPathItems(children: GlPathChild): GlPathItemElement[] {
  const items: GlPathItemElement[] = [];

  const visit = (nodes: GlPathChild) => {
    Children.forEach(nodes, (child) => {
      if(child === null || child === undefined || typeof child === "boolean") return;

      if(isValidElement<{ children?: GlPathChild }>(child) && child.type === Fragment) {
        visit(child.props.children);
        return;
      }

      if(isValidElement<GlPathItemProps>(child) && child.type === GlPathItem) {
        items.push(child as GlPathItemElement);
        return;
      }

      throw new Error(
        "GlPath only accepts GlPathItem as direct children. "
        + "Arrays, Fragments, and conditional children are supported.",
      );
    });
  };

  visit(children);
  return items;
}

function validateItemValues(items: readonly GlPathItemElement[]) {
  const seenValues = new Set<string>();

  for(const item of items) {
    const { value } = item.props;
    if(value.trim().length === 0) {
      throw new Error("GlPathItem value must be a non-empty string.");
    }
    if(seenValues.has(value)) {
      throw new Error(`GlPathItem values must be unique. Received duplicate value '${value}'.`);
    }
    seenValues.add(value);
  }
}

const GlPath = forwardRef<HTMLDivElement, GlPathProps>(function GlPath({
  backgroundColor = DEFAULT_BACKGROUND_COLOR,
  children,
  className,
  defaultValue,
  onValueChange,
  scrollLeftLabel = "Scroll left",
  scrollRightLabel = "Scroll right",
  style,
  value,
  ...elementProps
}, forwardedRef) {
  const items = collectPathItems(children);
  validateItemValues(items);

  const itemValues = items.map((item) => item.props.value);
  const firstValue = itemValues[0];
  const itemValuesSignature = JSON.stringify(itemValues);
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState<string | undefined>(() => (
    defaultValue !== undefined && itemValues.includes(defaultValue)
      ? defaultValue
      : firstValue
  ));
  const requestedValue = isControlled ? value : uncontrolledValue;
  const selectedValue = requestedValue !== undefined && itemValues.includes(requestedValue)
    ? requestedValue
    : isControlled
      ? undefined
      : firstValue;
  const onValueChangeRef = useRef(onValueChange);
  onValueChangeRef.current = onValueChange;

  useEffect(() => {
    if(isControlled || requestedValue === selectedValue) return;

    const shouldNotifyFallback = requestedValue !== undefined && selectedValue !== undefined;
    setUncontrolledValue(selectedValue);
    if(shouldNotifyFallback) onValueChangeRef.current?.(selectedValue);
  }, [isControlled, itemValuesSignature, requestedValue, selectedValue]);

  const handleSelect = useCallback((nextValue: string) => {
    if(!isControlled) setUncontrolledValue(nextValue);
    onValueChange?.(nextValue);
  }, [isControlled, onValueChange]);

  const context = useMemo<PathContextValue>(() => ({
    onSelect: handleSelect,
    selectedValue,
  }), [handleSelect, selectedValue]);

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [scrollMetrics, setScrollMetrics] = useState<ScrollMetrics>(EMPTY_SCROLL_METRICS);
  const setRootRef = useMergedRefs(rootRef, forwardedRef);

  const updateScrollMetrics = useCallback((observedWidth?: number) => {
    const rootElement = rootRef.current;
    const listElement = listRef.current;
    if(!rootElement || !listElement) return;

    const nextMetrics = {
      scrollLeft: listElement.scrollLeft,
      scrollWidth: listElement.scrollWidth,
      width: observedWidth ?? rootElement.getBoundingClientRect().width,
    };
    setScrollMetrics((currentMetrics) => (
      currentMetrics.scrollLeft === nextMetrics.scrollLeft
      && currentMetrics.scrollWidth === nextMetrics.scrollWidth
      && currentMetrics.width === nextMetrics.width
        ? currentMetrics
        : nextMetrics
    ));
  }, []);

  useEffect(() => {
    const rootElement = rootRef.current;
    const listElement = listRef.current;
    if(!rootElement || !listElement) return;

    updateScrollMetrics();
    const handleScroll = () => updateScrollMetrics();
    const handleWindowResize = () => updateScrollMetrics();
    listElement.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleWindowResize);

    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(([entry]) => updateScrollMetrics(entry?.contentRect.width));
    resizeObserver?.observe(rootElement);
    const mutationObserver = typeof MutationObserver === "undefined"
      ? null
      : new MutationObserver(handleScroll);
    mutationObserver?.observe(listElement, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
      listElement.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [updateScrollMetrics]);

  useEffect(() => {
    updateScrollMetrics();
  }, [itemValuesSignature, updateScrollMetrics]);

  const scrollPath = (scrollLeft: number) => {
    const listElement = listRef.current;
    if(!listElement) return;

    listElement.scrollTo({ behavior: "smooth", left: scrollLeft });
    setScrollMetrics({
      scrollLeft,
      scrollWidth: listElement.scrollWidth,
      width: scrollMetrics.width,
    });
  };

  const scrollPathLeft = () => {
    const listElement = listRef.current;
    if(!listElement) return;

    const leftHandBoundary = scrollMetrics.scrollLeft + BOUNDARY_WIDTH;
    const previousItem = Array.from(listElement.children)
      .filter((item): item is HTMLLIElement => item instanceof HTMLLIElement)
      .findLast((item) => item.offsetLeft < leftHandBoundary);
    if(!previousItem) return;

    const availableWidth = scrollMetrics.width
      - previousItem.offsetWidth
      - BOUNDARY_WIDTH
      - BOUNDARY_WIDTH;
    const scrollLeft = Math.max(
      0,
      previousItem.offsetLeft - BOUNDARY_WIDTH - availableWidth,
    );
    scrollPath(scrollLeft);
  };

  const scrollPathRight = () => {
    const listElement = listRef.current;
    if(!listElement) return;

    const rightHandBoundary = scrollMetrics.width
      - BOUNDARY_WIDTH
      + scrollMetrics.scrollLeft;
    const nextItem = Array.from(listElement.children)
      .filter((item): item is HTMLLIElement => item instanceof HTMLLIElement)
      .find((item) => item.offsetLeft + item.offsetWidth > rightHandBoundary);
    if(!nextItem) return;

    const maxScrollLeft = Math.max(0, listElement.scrollWidth - scrollMetrics.width);
    scrollPath(Math.min(maxScrollLeft, nextItem.offsetLeft - BOUNDARY_WIDTH));
  };

  const entireListVisible = scrollMetrics.width >= scrollMetrics.scrollWidth;
  const showScrollLeft = !entireListVisible && scrollMetrics.scrollLeft > 0;
  const showScrollRight = !entireListVisible
    && scrollMetrics.scrollWidth - scrollMetrics.width !== scrollMetrics.scrollLeft;
  const rootStyle = {
    ...style,
    "--path-bg-color": backgroundColor,
  } as PathStyle;

  return (
    <PathContext value={context}>
      <div
        {...elementProps}
        ref={setRootRef}
        className={pathVariants({ className })}
        data-testid="gl-path-nav"
        style={rootStyle}>
        <span hidden={!showScrollLeft} className="gl-path-fade gl-path-fade-left">
          <BaseButton
            aria-label={scrollLeftLabel}
            className="gl-clear-icon-button"
            nativeButton
            onClick={scrollPathLeft}
            type="button">
            <GlIcon name="chevron-left" size={32} />
          </BaseButton>
        </span>
        <ul ref={listRef} className={pathListVariants()}>
          {children}
        </ul>
        <span hidden={!showScrollRight} className="gl-path-fade gl-path-fade-right">
          <BaseButton
            aria-label={scrollRightLabel}
            className="gl-clear-icon-button"
            nativeButton
            onClick={scrollPathRight}
            type="button">
            <GlIcon name="chevron-right" size={32} />
          </BaseButton>
        </span>
      </div>
    </PathContext>
  );
});

export default GlPath;
