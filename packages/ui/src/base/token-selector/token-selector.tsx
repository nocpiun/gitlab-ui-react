/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/token_selector/token_selector.vue
 */

import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEventHandler,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type KeyboardEventHandler,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import { clsx } from "cn";
import { useMergedRefs } from "../../internal/utils/merge-refs";
import TokenContainer from "./token-container";
import TokenSelectorDropdown from "./token-selector-dropdown";
import { getAvailableItems, getBoundedIndex, idsAreEqual, itemLabel } from "./token-selector-helpers";

export type GlTokenSelectorItemId = string | number;

export interface GlTokenSelectorItem {
  id: GlTokenSelectorItemId;
  name?: string;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}

export interface GlTokenSelectorRenderState {
  highlighted: boolean;
  inputValue: string;
}

type ControlledInputProp =
  | "aria-activedescendant"
  | "aria-autocomplete"
  | "aria-controls"
  | "aria-expanded"
  | "aria-invalid"
  | "aria-label"
  | "aria-labelledby"
  | "autoComplete"
  | "defaultValue"
  | "disabled"
  | "id"
  | "onBlur"
  | "onChange"
  | "onClick"
  | "onFocus"
  | "onInput"
  | "onKeyDown"
  | "placeholder"
  | "readOnly"
  | "role"
  | "value";

export type GlTokenSelectorInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  ControlledInputProp
> & {
  [attribute: `data-${string}`]: string | number | boolean | null | undefined;
};

export type GlTokenSelectorProps = {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  allowClearAll?: boolean;
  /** Allows a non-empty input to be added when no provided candidates remain. */
  allowUserDefinedTokens?: boolean;
  autoComplete?: string;
  className?: string;
  defaultValue?: readonly GlTokenSelectorItem[];
  dropdownFooter?: ReactNode;
  emptyPlaceholder?: ReactNode;
  hideDropdownWithNoItems?: boolean;
  id?: string;
  inputProps?: GlTokenSelectorInputProps;
  items?: readonly GlTokenSelectorItem[];
  loading?: boolean;
  loadingContent?: ReactNode;
  menuClassName?: string;
  noResultsContent?: ReactNode;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onInputValueChange?: (inputValue: string) => void;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  onTokenAdd?: (item: GlTokenSelectorItem) => void;
  onTokenRemove?: (item: GlTokenSelectorItem) => void;
  onValueChange?: (value: GlTokenSelectorItem[]) => void;
  placeholder?: string;
  renderDropdownItem?: (
    item: GlTokenSelectorItem,
    state: GlTokenSelectorRenderState,
  ) => ReactNode;
  renderToken?: (item: GlTokenSelectorItem) => ReactNode;
  renderUserDefinedToken?: (
    inputValue: string,
    item: GlTokenSelectorItem,
    state: GlTokenSelectorRenderState,
  ) => ReactNode;
  /** Offers the user-defined option even while provided candidates remain. */
  showAddNewAlways?: boolean;
  state?: boolean | null;
  value?: readonly GlTokenSelectorItem[];
  viewOnly?: boolean;
};

type BaseUiKeyboardEvent = KeyboardEvent<HTMLInputElement> & {
  preventBaseUIHandler?: () => void;
};

const inputClassName = [
  "gl-token-selector-input",
  "gl-h-auto",
  "gl-w-4/10",
  "gl-grow",
  "gl-border-none",
  "gl-bg-transparent",
  "gl-font-regular",
  "gl-text-base",
  "gl-leading-normal",
  "gl-text-default",
  "gl-outline-none",
].join(" ");

const containerClassName = [
  "gl-token-selector",
  "gl-form-input",
  "gl-form-input-not-readonly",
  "form-control",
  "gl-flex",
  "!gl-cursor-text",
  "gl-items-center",
  "!gl-px-3",
  "!gl-py-2",
].join(" ");

const GlTokenSelector = forwardRef<HTMLInputElement, GlTokenSelectorProps>(function GlTokenSelector({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  allowClearAll = false,
  allowUserDefinedTokens = false,
  autoComplete = "off",
  className,
  defaultValue = [],
  dropdownFooter,
  emptyPlaceholder,
  hideDropdownWithNoItems = false,
  id,
  inputProps,
  items = [],
  loading = false,
  loadingContent = "Searching...",
  menuClassName,
  noResultsContent = "No matches found",
  onBlur,
  onFocus,
  onInputValueChange,
  onKeyDown,
  onTokenAdd,
  onTokenRemove,
  onValueChange,
  placeholder,
  renderDropdownItem,
  renderToken,
  renderUserDefinedToken,
  showAddNewAlways = false,
  state = null,
  value,
  viewOnly = false,
}, forwardedRef) {
  const reactId = useId();
  const componentId = `token-selector-${reactId.replace(/:/g, "")}`;
  const listboxId = `${componentId}-listbox`;
  const internalInputRef = useRef<HTMLInputElement>(null);
  const portalContainerRef = useRef<HTMLDivElement>(null);
  const mergedInputRef = useMergedRefs(internalInputRef, forwardedRef);
  const warnedAboutLabel = useRef(false);
  const warnedAboutConflictingLabels = useRef(false);
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState<GlTokenSelectorItem[]>(() => [
    ...defaultValue,
  ]);
  const selectedItems = isControlled ? value : uncontrolledValue;
  const [inputValue, setInputValue] = useState("");
  const [inputRevision, setInputRevision] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeItemFocusVisible, setActiveItemFocusVisible] = useState(false);
  const [focusedTokenIndex, setFocusedTokenIndex] = useState<number | null>(null);
  const availableItems = useMemo(
    () => getAvailableItems(items, selectedItems),
    [items, selectedItems],
  );
  const canAddUserDefined = allowUserDefinedTokens
    && inputValue !== ""
    && (showAddNewAlways || availableItems.length === 0);
  const userDefinedItem = useMemo<GlTokenSelectorItem | null>(() => (
    canAddUserDefined
      ? { id: `${componentId}-user-defined-${inputRevision}`, name: inputValue }
      : null
  ), [canAddUserDefined, componentId, inputRevision, inputValue]);
  const dropdownItems = useMemo(
    () => userDefinedItem ? [...availableItems, userDefinedItem] : availableItems,
    [availableItems, userDefinedItem],
  );
  const hideDropdown = !userDefinedItem
    && hideDropdownWithNoItems
    && availableItems.length === 0;
  const activeItem = dropdownItems[activeIndex];

  const commitValue = useCallback((nextValue: GlTokenSelectorItem[]) => {
    if(!isControlled) setUncontrolledValue(nextValue);
    onValueChange?.(nextValue);
  }, [isControlled, onValueChange]);

  const updateInputValue = useCallback((nextValue: string) => {
    if(nextValue === inputValue) return;

    setInputValue(nextValue);
    setInputRevision((revision) => revision + 1);
    setActiveIndex(0);
    onInputValueChange?.(nextValue);
  }, [inputValue, onInputValueChange]);

  const focusInput = useCallback(() => {
    setFocusedTokenIndex(null);
    internalInputRef.current?.focus();
  }, []);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setActiveIndex(0);
    setActiveItemFocusVisible(false);
  }, []);

  const openDropdown = useCallback(() => {
    if(!hideDropdown && !viewOnly) setOpen(true);
  }, [hideDropdown, viewOnly]);

  const addToken = useCallback((item: GlTokenSelectorItem) => {
    commitValue([...selectedItems, item]);
    closeDropdown();
    onTokenAdd?.(item);
    updateInputValue("");
    focusInput();
  }, [closeDropdown, commitValue, focusInput, onTokenAdd, selectedItems, updateInputValue]);

  const removeToken = useCallback((item: GlTokenSelectorItem) => {
    commitValue(selectedItems.filter((selectedItem) => !idsAreEqual(selectedItem.id, item.id)));
    onTokenRemove?.(item);
  }, [commitValue, onTokenRemove, selectedItems]);

  useEffect(() => {
    // This intentionally runs after rendering so consumers can update `items` in
    // response to onInputValueChange before the visibility decision is made.
    if(hideDropdown || viewOnly) {
      closeDropdown();
    } else if(inputValue !== "") {
      setOpen(true);
    }
  }, [closeDropdown, hideDropdown, inputValue, items, viewOnly]);

  useEffect(() => {
    setActiveIndex((index) => getBoundedIndex(index, dropdownItems.length));
  }, [dropdownItems.length]);

  useLayoutEffect(() => {
    if(!open || !activeItem) return;

    const option = document.getElementById(`${listboxId}-dropdown-item-${activeIndex}`);
    option?.scrollIntoView?.({ block: "nearest", inline: "end" });
  }, [activeIndex, activeItem, listboxId, open]);

  useEffect(() => {
    const environment = typeof process === "undefined" ? undefined : process.env.NODE_ENV;
    if(environment === "production") return;

    if(ariaLabelledby && ariaLabel && !warnedAboutConflictingLabels.current) {
      warnedAboutConflictingLabels.current = true;
      console.warn(
        "GlTokenSelector received both aria-labelledby and aria-label; aria-labelledby takes precedence.",
      );
    }

    const hasNativeLabel = Boolean(internalInputRef.current?.labels?.length);
    if(!ariaLabelledby && !ariaLabel && !hasNativeLabel && !warnedAboutLabel.current) {
      warnedAboutLabel.current = true;
      console.warn(
        "GlTokenSelector needs an accessible label. Provide an id with a matching <label>, aria-labelledby, or aria-label.",
      );
    }
  }, [ariaLabel, ariaLabelledby, id]);

  const handleInputKeyDown = (event: BaseUiKeyboardEvent) => {
    const itemCount = dropdownItems.length;
    let handled = false;

    switch(event.key) {
      case "ArrowUp":
        handled = true;
        setActiveItemFocusVisible(true);
        if(open && itemCount > 0) setActiveIndex((index) => Math.max(index - 1, 0));
        break;
      case "ArrowDown":
        handled = true;
        setActiveItemFocusVisible(true);
        if(!open) {
          openDropdown();
        } else if(itemCount > 0) {
          setActiveIndex((index) => Math.min(index + 1, itemCount - 1));
        }
        break;
      case "Home":
        handled = true;
        setActiveItemFocusVisible(true);
        if(itemCount > 0) setActiveIndex(0);
        break;
      case "End":
        handled = true;
        setActiveItemFocusVisible(true);
        if(itemCount > 0) setActiveIndex(itemCount - 1);
        break;
      case "Enter":
        if(open && activeItem) {
          handled = true;
          addToken(activeItem);
        }
        break;
      case "Escape":
        handled = true;
        updateInputValue("");
        closeDropdown();
        break;
      case "Backspace":
      case "Delete":
        if(inputValue === "" && selectedItems.length > 0) {
          handled = true;
          internalInputRef.current?.blur();
          setFocusedTokenIndex(selectedItems.length - 1);
        }
        break;
      default:
        break;
    }

    if(handled) {
      event.preventDefault();
      event.preventBaseUIHandler?.();
    }
    event.stopPropagation();
    onKeyDown?.(event);
  };

  const handleContainerClick: MouseEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as Element;
    if(target.closest(".gl-token") || inputFocused) return;
    focusInput();
  };

  const handleInputFocus: FocusEventHandler<HTMLInputElement> = (event) => {
    setInputFocused(true);
    setFocusedTokenIndex(null);
    openDropdown();
    onFocus?.(event);
  };

  const handleInputBlur: FocusEventHandler<HTMLInputElement> = (event) => {
    setInputFocused(false);
    const relatedTarget = event.relatedTarget as Element | null;
    if(!relatedTarget?.closest(".gl-new-dropdown-item")) closeDropdown();
    onBlur?.(event);
  };

  const handleRootOpenChange = (
    nextOpen: boolean,
    details: BaseCombobox.Root.ChangeEventDetails,
  ) => {
    if(details.reason === "input-change") return;
    setOpen(nextOpen && !hideDropdown && !viewOnly);
  };

  const {
    className: customInputClassName,
    style: customInputStyle,
    ...nativeInputProps
  } = inputProps ?? {};
  const selectorClasses = clsx(
    containerClassName,
    inputFocused && "gl-token-selector-focus-glow",
    viewOnly && "gl-token-selector-view-only",
    state === true && "is-valid",
    state === false && "is-invalid",
    className,
  );
  const activeDescendant = open && activeItem
    ? `${listboxId}-dropdown-item-${activeIndex}`
    : undefined;

  return (
    <BaseCombobox.Root<GlTokenSelectorItem>
      autoHighlight={false}
      autoComplete={autoComplete}
      filteredItems={dropdownItems}
      highlightItemOnHover={false}
      inputValue={inputValue}
      itemToStringLabel={itemLabel}
      items={dropdownItems}
      loopFocus={false}
      id={componentId}
      onInputValueChange={(nextValue) => updateInputValue(nextValue)}
      onOpenChange={handleRootOpenChange}
      open={open}
      openOnInputClick={false}
      value={null}>
      <div ref={portalContainerRef}>
        <BaseCombobox.InputGroup
          className={selectorClasses}
          onClick={handleContainerClick}>
          <TokenContainer
            emptyPlaceholder={emptyPlaceholder}
            focusedTokenIndex={focusedTokenIndex}
            input={(
              <BaseCombobox.Input
                {...nativeInputProps}
                ref={mergedInputRef}
                aria-activedescendant={activeDescendant}
                aria-autocomplete="list"
                aria-controls={listboxId}
                aria-expanded={open}
                aria-invalid={state === false || undefined}
                aria-label={ariaLabelledby ? undefined : ariaLabel}
                aria-labelledby={ariaLabelledby}
                autoComplete={autoComplete}
                className={clsx(inputClassName, customInputClassName)}
                disabled={viewOnly}
                id={id}
                onBlur={handleInputBlur}
                onClick={() => {
                  if(inputFocused && inputValue === "" && !open) openDropdown();
                }}
                onFocus={handleInputFocus}
                onKeyDown={handleInputKeyDown}
                placeholder={placeholder}
                role="combobox"
                style={customInputStyle}
                type="text"
                value={inputValue} />
            )}
            onClearAll={() => {
              commitValue([]);
              focusInput();
            }}
            onFocusedTokenIndexChange={setFocusedTokenIndex}
            onRemove={removeToken}
            onReturnToInput={focusInput}
            renderToken={renderToken}
            showClearAll={allowClearAll && selectedItems.length > 0}
            showEmptyPlaceholder={selectedItems.length === 0 && !inputFocused}
            tokens={selectedItems}
            viewOnly={viewOnly} />
        </BaseCombobox.InputGroup>
        <TokenSelectorDropdown
          activeIndex={activeIndex}
          activeItemFocusVisible={activeItemFocusVisible}
          componentId={listboxId}
          dropdownFooter={dropdownFooter}
          inputValue={inputValue}
          items={availableItems}
          loading={loading}
          loadingContent={loadingContent}
          menuClassName={menuClassName}
          noResultsContent={noResultsContent}
          onSelect={addToken}
          portalContainer={portalContainerRef}
          renderDropdownItem={renderDropdownItem}
          renderUserDefinedToken={renderUserDefinedToken}
          userDefinedItem={userDefinedItem} />
      </div>
    </BaseCombobox.Root>
  );
});

export default GlTokenSelector;
