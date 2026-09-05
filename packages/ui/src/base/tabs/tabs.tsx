/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/tabs/tabs/tabs.vue
 * packages/gitlab-ui/src/components/base/tabs/tabs/scrollable_tabs.vue
 *
 * Adaptations:
 * - Base UI supplies tab semantics, focus management, and keyboard behavior.
 * - Vue's numeric v-model maps to value/defaultValue/onValueChange.
 * - Action configuration props are replaced by the compositional
 *   GlTabActions, GlTabsBefore, and GlTabsAfter components.
 */

import {
  Children,
  Fragment,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { cva } from "class-variance-authority";
import { clsx, type ClassValue } from "cn";
import GlBadge from "../badge/badge";
import GlIcon from "../icon/icon";
import GlTab, { type GlTabProps } from "./tab";

type TabsRootElementProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "className" | "defaultValue"
>;

export type GlTabsProps = TabsRootElementProps & {
  /** GlTab children and optional GlTabsBefore, GlTabsAfter, and GlTabActions regions. */
  children?: ReactNode;
  className?: string;
  /** Additional clsx-compatible classes applied to the panel container. */
  contentClassName?: ClassValue;
  /** Initial selected tab index for an uncontrolled component. */
  defaultValue?: number;
  /** Content shown when no GlTab children exist. */
  empty?: ReactNode;
  /** Makes each tab consume an equal share of the available navigation width. */
  justified?: boolean;
  /** Mounts tab panels only while they are active. */
  lazy?: boolean;
  /** Additional clsx-compatible classes applied to the tab list. */
  navClassName?: ClassValue;
  /** Called when user interaction or URL synchronization requests a new index. */
  onValueChange?: (index: number) => void;
  /** Query string parameter name used for URL synchronization. */
  queryParamName?: string;
  /** Synchronizes the selected tab with the browser query string. */
  syncActiveTabWithQueryParams?: boolean;
  /** Selected tab index for a controlled component. */
  value?: number;
};

export type GlScrollableTabsProps = GlTabsProps & {
  /** Accessible label for the button that scrolls the tab list left. */
  scrollLeftLabel?: string;
  /** Accessible label for the button that scrolls the tab list right. */
  scrollRightLabel?: string;
};

type TabsRegionProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "className" | "role"
> & {
  children?: ReactNode;
  className?: string;
};

export type GlTabsBeforeProps = TabsRegionProps;
export type GlTabsAfterProps = TabsRegionProps;
export type GlTabActionsProps = TabsRegionProps;

type GlTabElement = ReactElement<GlTabProps, typeof GlTab>;
type GlTabsBeforeElement = ReactElement<GlTabsBeforeProps, typeof GlTabsBefore>;
type GlTabsAfterElement = ReactElement<GlTabsAfterProps, typeof GlTabsAfter>;
type GlTabActionsElement = ReactElement<GlTabActionsProps, typeof GlTabActions>;

type ParsedTabsChildren = {
  actions: GlTabActionsElement | null;
  after: GlTabsAfterElement | null;
  before: GlTabsBeforeElement | null;
  tabs: GlTabElement[];
};

type ScrollMetrics = {
  clientWidth: number;
  scrollLeft: number;
  scrollWidth: number;
};

type UncontrolledSelection = {
  key: string | null;
  value: number;
};

type TabsImplementationProps = GlScrollableTabsProps & {
  scrollable: boolean;
};

const tabsVariants = cva(["tabs", "gl-tabs"]);
const tabsWrapperVariants = cva("gl-tabs-wrapper");
const tabsBeforeVariants = cva("gl-tabs-before");
const tabsAfterVariants = cva("gl-tabs-after");
const tabActionsVariants = cva("gl-tab-actions");
const tabsNavVariants = cva(["nav", "gl-tabs-nav"], {
  variants: {
    justified: {
      false: null,
      true: "nav-justified",
    },
    scrollable: {
      false: null,
      true: "gl-scrollable-tabs-nav",
    },
  },
  defaultVariants: {
    justified: false,
    scrollable: false,
  },
});
const tabItemVariants = cva("nav-item");
const tabButtonVariants = cva(["nav-link", "gl-tab-nav-item"], {
  variants: {
    active: {
      false: null,
      true: "gl-tab-nav-item-active",
    },
    disabled: {
      false: null,
      true: "disabled",
    },
    justified: {
      false: null,
      true: "gl-w-full",
    },
  },
  defaultVariants: {
    active: false,
    disabled: false,
    justified: false,
  },
});
const tabContentVariants = cva(["tab-content", "gl-tab-content"]);
const tabPanelVariants = cva("tab-pane", {
  variants: {
    active: {
      false: null,
      true: "active",
    },
  },
  defaultVariants: {
    active: false,
  },
});

const EMPTY_SCROLL_METRICS: ScrollMetrics = {
  clientWidth: 0,
  scrollLeft: 0,
  scrollWidth: 0,
};

function assignRegion<T extends ReactElement>(
  current: T | null,
  next: T,
  ownerName: string,
  regionName: string,
): T {
  if(current) {
    throw new Error(`${ownerName} accepts at most one ${regionName} child.`);
  }
  return next;
}

function warnAboutIgnoredScrollableRegion(regionName: string) {
  const environment = typeof process === "undefined" ? undefined : process.env.NODE_ENV;
  if(environment !== "production") {
    console.warn(`[GlScrollableTabs] ${regionName} children are not supported and were ignored.`);
  }
}

function parseTabsChildren(children: ReactNode, ownerName: string): ParsedTabsChildren {
  const result: ParsedTabsChildren = {
    actions: null,
    after: null,
    before: null,
    tabs: [],
  };

  const visit = (nodes: ReactNode) => {
    Children.forEach(nodes, (child) => {
      if(child === null || child === undefined || typeof child === "boolean") return;

      if(isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
        visit(child.props.children);
        return;
      }

      if(isValidElement<GlTabProps>(child) && child.type === GlTab) {
        result.tabs.push(child as GlTabElement);
        return;
      }

      if(isValidElement<GlTabsBeforeProps>(child) && child.type === GlTabsBefore) {
        if(ownerName === "GlScrollableTabs") {
          warnAboutIgnoredScrollableRegion("GlTabsBefore");
          return;
        }
        result.before = assignRegion(
          result.before,
          child as GlTabsBeforeElement,
          ownerName,
          "GlTabsBefore",
        );
        return;
      }

      if(isValidElement<GlTabsAfterProps>(child) && child.type === GlTabsAfter) {
        if(ownerName === "GlScrollableTabs") {
          warnAboutIgnoredScrollableRegion("GlTabsAfter");
          return;
        }
        result.after = assignRegion(
          result.after,
          child as GlTabsAfterElement,
          ownerName,
          "GlTabsAfter",
        );
        return;
      }

      if(isValidElement<GlTabActionsProps>(child) && child.type === GlTabActions) {
        if(ownerName === "GlScrollableTabs") {
          warnAboutIgnoredScrollableRegion("GlTabActions");
          return;
        }
        result.actions = assignRegion(
          result.actions,
          child as GlTabActionsElement,
          ownerName,
          "GlTabActions",
        );
        return;
      }

      throw new Error(
        `${ownerName} only accepts GlTab, GlTabsBefore, GlTabsAfter, and `
        + "GlTabActions as direct children. Arrays, Fragments, and conditional children "
        + "are supported.",
      );
    });
  };

  visit(children);
  return result;
}

function queryValueForTab(tab: GlTabElement, index: number): string {
  return tab.props.queryParamValue || index.toString();
}

function firstEnabledTabIndex(tabs: GlTabElement[]): number | null {
  const index = tabs.findIndex((tab) => !tab.props.disabled);
  return index === -1 ? null : index;
}

function selectableTabIndex(index: number, tabs: GlTabElement[]): number | null {
  if(Number.isInteger(index) && index >= 0 && index < tabs.length && !tabs[index].props.disabled) {
    return index;
  }
  return firstEnabledTabIndex(tabs);
}

function tabKeyAtIndex(tabs: GlTabElement[], index: number): string | null {
  return Number.isInteger(index) && index >= 0 && index < tabs.length
    ? tabs[index].key
    : null;
}

function queryTabIndex(
  tabs: GlTabElement[],
  queryParamName: string,
  location: Location,
): number | null {
  const queryValue = new URLSearchParams(location.search).get(queryParamName);
  const requestedIndex = queryValue === null
    ? 0
    : tabs.findIndex((tab, index) => queryValueForTab(tab, index) === queryValue);

  return selectableTabIndex(requestedIndex === -1 ? 0 : requestedIndex, tabs);
}

function setQueryTabIndex(
  tabs: GlTabElement[],
  queryParamName: string,
  index: number,
) {
  if(typeof window === "undefined") return;

  const searchParams = new URLSearchParams(window.location.search);
  const currentQueryValue = searchParams.get(queryParamName);
  const nextQueryValue = queryValueForTab(tabs[index], index);

  if((index === 0 && !currentQueryValue) || currentQueryValue === nextQueryValue) return;

  searchParams.set(queryParamName, nextQueryValue);
  const search = searchParams.toString();
  const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
  window.history.pushState({}, "", nextUrl);
}

function TabsImplementation({
  children,
  className,
  contentClassName,
  defaultValue = 0,
  empty,
  justified = false,
  lazy = false,
  navClassName,
  onValueChange,
  queryParamName = "tab",
  scrollable,
  scrollLeftLabel = "Scroll left",
  scrollRightLabel = "Scroll right",
  syncActiveTabWithQueryParams = false,
  value,
  forwardedRef,
  ...elementProps
}: TabsImplementationProps & { forwardedRef: Ref<HTMLDivElement> }) {
  const parsedChildren = parseTabsChildren(
    children,
    scrollable ? "GlScrollableTabs" : "GlTabs",
  );

  const tabs = parsedChildren.tabs;
  const before = scrollable ? null : parsedChildren.before;
  const after = scrollable ? null : parsedChildren.after;
  const actions = scrollable ? null : parsedChildren.actions;
  const isControlled = value !== undefined;
  // Explicit keys preserve the active tab instance across child insertion and
  // reordering. Unkeyed tabs intentionally retain numeric index semantics.
  const [uncontrolledSelection, setUncontrolledSelection] = useState<UncontrolledSelection>(
    () => ({
      key: tabKeyAtIndex(tabs, defaultValue),
      value: defaultValue,
    }),
  );
  const trackedUncontrolledIndex = uncontrolledSelection.key === null
    ? -1
    : tabs.findIndex((tab) => tab.key === uncontrolledSelection.key);
  const uncontrolledValue = trackedUncontrolledIndex >= 0
    ? trackedUncontrolledIndex
    : uncontrolledSelection.value;
  const requestedValue = isControlled ? value : uncontrolledValue;
  const firstEnabledIndex = firstEnabledTabIndex(tabs);
  const requestedValueIsSelectable = Number.isInteger(requestedValue)
    && requestedValue >= 0
    && requestedValue < tabs.length
    && !tabs[requestedValue].props.disabled;
  const selectedValue = requestedValueIsSelectable
    ? requestedValue
    : firstEnabledIndex;
  const selectedTabKey = selectedValue === null ? null : tabs[selectedValue].key;
  const trackedUncontrolledTabMoved = !isControlled
    && uncontrolledSelection.key !== null
    && trackedUncontrolledIndex >= 0
    && trackedUncontrolledIndex !== uncontrolledSelection.value;
  const tabsStateSignature = JSON.stringify(tabs.map((tab, index) => ({
    disabled: Boolean(tab.props.disabled),
    key: tab.key ?? index,
    queryParamValue: queryValueForTab(tab, index),
  })));
  // parseTabsChildren returns a new array on every render. Query synchronization
  // reads the latest tabs through this ref and reacts only to semantic changes.
  const tabsRef = useRef(tabs);
  const onValueChangeRef = useRef(onValueChange);
  const isControlledRef = useRef(isControlled);
  const selectedValueRef = useRef<number | null>(selectedValue);
  const queryHistoryReadyRef = useRef(false);
  const fallbackRequestRef = useRef<string | null>(null);
  tabsRef.current = tabs;
  onValueChangeRef.current = onValueChange;
  isControlledRef.current = isControlled;
  selectedValueRef.current = selectedValue;

  useEffect(() => {
    if(isControlled || selectedValue === null || !requestedValueIsSelectable) return;
    if(
      uncontrolledSelection.value === selectedValue
      && uncontrolledSelection.key === selectedTabKey
    ) return;

    setUncontrolledSelection({ key: selectedTabKey, value: selectedValue });
    if(trackedUncontrolledTabMoved) onValueChangeRef.current?.(selectedValue);
  }, [
    isControlled,
    requestedValueIsSelectable,
    selectedTabKey,
    selectedValue,
    trackedUncontrolledTabMoved,
    uncontrolledSelection.key,
    uncontrolledSelection.value,
  ]);

  const navRef = useRef<HTMLDivElement>(null);
  const [scrollMetrics, setScrollMetrics] = useState<ScrollMetrics>(EMPTY_SCROLL_METRICS);
  const updateScrollMetrics = useCallback(() => {
    const navElement = navRef.current;
    if(!scrollable || !navElement) return;

    const nextMetrics = {
      clientWidth: navElement.clientWidth,
      scrollLeft: navElement.scrollLeft,
      scrollWidth: navElement.scrollWidth,
    };
    setScrollMetrics((currentMetrics) => (
      currentMetrics.clientWidth === nextMetrics.clientWidth
      && currentMetrics.scrollLeft === nextMetrics.scrollLeft
      && currentMetrics.scrollWidth === nextMetrics.scrollWidth
        ? currentMetrics
        : nextMetrics
    ));
  }, [scrollable]);

  useEffect(() => {
    if(!scrollable) return;

    const navElement = navRef.current;
    if(!navElement) return;

    updateScrollMetrics();
    navElement.addEventListener("scroll", updateScrollMetrics);
    window.addEventListener("resize", updateScrollMetrics);

    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(updateScrollMetrics);
    resizeObserver?.observe(navElement);

    const mutationObserver = typeof MutationObserver === "undefined"
      ? null
      : new MutationObserver(updateScrollMetrics);
    mutationObserver?.observe(navElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
      navElement.removeEventListener("scroll", updateScrollMetrics);
      window.removeEventListener("resize", updateScrollMetrics);
    };
  }, [scrollable, updateScrollMetrics]);

  // Keep externally changed controlled values reflected in the URL. This
  // effect intentionally runs before the query-listener effect so the first
  // client render never overwrites a deep link before it has been read.
  useEffect(() => {
    if(
      !syncActiveTabWithQueryParams
      || !queryHistoryReadyRef.current
      || selectedValue === null
      || !requestedValueIsSelectable
    ) return;

    setQueryTabIndex(tabsRef.current, queryParamName, selectedValue);
  }, [
    queryParamName,
    requestedValueIsSelectable,
    selectedValue,
    syncActiveTabWithQueryParams,
    tabsStateSignature,
  ]);

  useEffect(() => {
    if(!syncActiveTabWithQueryParams) {
      queryHistoryReadyRef.current = false;
      return;
    }

    const updateFromLocation = () => {
      const currentTabs = tabsRef.current;
      const nextValue = queryTabIndex(currentTabs, queryParamName, window.location);
      if(nextValue === null || nextValue === selectedValueRef.current) return;

      if(!isControlledRef.current) {
        setUncontrolledSelection({
          key: tabKeyAtIndex(currentTabs, nextValue),
          value: nextValue,
        });
      }
      onValueChangeRef.current?.(nextValue);
    };

    updateFromLocation();
    queryHistoryReadyRef.current = true;
    window.addEventListener("popstate", updateFromLocation);

    return () => window.removeEventListener("popstate", updateFromLocation);
  }, [queryParamName, syncActiveTabWithQueryParams, tabsStateSignature]);

  useEffect(() => {
    if(requestedValueIsSelectable || firstEnabledIndex === null) {
      fallbackRequestRef.current = null;
      return;
    }

    if(syncActiveTabWithQueryParams && typeof window !== "undefined") {
      const locationValue = queryTabIndex(tabs, queryParamName, window.location);
      // A URL target that normalizes to this fallback is not a competing
      // selection. Commit it so re-enabling the invalid tab cannot restore it.
      if(locationValue !== null && locationValue !== firstEnabledIndex) return;
    }

    const requestKey = `${requestedValue}:${firstEnabledIndex}:${tabsStateSignature}`;
    if(fallbackRequestRef.current === requestKey) return;
    fallbackRequestRef.current = requestKey;

    if(!isControlled) {
      setUncontrolledSelection({
        key: tabKeyAtIndex(tabs, firstEnabledIndex),
        value: firstEnabledIndex,
      });
    }
    onValueChangeRef.current?.(firstEnabledIndex);
  }, [
    firstEnabledIndex,
    isControlled,
    queryParamName,
    requestedValue,
    requestedValueIsSelectable,
    syncActiveTabWithQueryParams,
    tabs,
    tabsStateSignature,
  ]);

  const handleValueChange = (nextValue: unknown) => {
    if(typeof nextValue !== "number") return;

    if(!isControlled) {
      setUncontrolledSelection({
        key: tabKeyAtIndex(tabs, nextValue),
        value: nextValue,
      });
      if(syncActiveTabWithQueryParams) setQueryTabIndex(tabs, queryParamName, nextValue);
    }
    onValueChange?.(nextValue);
  };

  const moveFocusToEnabledTab = (
    event: ReactKeyboardEvent<HTMLElement>,
    currentIndex: number,
  ) => {
    if(event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

    const navElement = navRef.current;
    if(!navElement) return;

    let nextIndex = currentIndex;
    if(event.key === "Home") {
      nextIndex = firstEnabledTabIndex(tabs) ?? currentIndex;
    } else if(event.key === "End") {
      for(let index = tabs.length - 1; index >= 0; index -= 1) {
        if(!tabs[index].props.disabled) {
          nextIndex = index;
          break;
        }
      }
    } else if(event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const isRtl = getComputedStyle(navElement).direction === "rtl";
      const forwardKey = isRtl ? "ArrowLeft" : "ArrowRight";
      const step = event.key === forwardKey ? 1 : -1;
      let candidateIndex = currentIndex + step;

      while(candidateIndex >= 0 && candidateIndex < tabs.length) {
        if(!tabs[candidateIndex].props.disabled) {
          nextIndex = candidateIndex;
          break;
        }
        candidateIndex += step;
      }
    } else {
      return;
    }

    // Base UI keeps disabled tabs focusable. Pajamas tabs skip them, so handle
    // the horizontal composite keys here and stop Base UI's list handler.
    event.preventDefault();
    event.stopPropagation();
    if(nextIndex === currentIndex) return;

    navElement.querySelectorAll<HTMLElement>("[role=\"tab\"]")[nextIndex]?.focus();
    handleValueChange(nextIndex);
  };

  const scrollTabs = (direction: -1 | 1) => {
    const navElement = navRef.current;
    if(!navElement) return;

    const maxScrollLeft = Math.max(0, navElement.scrollWidth - navElement.clientWidth);
    const nextScrollLeft = Math.min(
      maxScrollLeft,
      Math.max(0, navElement.scrollLeft + direction * navElement.clientWidth),
    );
    navElement.scrollTo({ behavior: "smooth", left: nextScrollLeft });
    setScrollMetrics({
      clientWidth: navElement.clientWidth,
      scrollLeft: nextScrollLeft,
      scrollWidth: navElement.scrollWidth,
    });
  };

  const showScrollLeft = scrollable
    && scrollMetrics.scrollWidth > scrollMetrics.clientWidth
    && scrollMetrics.scrollLeft > 0;
  const showScrollRight = scrollable
    && scrollMetrics.scrollWidth > scrollMetrics.clientWidth
    && Math.ceil(scrollMetrics.scrollLeft + scrollMetrics.clientWidth)
      < scrollMetrics.scrollWidth;

  return (
    <BaseTabs.Root
      {...elementProps}
      ref={forwardedRef}
      className={tabsVariants({ className })}
      onValueChange={handleValueChange}
      value={selectedValue}>
      <div className={tabsWrapperVariants()}>
        {before}
        {scrollable ? (
          <div hidden={!showScrollLeft} className="gl-tabs-fade gl-tabs-fade-left">
            <button
              aria-label={scrollLeftLabel}
              className="gl-tabs-fade-icon-button"
              onClick={() => scrollTabs(-1)}
              type="button">
              <GlIcon name="chevron-lg-left" size={16} />
            </button>
          </div>
        ) : null}
        <BaseTabs.List
          ref={navRef}
          className={tabsNavVariants({
            className: clsx(navClassName),
            justified,
            scrollable,
          })}
          loopFocus={false}
          render={<ul />}>
          {tabs.map((tab, index) => {
            const {
              disabled = false,
              tabCount,
              tabCountSrText,
              tabProps,
              title,
              titleClassName,
              titleItemClassName,
            } = tab.props;
            const hasTabCount = tabCount !== null && tabCount !== undefined && tabCount >= 0;
            const environment = typeof process === "undefined"
              ? undefined
              : process.env.NODE_ENV;
            if(environment !== "production" && hasTabCount && !tabCountSrText) {
              console.warn(
                "[GlTab] When using tabCount, provide tabCountSrText so screen readers "
                + "receive the count's context.",
              );
            }

            return (
              <li
                key={tab.key ?? index}
                className={tabItemVariants({ className: clsx(titleItemClassName) })}
                role="presentation">
                <BaseTabs.Tab
                  {...tabProps}
                  aria-posinset={index + 1}
                  aria-setsize={tabs.length}
                  className={(state) => tabButtonVariants({
                    active: state.active,
                    className: clsx(titleClassName),
                    disabled: state.disabled,
                    justified,
                  })}
                  disabled={disabled}
                  nativeButton
                  onKeyDown={(event) => {
                    tabProps?.onKeyDown?.(
                      event as ReactKeyboardEvent<HTMLButtonElement>,
                    );
                    if(!event.defaultPrevented) moveFocusToEnabledTab(event, index);
                  }}
                  value={index}>
                  {title}
                  {hasTabCount ? (
                    <>
                      <GlBadge
                        aria-hidden
                        className="gl-tab-counter-badge"
                        data-testid="tab-counter-badge"
                        variant="neutral">
                        {tabCount}
                      </GlBadge>
                      {tabCountSrText ? (
                        <span className="gl-sr-only">{tabCountSrText}</span>
                      ) : null}
                    </>
                  ) : null}
                </BaseTabs.Tab>
              </li>
            );
          })}
        </BaseTabs.List>
        {scrollable ? (
          <div hidden={!showScrollRight} className="gl-tabs-fade gl-tabs-fade-right">
            <button
              aria-label={scrollRightLabel}
              className="gl-tabs-fade-icon-button"
              onClick={() => scrollTabs(1)}
              type="button">
              <GlIcon name="chevron-lg-right" size={16} />
            </button>
          </div>
        ) : null}
        {after}
        {actions}
      </div>
      <div className={tabContentVariants({ className: clsx(contentClassName) })}>
        {tabs.length === 0 ? <div className="tab-pane active">{empty}</div> : null}
        {tabs.map((tab, index) => {
          const {
            children: panelContent,
            lazy: tabLazy,
            panelClassName,
            panelProps,
          } = tab.props;

          return (
            <BaseTabs.Panel
              {...panelProps}
              key={tab.key ?? index}
              className={(state) => tabPanelVariants({
                active: !state.hidden,
                className: clsx(panelClassName),
              })}
              keepMounted={!(tabLazy ?? lazy)}
              value={index}>
              {panelContent}
            </BaseTabs.Panel>
          );
        })}
      </div>
    </BaseTabs.Root>
  );
}

export const GlTabsBefore = forwardRef<HTMLDivElement, GlTabsBeforeProps>(
  function GlTabsBefore({ children, className, ...elementProps }, forwardedRef) {
    return (
      <div
        {...elementProps}
        ref={forwardedRef}
        className={tabsBeforeVariants({ className })}>
        {children}
      </div>
    );
  },
);

export const GlTabsAfter = forwardRef<HTMLDivElement, GlTabsAfterProps>(
  function GlTabsAfter({ children, className, ...elementProps }, forwardedRef) {
    return (
      <div
        {...elementProps}
        ref={forwardedRef}
        className={tabsAfterVariants({ className })}>
        {children}
      </div>
    );
  },
);

export const GlTabActions = forwardRef<HTMLDivElement, GlTabActionsProps>(
  function GlTabActions({ children, className, ...elementProps }, forwardedRef) {
    return (
      <div
        {...elementProps}
        ref={forwardedRef}
        className={tabActionsVariants({ className })}
        role="toolbar">
        {children}
      </div>
    );
  },
);

const GlTabs = forwardRef<HTMLDivElement, GlTabsProps>(function GlTabs(props, forwardedRef) {
  return <TabsImplementation {...props} forwardedRef={forwardedRef} scrollable={false} />;
});

export const GlScrollableTabs = forwardRef<HTMLDivElement, GlScrollableTabsProps>(
  function GlScrollableTabs(props, forwardedRef) {
    return <TabsImplementation {...props} forwardedRef={forwardedRef} scrollable />;
  },
);

export default GlTabs;
