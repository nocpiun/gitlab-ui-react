/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/new_dropdowns/listbox/listbox_search_input.vue
 */

import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ChangeEventHandler,
  type InputHTMLAttributes,
  type KeyboardEventHandler,
  type MouseEventHandler,
} from "react";
import { clsx } from "cn";
import GlButton from "../button/button";
import GlIcon from "../icon/icon";
import { useMergedRefs } from "../../internal/utils/merge-refs";
import { ListboxContentContext } from "./listbox-contexts";

export type GlListboxSearchInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "children" | "defaultValue" | "onChange" | "type" | "value"
> & {
  clearLabel?: string;
  defaultValue?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onValueChange?: (value: string) => void;
  value?: string;
};

export const GlListboxSearchInput = forwardRef<
  HTMLInputElement,
  GlListboxSearchInputProps
>(function GlListboxSearchInput({
  "aria-label": ariaLabel,
  className,
  clearLabel = "Clear search",
  defaultValue = "",
  disabled,
  id,
  onChange,
  onKeyDown,
  onValueChange,
  placeholder = "Search",
  value,
  ...inputProps
}, forwardedRef) {
  const contentContext = useContext(ListboxContentContext);
  const setSearchInputId = contentContext?.setSearchInputId;
  const setSearchInputElement = contentContext?.setSearchInputElement;
  const setSearchValue = contentContext?.setSearchValue;
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null);
  const actualValue = isControlled ? value : uncontrolledValue;
  const actualId = id ?? contentContext?.searchInputId;
  const mergedRef = useMergedRefs(forwardedRef, setInputElement);

  useEffect(() => {
    setSearchInputElement?.(inputElement);
    return () => setSearchInputElement?.(null);
  }, [inputElement, setSearchInputElement]);

  useEffect(() => {
    if(!actualId) return;
    setSearchInputId?.(actualId);
    return () => setSearchInputId?.(null);
  }, [actualId, setSearchInputId]);

  useEffect(() => {
    setSearchValue?.(actualValue);
  }, [actualValue, setSearchValue]);

  // Leave the DOM value uncontrolled when `value` is omitted. After a native
  // form reset, mirror the browser-owned value into the derived search state.
  useEffect(() => {
    if(isControlled || !inputElement) return undefined;

    const syncValue = () => setUncontrolledValue(inputElement.value);
    syncValue();

    const associatedForm = inputElement.form;
    if(!associatedForm) return undefined;

    const handleReset = (event: Event) => {
      queueMicrotask(() => {
        if(!event.defaultPrevented) syncValue();
      });
    };
    associatedForm.addEventListener("reset", handleReset);
    return () => associatedForm.removeEventListener("reset", handleReset);
  }, [defaultValue, inputElement, inputProps.form, isControlled]);

  const changeValue = useCallback((nextValue: string) => {
    if(!isControlled) setUncontrolledValue(nextValue);
    setSearchValue?.(nextValue);
    onValueChange?.(nextValue);
  }, [isControlled, onValueChange, setSearchValue]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    onChange?.(event);
    if(!event.defaultPrevented) changeValue(event.currentTarget.value);
  };
  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    onKeyDown?.(event);
    if(event.defaultPrevented) {
      event.stopPropagation();
      return;
    }
    contentContext?.handleSearchKeyDown(event);
    if(!event.defaultPrevented && event.key.length === 1) {
      // Keep Base UI Menu's typeahead from consuming text intended for the input.
      event.stopPropagation();
    }
  };
  const handleClearMouseDown: MouseEventHandler<HTMLElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  const handleClear: MouseEventHandler<HTMLElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if(!isControlled && inputElement) inputElement.value = "";
    changeValue("");
    inputElement?.focus();
  };

  return (
    <div className="gl-listbox-search-container">
      <div className={clsx(
        "gl-listbox-search",
        !contentContext?.hasHeader && "gl-listbox-topmost",
      )}>
        <GlIcon
          aria-hidden
          className="gl-listbox-search-icon"
          name="search-sm"
          size={12} />
        <input
          {...inputProps}
          ref={mergedRef}
          aria-activedescendant={contentContext?.activeItemId ?? undefined}
          aria-controls={contentContext?.listboxId}
          aria-expanded={contentContext?.open}
          aria-haspopup="listbox"
          aria-label={ariaLabel ?? placeholder}
          className={clsx("gl-listbox-search-input", className)}
          disabled={disabled}
          defaultValue={isControlled ? undefined : defaultValue}
          id={actualId}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          type="search"
          value={isControlled ? actualValue : undefined} />
        {actualValue ? (
          <GlButton
            aria-label={clearLabel}
            category="tertiary"
            className="gl-listbox-search-clear-button"
            disabled={disabled}
            icon="close"
            onClick={handleClear}
            onMouseDown={handleClearMouseDown}
            size="small" />
        ) : null}
      </div>
    </div>
  );
});

export default GlListboxSearchInput;
