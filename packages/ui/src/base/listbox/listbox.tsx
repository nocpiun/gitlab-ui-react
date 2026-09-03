/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/new_dropdowns/base_dropdown/base_dropdown.vue
 * packages/gitlab-ui/src/components/base/new_dropdowns/listbox/listbox.vue
 * packages/gitlab-ui/src/components/base/new_dropdowns/listbox/listbox_item.vue
 */

import {
  Children,
  Fragment,
  cloneElement,
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
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { mergeProps } from "@base-ui/react/merge-props";
import { cva } from "class-variance-authority";
import clsx from "clsx";
import GlButton, {
  type GlButtonCategory,
  type GlButtonSize,
  type GlButtonVariant,
} from "../button/button";
import GlIcon from "../icon/icon";
import GlLoadingIcon from "../loading-icon/loading-icon";
import { useMergedRefs } from "../../internal/utils/merge-refs";
import GlListboxSearchInput, {
  type GlListboxSearchInputProps,
} from "./listbox-search-input";
import {
  ListboxContentContext,
  ListboxGroupContext,
  type ListboxContentContextValue,
  type RegisteredListboxItem,
} from "./listbox-contexts";

export type GlListboxValue = string | number | null;

export type GlListboxCloseReason =
  | "trigger"
  | "outside"
  | "escape"
  | "item"
  | "focus-out"
  | "imperative";

export type GlListboxOpenChangeDetails = {
  event: Event;
  reason: GlListboxCloseReason;
};

export type GlListboxBeforeCloseDetails = GlListboxOpenChangeDetails & {
  readonly defaultPrevented: boolean;
  preventDefault(): void;
};

export type GlListboxSelectionDetails = {
  event: Event;
  itemValue: GlListboxValue;
  selected: boolean;
};

export type GlListboxHandle = {
  open(): void;
  close(): void;
  closeAndFocus(): void;
  containsElement(element: Element | null): boolean;
};

type GlListboxCommonProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "defaultValue" | "onChange"
> & {
  children?: ReactNode;
  defaultOpen?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onBeforeClose?: (details: GlListboxBeforeCloseDetails) => void;
  onHidden?: () => void;
  onOpenChange?: (open: boolean, details: GlListboxOpenChangeDetails) => void;
  onShown?: () => void;
  open?: boolean;
  /** Validation state applied to the trigger. */
  state?: boolean | null;
};

export type GlListboxSingleProps = GlListboxCommonProps & {
  defaultValue?: GlListboxValue;
  multiple?: false;
  onValueChange?: (
    value: GlListboxValue,
    details: GlListboxSelectionDetails,
  ) => void;
  value?: GlListboxValue;
};

export type GlListboxMultipleProps = GlListboxCommonProps & {
  defaultValue?: GlListboxValue[];
  multiple: true;
  onValueChange?: (
    value: GlListboxValue[],
    details: GlListboxSelectionDetails,
  ) => void;
  value?: GlListboxValue[];
};

export type GlListboxProps = GlListboxSingleProps | GlListboxMultipleProps;

export type GlListboxTriggerProps = Omit<
  BaseMenu.Trigger.Props,
  "children" | "className" | "disabled" | "nativeButton" | "render"
> & {
  block?: boolean;
  category?: GlButtonCategory;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  icon?: string;
  nativeButton?: boolean;
  noCaret?: boolean;
  render?: BaseMenu.Trigger.Props["render"];
  size?: GlButtonSize;
  textSrOnly?: boolean;
  variant?: GlButtonVariant;
};

export type GlListboxPlacement =
  | "right-start"
  | "bottom-start"
  | "bottom-end"
  | "bottom"
  /** @deprecated Use `bottom-start`. */
  | "left"
  /** @deprecated Use `bottom`. */
  | "center"
  /** @deprecated Use `bottom-end`. */
  | "right";

export type GlListboxOffset = number | {
  alignmentAxis?: number;
  crossAxis?: number;
  mainAxis?: number;
};

export type GlListboxPositioningStrategy = "absolute" | "fixed";

type ListboxPopupProps = Omit<
  BaseMenu.Popup.Props,
  | "aria-label"
  | "aria-labelledby"
  | "children"
  | "className"
  | "finalFocus"
  | "render"
  | "role"
  | "style"
>;

export type GlListboxContentProps = ListboxPopupProps & {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  children?: ReactNode;
  className?: string;
  fluidWidth?: boolean;
  infiniteScrollLoading?: boolean;
  loadingAnnouncement?: string;
  loadingMoreAnnouncement?: string;
  noResultsText?: ReactNode;
  offset?: GlListboxOffset;
  onBottomReached?: () => void;
  panelMatchTriggerWidth?: boolean;
  placement?: GlListboxPlacement;
  positioningStrategy?: GlListboxPositioningStrategy;
  resultsAnnouncement?: (count: number) => ReactNode;
  searching?: boolean;
  searchingAnnouncement?: string;
  style?: CSSProperties;
  totalItems?: number;
};

export type GlListboxHeaderProps = HTMLAttributes<HTMLDivElement>;
export type GlListboxFooterProps = HTMLAttributes<HTMLDivElement>;

export type GlListboxItemRenderState = {
  disabled: boolean;
  highlighted: boolean;
  selected: boolean;
};

type ListboxItemNativeProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | "aria-selected"
  | "children"
  | "className"
  | "disabled"
  | "onSelect"
  | "role"
  | "value"
>;

export type GlListboxItemProps = ListboxItemNativeProps & {
  checkCentered?: boolean;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  /** Overrides the text used by Base UI typeahead. */
  label?: string;
  nativeButton?: boolean;
  onSelect?: (details: GlListboxSelectionDetails) => void;
  render?: ReactElement | ((
    props: HTMLAttributes<HTMLElement>,
    state: GlListboxItemRenderState,
  ) => ReactElement);
  value: GlListboxValue;
};

type ListboxContextValue = {
  changeSelection(value: GlListboxValue, selected: boolean, event: Event): void;
  disabled: boolean;
  handle: BaseMenu.Handle<unknown>;
  isSelected(value: GlListboxValue): boolean;
  listboxId: string;
  loading: boolean;
  multiple: boolean;
  open: boolean;
  returnFocusRef: React.MutableRefObject<boolean>;
  rootElementRef: React.MutableRefObject<HTMLDivElement | null>;
  selection: GlListboxValue | GlListboxValue[];
  setPopupElement(element: HTMLDivElement | null): void;
  setTriggerElement(element: HTMLElement | null): void;
  state: boolean | null;
  triggerElementRef: React.MutableRefObject<HTMLElement | null>;
  triggerId: string;
  updateTriggerId(id: string): void;
};

const ListboxContext = createContext<ListboxContextValue | null>(null);

const rootVariants = cva(["gl-listbox", "gl-new-dropdown"]);

const triggerVariants = cva("gl-new-dropdown-toggle", {
  variants: {
    caretOnly: { false: null, true: "gl-new-dropdown-caret-only btn-icon" },
    iconOnly: { false: null, true: "gl-new-dropdown-icon-only btn-icon" },
    noCaret: { false: null, true: "gl-new-dropdown-toggle-no-caret" },
    state: { false: "is-invalid", null: null, true: "is-valid" },
  },
  defaultVariants: { caretOnly: false, iconOnly: false, noCaret: false, state: null },
});

const popupVariants = cva("gl-new-dropdown-panel", {
  variants: {
    fluidWidth: {
      false: "gl-new-dropdown-panel-fixed-width",
      true: "gl-new-dropdown-panel-fluid-width",
    },
    matchTriggerWidth: {
      false: null,
      true: "gl-new-dropdown-panel-match-trigger-width",
    },
  },
  defaultVariants: { fluidWidth: false, matchTriggerWidth: false },
});

const itemVariants = cva("gl-new-dropdown-item", {
  variants: {
    disabled: { false: null, true: "disabled" },
    highlighted: { false: null, true: "gl-new-dropdown-item-highlighted" },
  },
  defaultVariants: { disabled: false, highlighted: false },
});

function useListboxContext(componentName: string) {
  const context = useContext(ListboxContext);
  if(!context) throw new Error(`${componentName} must be used inside GlListbox.`);
  return context;
}

function valuesEqual(left: GlListboxValue, right: GlListboxValue) {
  return Object.is(left, right);
}

function mapChangeReason(reason: BaseMenu.Root.ChangeEventReason): GlListboxCloseReason {
  switch(reason) {
    case "trigger-focus":
    case "trigger-hover":
    case "trigger-press":
    case "list-navigation":
      return "trigger";
    case "outside-press":
    case "sibling-open":
      return "outside";
    case "escape-key":
      return "escape";
    case "item-press":
    case "close-press":
      return "item";
    case "focus-out":
      return "focus-out";
    default:
      return "imperative";
  }
}

function shouldRestoreFocus(reason: GlListboxCloseReason) {
  return reason === "escape" || reason === "item" || reason === "trigger";
}

export const GlListbox = forwardRef<GlListboxHandle, GlListboxProps>(
  function GlListbox(props, forwardedRef) {
    const {
      children,
      className,
      defaultValue,
      defaultOpen = false,
      disabled = false,
      loading = false,
      multiple = false,
      onBeforeClose,
      onHidden,
      onOpenChange,
      onShown,
      onValueChange,
      open: controlledOpen,
      state = null,
      value: controlledValue,
      ...rootProps
    } = props;
    const generatedTriggerId = useId();
    const generatedListboxId = useId();
    const defaultTriggerId = `gl-listbox-trigger-${generatedTriggerId}`;
    const listboxId = `gl-listbox-${generatedListboxId}`;
    const [triggerId, setTriggerId] = useState(defaultTriggerId);
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const [uncontrolledSelection, setUncontrolledSelection] = useState<
      GlListboxValue | GlListboxValue[]
    >(() => defaultValue ?? (multiple ? [] : null));
    const rootElementRef = useRef<HTMLDivElement>(null);
    const popupElementRef = useRef<HTMLDivElement | null>(null);
    const triggerElementRef = useRef<HTMLElement | null>(null);
    const returnFocusRef = useRef(false);
    const forceReturnFocusRef = useRef(false);
    const handle = useMemo(() => BaseMenu.createHandle<unknown>(), []);
    const effectiveOpen = controlledOpen ?? uncontrolledOpen;
    const selection = controlledValue === undefined
      ? uncontrolledSelection
      : controlledValue;

    const isSelected = useCallback((itemValue: GlListboxValue) => (
      multiple
        ? (selection as GlListboxValue[]).some((value) => valuesEqual(value, itemValue))
        : valuesEqual(selection as GlListboxValue, itemValue)
    ), [multiple, selection]);

    const changeSelection = useCallback((
      itemValue: GlListboxValue,
      selected: boolean,
      event: Event,
    ) => {
      const details = { event, itemValue, selected };
      if(multiple) {
        const current = selection as GlListboxValue[];
        const next = selected
          ? current.some((value) => valuesEqual(value, itemValue))
            ? current
            : [...current, itemValue]
          : current.filter((value) => !valuesEqual(value, itemValue));
        if(next === current || next.length === current.length) return;
        if(controlledValue === undefined) setUncontrolledSelection(next);
        (onValueChange as GlListboxMultipleProps["onValueChange"])?.(next, details);
        return;
      }

      if(!selected || valuesEqual(selection as GlListboxValue, itemValue)) return;
      if(controlledValue === undefined) setUncontrolledSelection(itemValue);
      (onValueChange as GlListboxSingleProps["onValueChange"])?.(itemValue, details);
    }, [controlledValue, multiple, onValueChange, selection]);

    const handleOpenChange = useCallback((
      nextOpen: boolean,
      details: BaseMenu.Root.ChangeEventDetails,
    ) => {
      const reason = mapChangeReason(details.reason);
      const publicDetails = { event: details.event, reason };
      if(!nextOpen) {
        let defaultPrevented = false;
        const beforeCloseDetails: GlListboxBeforeCloseDetails = {
          ...publicDetails,
          get defaultPrevented() { return defaultPrevented; },
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
        returnFocusRef.current = forceReturnFocusRef.current || shouldRestoreFocus(reason);
        forceReturnFocusRef.current = false;
      }
      if(controlledOpen === undefined) setUncontrolledOpen(nextOpen);
      onOpenChange?.(nextOpen, publicDetails);
    }, [controlledOpen, onBeforeClose, onOpenChange]);

    const handleOpenChangeComplete = useCallback((nextOpen: boolean) => {
      if(nextOpen) onShown?.();
      else {
        if(returnFocusRef.current) triggerElementRef.current?.focus();
        onHidden?.();
        forceReturnFocusRef.current = false;
      }
    }, [onHidden, onShown]);

    const openListbox = useCallback(() => {
      returnFocusRef.current = false;
      forceReturnFocusRef.current = false;
      handle.open(triggerId);
    }, [handle, triggerId]);
    const closeListbox = useCallback(() => {
      returnFocusRef.current = false;
      forceReturnFocusRef.current = false;
      handle.close();
    }, [handle]);
    const closeListboxAndFocus = useCallback(() => {
      forceReturnFocusRef.current = true;
      handle.close();
      window.setTimeout(() => {
        requestAnimationFrame(() => {
          const trigger = triggerElementRef.current;
          if(trigger?.getAttribute("aria-expanded") !== "true") trigger?.focus();
        });
      });
    }, [handle]);
    const containsElement = useCallback((element: Element | null) => Boolean(
      element && (
        rootElementRef.current?.contains(element)
        || popupElementRef.current?.contains(element)
      )
    ), []);

    useImperativeHandle(forwardedRef, () => ({
      close: closeListbox,
      closeAndFocus: closeListboxAndFocus,
      containsElement,
      open: openListbox,
    }), [closeListbox, closeListboxAndFocus, containsElement, openListbox]);

    const contextValue = useMemo<ListboxContextValue>(() => ({
      changeSelection,
      disabled,
      handle,
      isSelected,
      listboxId,
      loading,
      multiple,
      open: effectiveOpen,
      returnFocusRef,
      rootElementRef,
      selection,
      setPopupElement(element) { popupElementRef.current = element; },
      setTriggerElement(element) { triggerElementRef.current = element; },
      state,
      triggerElementRef,
      triggerId,
      updateTriggerId: setTriggerId,
    }), [
      changeSelection,
      disabled,
      effectiveOpen,
      handle,
      isSelected,
      listboxId,
      loading,
      multiple,
      selection,
      state,
      triggerId,
    ]);

    return (
      <ListboxContext.Provider value={contextValue}>
        <BaseMenu.Root
          defaultOpen={defaultOpen}
          defaultTriggerId={defaultTriggerId}
          disabled={disabled || loading}
          handle={handle}
          highlightItemOnHover={false}
          loopFocus
          modal={false}
          onOpenChange={handleOpenChange}
          onOpenChangeComplete={handleOpenChangeComplete}
          open={controlledOpen}
          triggerId={triggerId}>
          <div
            {...rootProps}
            ref={rootElementRef}
            className={rootVariants({ className })}>
            {children}
          </div>
        </BaseMenu.Root>
      </ListboxContext.Provider>
    );
  },
);

export const GlListboxTrigger = forwardRef<HTMLElement, GlListboxTriggerProps>(
  function GlListboxTrigger({
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    block = false,
    category = "primary",
    children,
    className,
    disabled = false,
    icon,
    id,
    nativeButton,
    noCaret = false,
    onKeyDown,
    render,
    size = "medium",
    textSrOnly = false,
    variant = "default",
    ...triggerProps
  }, forwardedRef) {
    const context = useListboxContext("GlListboxTrigger");
    const actualId = id ?? context.triggerId;
    const hasText = Children.toArray(children).length > 0;
    const iconOnly = Boolean(icon) && (!hasText || textSrOnly);
    const caretOnly = !noCaret && !icon && (!hasText || textSrOnly);
    const mergedRef = useMergedRefs(forwardedRef, context.setTriggerElement);
    const environment = typeof process === "undefined" ? undefined : process.env.NODE_ENV;

    useEffect(() => { context.updateTriggerId(actualId); }, [actualId, context]);

    if(environment !== "production" && ariaLabel && ariaLabelledBy) {
      console.warn(
        "[GlListboxTrigger] Do not provide both `aria-label` and `aria-labelledby`. "
        + "`aria-labelledby` takes precedence.",
      );
    }
    if(environment !== "production" && !render && !hasText && !ariaLabel && !ariaLabelledBy) {
      console.warn(
        "[GlListboxTrigger] Icon-only triggers require accessible text, `aria-label`, "
        + "or `aria-labelledby`.",
      );
    }

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
        disabled={disabled || context.disabled}
        icon={icon}
        loading={context.loading}
        size={size}
        variant={variant} />
    );

    return (
      <BaseMenu.Trigger
        {...triggerProps}
        ref={mergedRef}
        aria-controls={context.listboxId}
        aria-haspopup="listbox"
        aria-invalid={context.state === false || undefined}
        aria-label={ariaLabelledBy ? undefined : ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={triggerVariants({
          caretOnly,
          className,
          iconOnly,
          noCaret,
          state: context.state,
        })}
        disabled={disabled || context.disabled || context.loading}
        handle={context.handle}
        id={actualId}
        nativeButton={render ? nativeButton : true}
        onKeyDown={handleKeyDown}
        render={triggerRender}>
        {render ? children : defaultContent}
      </BaseMenu.Trigger>
    );
  },
);

type ResolvedPlacement = {
  align: BaseMenu.Positioner.Props["align"];
  side: BaseMenu.Positioner.Props["side"];
};

/** @internal Exported for focused adapter tests, not from the package entry point. */
export function resolveListboxPlacement(placement: GlListboxPlacement): ResolvedPlacement {
  switch(placement) {
    case "right-start": return { align: "start", side: "right" };
    case "bottom-end":
    case "right": return { align: "end", side: "bottom" };
    case "bottom":
    case "center": return { align: "center", side: "bottom" };
    default: return { align: "start", side: "bottom" };
  }
}

type ResolvedOffset = {
  alignOffset: BaseMenu.Positioner.Props["alignOffset"];
  sideOffset: BaseMenu.Positioner.Props["sideOffset"];
};

/** @internal Exported for focused adapter tests, not from the package entry point. */
export function resolveListboxOffset(offset: GlListboxOffset): ResolvedOffset {
  if(typeof offset === "number") return { alignOffset: 0, sideOffset: offset };
  const { alignmentAxis, crossAxis = 0, mainAxis = 0 } = offset;
  return {
    alignOffset: alignmentAxis === undefined
      ? crossAxis
      : ({ align }) => align === "end" ? -alignmentAxis : alignmentAxis,
    sideOffset: mainAxis,
  };
}

export const GlListboxHeader = forwardRef<HTMLDivElement, GlListboxHeaderProps>(
  function GlListboxHeader({ children, className, ...elementProps }, forwardedRef) {
    return (
      <div
        {...elementProps}
        ref={forwardedRef}
        className={clsx("gl-new-dropdown-header", className)}>
        <div className="gl-new-dropdown-header-content">{children}</div>
      </div>
    );
  },
);

export const GlListboxFooter = forwardRef<HTMLDivElement, GlListboxFooterProps>(
  function GlListboxFooter({ className, ...elementProps }, forwardedRef) {
    return (
      <div
        {...elementProps}
        ref={forwardedRef}
        className={clsx("gl-new-dropdown-footer", className)} />
    );
  },
);

type ListboxContentChildren = {
  body: ReactNode[];
  footer: ReactElement<GlListboxFooterProps> | null;
  header: ReactElement<GlListboxHeaderProps> | null;
  search: ReactElement<GlListboxSearchInputProps> | null;
};

function resolveListboxContentChildren(children: ReactNode): ListboxContentChildren {
  const result: ListboxContentChildren = {
    body: [],
    footer: null,
    header: null,
    search: null,
  };

  const visit = (child: ReactNode) => {
    if(child === null || child === undefined || typeof child === "boolean") return;
    if(isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      Children.forEach(child.props.children, visit);
      return;
    }
    if(isValidElement<GlListboxHeaderProps>(child) && child.type === GlListboxHeader) {
      if(result.header) throw new Error("GlListboxContent accepts only one GlListboxHeader.");
      result.header = child;
      return;
    }
    if(isValidElement<GlListboxSearchInputProps>(child) && child.type === GlListboxSearchInput) {
      if(result.search) throw new Error("GlListboxContent accepts only one GlListboxSearchInput.");
      result.search = child;
      return;
    }
    if(isValidElement<GlListboxFooterProps>(child) && child.type === GlListboxFooter) {
      if(result.footer) throw new Error("GlListboxContent accepts only one GlListboxFooter.");
      result.footer = child;
      return;
    }
    result.body.push(child);
  };

  Children.forEach(children, visit);
  return result;
}

function compareDomOrder(left: RegisteredListboxItem, right: RegisteredListboxItem) {
  if(!left.element || !right.element || left.element === right.element) return 0;
  return left.element.compareDocumentPosition(right.element) & Node.DOCUMENT_POSITION_FOLLOWING
    ? -1
    : 1;
}

function renderSemanticRadioGroup(props: HTMLAttributes<HTMLDivElement>) {
  const semanticProps = { ...props };
  delete semanticProps.role;
  return <div {...semanticProps} />;
}

export const GlListboxContent = forwardRef<HTMLDivElement, GlListboxContentProps>(
  function GlListboxContent({
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    children,
    className,
    fluidWidth = false,
    infiniteScrollLoading = false,
    loadingAnnouncement = "Loading items",
    loadingMoreAnnouncement = "Loading more items",
    noResultsText = "No results found",
    offset = 8,
    onBottomReached,
    onKeyDown,
    panelMatchTriggerWidth = false,
    placement = "bottom-start",
    positioningStrategy = "absolute",
    resultsAnnouncement = (count) => `${count} ${count === 1 ? "result" : "results"}`,
    searching = false,
    searchingAnnouncement = "Searching",
    style,
    totalItems,
    ...popupProps
  }, forwardedRef) {
    const context = useListboxContext("GlListboxContent");
    const registryRef = useRef(new Map<string, RegisteredListboxItem>());
    const [registryVersion, setRegistryVersion] = useState(0);
    const [settledRegistryVersion, setSettledRegistryVersion] = useState<number | null>(null);
    const [activeItemId, setActiveItemId] = useState<string | null>(null);
    const [arrowPadding, setArrowPadding] = useState(5);
    const [nonScrollableHeight, setNonScrollableHeight] = useState(0);
    const [popupElement, setPopupElement] = useState<HTMLDivElement | null>(null);
    const generatedSearchInputId = useId();
    const defaultSearchInputId = `gl-listbox-search-${generatedSearchInputId}`;
    const [registeredSearchInputId, setRegisteredSearchInputId] = useState<string | null>(null);
    const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
    const [searchInputElement, setSearchInputElement] = useState<HTMLInputElement | null>(null);
    const [searchValue, setSearchValue] = useState("");
    const [showBottomScrim, setShowBottomScrim] = useState(false);
    const [showTopScrim, setShowTopScrim] = useState(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const bottomReachedRef = useRef(false);
    const focusedForCurrentOpenRef = useRef(false);
    const typeaheadRef = useRef({ timeout: 0, value: "" });
    const popupRef = useMergedRefs(
      forwardedRef,
      context.setPopupElement,
      setPopupElement,
    );
    const resolvedPlacement = resolveListboxPlacement(placement);
    const resolvedOffset = resolveListboxOffset(offset);
    const contentChildren = resolveListboxContentChildren(children);
    const hasHeader = contentChildren.header !== null;
    const searchable = contentChildren.search !== null;
    const busy = context.loading || searching || infiniteScrollLoading;
    const environment = typeof process === "undefined" ? undefined : process.env.NODE_ENV;

    if(environment !== "production" && fluidWidth && panelMatchTriggerWidth) {
      console.warn(
        "[GlListboxContent] `panelMatchTriggerWidth` and `fluidWidth` cannot be used "
        + "together. `panelMatchTriggerWidth` takes precedence.",
      );
    }

    const getOrderedItems = useCallback(() => (
      [...registryRef.current.values()].sort(compareDomOrder)
    ), []);
    const registerItem = useCallback((item: RegisteredListboxItem) => {
      registryRef.current.set(item.key, item);
      setRegistryVersion((version) => version + 1);
    }, []);
    const unregisterItem = useCallback((key: string) => {
      if(registryRef.current.delete(key)) setRegistryVersion((version) => version + 1);
    }, []);
    const getItemPosition = useCallback((key: string) => {
      const position = getOrderedItems().findIndex((item) => item.key === key);
      return position < 0 ? undefined : position + 1;
    }, [getOrderedItems]);

    const scrollActiveItemIntoView = useCallback((id: string | null) => {
      if(!id || !scrollElement) return;
      const item = registryRef.current.size
        ? [...registryRef.current.values()].find((entry) => entry.id === id)?.element
        : null;
      item?.scrollIntoView({ block: "nearest" });
    }, [scrollElement]);
    const setActiveItem = useCallback((item: RegisteredListboxItem | undefined) => {
      const nextId = item?.id ?? null;
      setActiveItemId(nextId);
      scrollActiveItemIntoView(nextId);
    }, [scrollActiveItemIntoView]);

    const updateSearchValue = useCallback((nextValue: string) => {
      setSearchValue(nextValue);
      if(nextValue) setActiveItem(getOrderedItems().find((item) => !item.disabled));
      else setActiveItemId(null);
    }, [getOrderedItems, setActiveItem]);

    useEffect(() => {
      if(!context.open) {
        setActiveItemId(null);
        focusedForCurrentOpenRef.current = false;
        return;
      }
      if(focusedForCurrentOpenRef.current) return;
      if(searchable && !searchInputElement) return;
      if(!searchable && registryRef.current.size === 0) return;
      const frame = requestAnimationFrame(() => {
        focusedForCurrentOpenRef.current = true;
        const items = getOrderedItems();
        if(searchable) {
          searchInputElement?.focus();
          if(searchValue) setActiveItem(items.find((item) => !item.disabled));
          return;
        }
        const selectedItem = items.find((item) => (
          !item.disabled && context.isSelected(item.value)
        ));
        (selectedItem ?? items.find((item) => !item.disabled))?.element?.focus();
      });
      return () => cancelAnimationFrame(frame);
    }, [
      context,
      context.isSelected,
      context.open,
      getOrderedItems,
      registryVersion,
      searchable,
      searchInputElement,
      searchValue,
      setActiveItem,
    ]);

    useEffect(() => {
      if(!searchable || !searchValue || !context.open) return;
      setActiveItem(getOrderedItems().find((item) => !item.disabled));
    }, [context.open, getOrderedItems, registryVersion, searchable, searchValue, setActiveItem]);

    useEffect(() => {
      if(!context.open) {
        setSettledRegistryVersion(null);
        return;
      }
      const frame = requestAnimationFrame(() => setSettledRegistryVersion(registryVersion));
      return () => cancelAnimationFrame(frame);
    }, [context.open, registryVersion]);

    useEffect(() => () => {
      window.clearTimeout(typeaheadRef.current.timeout);
    }, []);

    const updateScrims = useCallback(() => {
      if(!scrollElement) return;
      setShowTopScrim(scrollElement.scrollTop > 0);
      setShowBottomScrim(
        Math.ceil(scrollElement.scrollTop + scrollElement.clientHeight)
          < scrollElement.scrollHeight,
      );
    }, [scrollElement]);
    const updateContentMeasurements = useCallback(() => {
      if(!scrollElement) return;
      const innerElement = scrollElement.parentElement;
      const measuredHeight = innerElement
        ? Math.max(0, innerElement.getBoundingClientRect().height
          - scrollElement.getBoundingClientRect().height)
        : 0;
      setNonScrollableHeight((current) => (
        Math.abs(current - measuredHeight) < 0.5 ? current : measuredHeight
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
      const updateArrowPadding = () => setArrowPadding(
        triggerElement.getBoundingClientRect().width
          > popupElement.getBoundingClientRect().width ? 24 : 5,
      );
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

    useEffect(() => {
      bottomReachedRef.current = false;
    }, [infiniteScrollLoading, registryVersion, searching]);

    useEffect(() => {
      const sentinel = sentinelRef.current;
      if(!sentinel || !scrollElement || !onBottomReached || busy) return;
      if(typeof IntersectionObserver === "undefined") return;
      const observer = new IntersectionObserver((entries) => {
        if(entries.some((entry) => entry.isIntersecting) && !bottomReachedRef.current) {
          bottomReachedRef.current = true;
          onBottomReached();
        }
      }, { root: scrollElement, rootMargin: "8px", threshold: 1 });
      observer.observe(sentinel);
      return () => observer.disconnect();
    }, [busy, onBottomReached, scrollElement]);

    const handleScroll = useCallback(() => {
      updateScrims();
      if(
        typeof IntersectionObserver !== "undefined"
        || !onBottomReached
        || busy
        || !scrollElement
        || bottomReachedRef.current
      ) return;
      if(scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight <= 8) {
        bottomReachedRef.current = true;
        onBottomReached();
      }
    }, [busy, onBottomReached, scrollElement, updateScrims]);

    const handleSearchKeyDown = useCallback((event: ReactKeyboardEvent<HTMLInputElement>) => {
      const items = getOrderedItems().filter((item) => !item.disabled);
      if(items.length === 0) return;
      const currentIndex = items.findIndex((item) => item.id === activeItemId);
      let next: RegisteredListboxItem | undefined;
      if(event.key === "ArrowDown") {
        next = items[(currentIndex + 1 + items.length) % items.length];
      } else if(event.key === "ArrowUp") {
        next = currentIndex < 0
          ? items.at(-1)
          : items[(currentIndex - 1 + items.length) % items.length];
      } else if(event.key === "Home") {
        next = items[0];
      } else if(event.key === "End") {
        next = items.at(-1);
      } else if(event.key === "Enter" && currentIndex >= 0) {
        event.preventDefault();
        event.stopPropagation();
        items[currentIndex]?.element?.click();
        return;
      } else {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setActiveItem(next);
    }, [activeItemId, getOrderedItems, setActiveItem]);

    const handleListboxKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event as Parameters<NonNullable<BaseMenu.Popup.Props["onKeyDown"]>>[0]);
      if(event.defaultPrevented) {
        event.stopPropagation();
        return;
      }
      if(searchable) return;
      const items = getOrderedItems().filter((item) => !item.disabled && item.element);
      if(items.length === 0) return;
      const currentIndex = items.findIndex((item) => item.element === document.activeElement);
      let next: RegisteredListboxItem | undefined;
      if(event.key === "ArrowDown") {
        next = items[(currentIndex + 1 + items.length) % items.length];
      } else if(event.key === "ArrowUp") {
        next = items[(currentIndex - 1 + items.length) % items.length];
      } else if(event.key === "Home") {
        next = items[0];
      } else if(event.key === "End") {
        next = items.at(-1);
      } else if(
        event.key.length === 1
        && !event.altKey
        && !event.ctrlKey
        && !event.metaKey
      ) {
        const character = event.key.toLocaleLowerCase();
        const previousValue = typeaheadRef.current.value;
        const repeated = previousValue.length > 0
          && [...previousValue].every((value) => value === character);
        const query = repeated ? character : previousValue + character;
        const ordered = [
          ...items.slice(currentIndex + 1),
          ...items.slice(0, currentIndex + 1),
        ];
        next = ordered.find((item) => (
          item.label || item.element?.textContent || ""
        ).trim().toLocaleLowerCase().startsWith(query));
        typeaheadRef.current.value = query;
        window.clearTimeout(typeaheadRef.current.timeout);
        typeaheadRef.current.timeout = window.setTimeout(() => {
          typeaheadRef.current.value = "";
        }, 500);
      } else {
        return;
      }
      if(!next?.element) return;
      event.preventDefault();
      event.stopPropagation();
      (event as Parameters<NonNullable<BaseMenu.Popup.Props["onKeyDown"]>>[0])
        .preventBaseUIHandler();
      next.element.focus();
    }, [getOrderedItems, onKeyDown, searchable]);

    const contentContext = useMemo<ListboxContentContextValue>(() => ({
      activeItemId,
      getItemPosition,
      hasHeader,
      handleSearchKeyDown,
      listboxId: context.listboxId,
      open: context.open,
      registryVersion,
      registerItem,
      searchable,
      searchInputId: defaultSearchInputId,
      setActiveItemId,
      setSearchInputId: setRegisteredSearchInputId,
      setSearchInputElement,
      setSearchValue: updateSearchValue,
      totalItems,
      unregisterItem,
    }), [
      activeItemId,
      context.open,
      context.listboxId,
      getItemPosition,
      handleSearchKeyDown,
      hasHeader,
      registerItem,
      registryVersion,
      searchable,
      defaultSearchInputId,
      totalItems,
      unregisterItem,
      updateSearchValue,
    ]);

    const itemCount = registryRef.current.size;
    const itemRegistrationSettled = context.open && settledRegistryVersion === registryVersion;
    const listItems = context.multiple ? contentChildren.body : (
      <BaseMenu.RadioGroup
        className="gl-listbox-radio-group"
        disabled={context.disabled || context.loading}
        onValueChange={(nextValue, details) => {
          context.changeSelection(nextValue as GlListboxValue, true, details.event);
        }}
        render={renderSemanticRadioGroup}
        value={context.selection as GlListboxValue}>
        {contentChildren.body}
      </BaseMenu.RadioGroup>
    );
    const showStandaloneLoadingAnnouncement = context.loading
      && !searching
      && !infiniteScrollLoading
      && itemCount > 0;
    const popupRender: NonNullable<BaseMenu.Popup.Props["render"]> = (renderProps) => {
      const semanticProps = { ...renderProps };
      delete semanticProps.role;
      return <div {...semanticProps} />;
    };
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
          className={popupVariants({
            className,
            fluidWidth: panelMatchTriggerWidth ? false : fluidWidth,
            matchTriggerWidth: panelMatchTriggerWidth,
          })}
          finalFocus={() => context.returnFocusRef.current
            ? context.triggerElementRef.current
            : false}
          render={popupRender}
          style={style}>
          <BaseMenu.Arrow className="gl-new-dropdown-arrow" />
          <ListboxContentContext.Provider value={contentContext}>
            <div className="gl-new-dropdown-inner gl-listbox-inner">
              {contentChildren.header}
              {contentChildren.search}
              {searching ? (
                <GlLoadingIcon
                  className="gl-listbox-search-loader"
                  data-testid="listbox-search-loader"
                  label={searchingAnnouncement}
                  size="md" />
              ) : (
                <div
                  ref={setScrollElement}
                  aria-busy={busy || undefined}
                  aria-label={ariaLabel}
                  aria-labelledby={ariaLabel ? undefined : (
                    ariaLabelledBy ?? (
                      searchable
                        ? registeredSearchInputId ?? defaultSearchInputId
                        : context.triggerId
                    )
                  )}
                  aria-multiselectable={context.multiple || undefined}
                  className={clsx(
                    "gl-new-dropdown-contents",
                    "gl-new-dropdown-contents-with-scrim-overlay",
                    "gl-listbox-options",
                    showTopScrim && "top-scrim-visible",
                    showBottomScrim && "bottom-scrim-visible",
                  )}
                  id={context.listboxId}
                  onKeyDown={handleListboxKeyDown}
                  onScroll={handleScroll}
                  role="listbox"
                  style={{
                    "--gl-new-dropdown-non-scroll-height": `${nonScrollableHeight}px`,
                  } as CSSProperties}
                  tabIndex={-1}>
                  <span aria-hidden className="top-scrim-wrapper" role="presentation">
                    <span className={clsx(
                      "top-scrim",
                      !hasHeader && !searchable ? "top-scrim-light" : "top-scrim-dark",
                    )} />
                  </span>
                  {listItems}
                  {infiniteScrollLoading ? (
                    <div className="gl-listbox-infinite-loader" role="presentation">
                      <GlLoadingIcon
                        data-testid="listbox-infinite-scroll-loader"
                        label={loadingMoreAnnouncement}
                        size="md" />
                    </div>
                  ) : null}
                  {onBottomReached ? (
                    <div
                      ref={sentinelRef}
                      aria-hidden
                      className="gl-listbox-infinite-sentinel"
                      role="presentation" />
                  ) : null}
                  <span aria-hidden className="bottom-scrim-wrapper" role="presentation">
                    <span className={clsx(
                      "bottom-scrim",
                      contentChildren.footer !== null && "gl-rounded-none",
                    )} />
                  </span>
                </div>
              )}
              {!searching && itemRegistrationSettled && itemCount === 0 ? (
                context.loading ? (
                  <GlLoadingIcon
                    className="gl-listbox-loading"
                    data-testid="listbox-loading"
                    label={loadingAnnouncement}
                    size="md" />
                ) : (
                  <div
                    aria-live="assertive"
                    className="gl-listbox-no-results"
                    data-testid="listbox-no-results-text">
                    {noResultsText}
                  </div>
                )
              ) : null}
              {searchable && !searching && itemCount > 0 ? (
                <span
                  aria-live="assertive"
                  className="gl-sr-only"
                  data-testid="listbox-number-of-results">
                  {resultsAnnouncement(itemCount)}
                </span>
              ) : null}
              {showStandaloneLoadingAnnouncement ? (
                <span
                  aria-live="polite"
                  className="gl-sr-only"
                  data-testid="listbox-loading-announcement">
                  {loadingAnnouncement}
                </span>
              ) : null}
              {contentChildren.footer}
            </div>
          </ListboxContentContext.Provider>
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    );

    return (
      <BaseMenu.Portal
        container={positioningStrategy === "absolute" ? context.rootElementRef : undefined}>
        {positionedPopup}
      </BaseMenu.Portal>
    );
  },
);

function renderCustomItem(
  render: GlListboxItemProps["render"],
  semanticProps: HTMLAttributes<HTMLElement>,
  state: GlListboxItemRenderState,
) {
  if(typeof render === "function") return render(semanticProps, state);
  if(isValidElement(render)) {
    const props = mergeProps<"button">(
      semanticProps as ButtonHTMLAttributes<HTMLButtonElement>,
      render.props as ButtonHTMLAttributes<HTMLButtonElement>,
    );
    props.ref = (semanticProps as { ref?: Ref<HTMLElement> }).ref as Ref<HTMLButtonElement>;
    return cloneElement(render, props);
  }
  return <button {...semanticProps as ButtonHTMLAttributes<HTMLButtonElement>} type="button" />;
}

export const GlListboxItem = forwardRef<HTMLElement, GlListboxItemProps>(
  function GlListboxItem({
    checkCentered = false,
    children,
    className,
    disabled = false,
    id,
    label,
    nativeButton,
    onClick,
    onSelect,
    render,
    value,
    ...itemProps
  }, forwardedRef) {
    const context = useListboxContext("GlListboxItem");
    const contentContext = useContext(ListboxContentContext);
    const insideGroup = useContext(ListboxGroupContext);
    if(!insideGroup) throw new Error("GlListboxItem must be used inside GlListboxGroup.");
    if(!contentContext) throw new Error("GlListboxItem must be used inside GlListboxContent.");
    const { registerItem, unregisterItem } = contentContext;
    const generatedId = useId();
    const key = useId();
    const actualId = id ?? `gl-listbox-item-${generatedId}`;
    const [element, setElement] = useState<HTMLElement | null>(null);
    const mergedRef = useMergedRefs(forwardedRef, setElement);
    const selected = context.isSelected(value);
    const highlighted = contentContext.searchable
      && contentContext.activeItemId === actualId;
    const actualLabel = label ?? (typeof children === "string" ? children : "");
    const position = contentContext.getItemPosition(key);

    useEffect(() => {
      registerItem({
        disabled: disabled || context.disabled || context.loading,
        element,
        id: actualId,
        key,
        label: actualLabel,
        value,
      });
      return () => unregisterItem(key);
    }, [
      actualId,
      actualLabel,
      context.disabled,
      context.loading,
      disabled,
      element,
      key,
      registerItem,
      unregisterItem,
      value,
    ]);

    const handleClick = useCallback((event: ReactMouseEvent<HTMLElement>) => {
      onClick?.(event as ReactMouseEvent<HTMLButtonElement>);
      if(event.defaultPrevented) {
        (event as Parameters<NonNullable<BaseMenu.CheckboxItem.Props["onClick"]>>[0])
          .preventBaseUIHandler();
        return;
      }
      if(disabled || context.disabled || context.loading) return;
      const nextSelected = context.multiple ? !selected : true;
      if(context.multiple || !selected) {
        onSelect?.({ event: event.nativeEvent, itemValue: value, selected: nextSelected });
      }
    }, [
      context.disabled,
      context.loading,
      context.multiple,
      disabled,
      onClick,
      onSelect,
      selected,
      value,
    ]);
    const semanticRender = useCallback((
      baseProps: HTMLAttributes<HTMLElement>,
      baseState: { disabled: boolean; highlighted: boolean; checked: boolean },
    ) => {
      const rest = { ...baseProps };
      delete rest["aria-checked"];
      delete rest.role;
      return renderCustomItem(render, {
        ...rest,
        "aria-disabled": disabled || context.disabled || context.loading || undefined,
        "aria-posinset": contentContext.totalItems === undefined ? undefined : position,
        "aria-selected": selected,
        "aria-setsize": contentContext.totalItems,
        id: actualId,
        role: "option",
      }, {
        disabled: baseState.disabled,
        highlighted: highlighted || baseState.highlighted,
        selected,
      });
    }, [
      actualId,
      contentContext.totalItems,
      context.disabled,
      context.loading,
      disabled,
      highlighted,
      position,
      render,
      selected,
    ]);
    const commonProps = {
      ...itemProps,
      ref: mergedRef,
      className: itemVariants({ className, disabled, highlighted }),
      closeOnClick: !context.multiple,
      disabled: disabled || context.disabled || context.loading,
      label,
      nativeButton: render ? nativeButton : true,
      onClick: handleClick,
      render: semanticRender,
    };
    const content = (
      <span className="gl-new-dropdown-item-content">
        <GlIcon
          aria-hidden
          className={clsx(
            "gl-new-dropdown-item-check-icon",
            !selected && "gl-invisible",
            !checkCentered && "gl-mt-3 gl-self-start",
          )}
          data-testid="dropdown-item-checkbox"
          name="check" />
        <span className="gl-new-dropdown-item-text-wrapper">{children}</span>
      </span>
    );

    if(context.multiple) {
      return (
        <BaseMenu.CheckboxItem
          {...commonProps as unknown as BaseMenu.CheckboxItem.Props}
          checked={selected}
          onCheckedChange={(checked, details) => {
            context.changeSelection(value, checked, details.event);
          }}>
          {content}
        </BaseMenu.CheckboxItem>
      );
    }
    return (
      <BaseMenu.RadioItem
        {...commonProps as unknown as BaseMenu.RadioItem.Props}
        value={value}>
        {content}
      </BaseMenu.RadioItem>
    );
  },
);

export default GlListbox;
