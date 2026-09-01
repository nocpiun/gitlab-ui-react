/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/form/form_input/form_input.vue
 *
 * Adaptations:
 * - The `v-model` pair maps to a controlled `value` prop plus `onInput`
 *   (the model event, emitted after `trim`/`number` modifiers according to
 *   the `debounce`/`lazy` rules). The upstream `update`, `change`, and `blur`
 *   events map to the `onUpdate`, `onChange`, and `onBlur` callbacks.
 *   `onChange` corresponds to the native `change` event, which React does not
 *   expose as a prop, so it is attached as a native listener.
 * - Upstream's `readonly` prop maps to the native `readOnly` attribute, and
 *   `ariaInvalid` maps to `aria-invalid`.
 * - The fallback input ID is generated with `useId` during render (SSR-safe)
 *   instead of upstream's post-mount `uniqueId`.
 * - The forwarded ref exposes the underlying `<input>` element, covering
 *   upstream's `focus`/`blur`/`select`/`setSelectionRange`/`setRangeText`/
 *   `setCustomValidity`/`checkValidity`/`reportValidity` methods.
 */

import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FocusEventHandler,
} from "react";
import { Input as BaseInput } from "@base-ui/react/input";
import { cva } from "class-variance-authority";
import { normalizeAriaInvalid } from "../../internal/form/aria-invalid-utils";
import { mergeRefs } from "../../internal/merge-refs";

export type GlFormInputType =
  | "text"
  | "password"
  | "email"
  | "number"
  | "url"
  | "tel"
  | "search"
  | "range"
  | "color"
  | "date"
  | "time"
  | "datetime"
  | "datetime-local"
  | "month"
  | "week";

export type GlFormInputWidth = "xs" | "sm" | "md" | "lg" | "xl";

/** Responsive widths: `default` for the base width, breakpoints for `gl-{breakpoint}-form-input-{width}`. */
export type GlFormInputResponsiveWidth = Partial<
  Record<"default" | "sm" | "md" | "lg" | "xl", GlFormInputWidth>
>;

export type GlFormInputValue = number | string;

export type GlFormInputFormatter = (
  value: string,
  event: Event | ChangeEvent<HTMLInputElement> | FocusEvent<HTMLInputElement>,
) => string | false;

type BaseInputProps = Omit<
  BaseInput.Props,
  | "aria-invalid"
  | "autoFocus"
  | "children"
  | "className"
  | "defaultValue"
  | "onBlur"
  | "onChange"
  | "onInput"
  | "onValueChange"
  | "readOnly"
  | "render"
  | "type"
  | "value"
  | "width"
>;

export type GlFormInputProps = BaseInputProps & {
  /** Value for the `aria-invalid` attribute. When unset, `state={false}` implies `"true"`. */
  ariaInvalid?: boolean | string;
  /** Attempts to focus the control on mount when visible. Does not set the `autofocus` attribute. */
  autofocus?: boolean;
  /** Additional CSS class(es) merged onto the input. */
  className?: string;
  /** Debounces the model update (`onInput`) by this many milliseconds. Has no effect when `lazy` is set. */
  debounce?: number | string;
  /** Formats the input value. Returning `false` cancels the update. */
  formatter?: GlFormInputFormatter;
  /** Updates the model on `change`/`blur` instead of on every keystroke (the `.lazy` modifier). */
  lazy?: boolean;
  /** Applies the `formatter` on blur instead of on each keystroke. */
  lazyFormatter?: boolean;
  /** Converts the model value to a native number when possible (the `.number` modifier). */
  number?: boolean;
  /** Called with the formatted value on the native `change` event. */
  onChange?: (value: string) => void;
  /** Called with the native blur event. */
  onBlur?: FocusEventHandler<HTMLInputElement>;
  /** The model event: called with the modified value per the `debounce`/`lazy` rules. */
  onInput?: (value: GlFormInputValue) => void;
  /** Called immediately on every keystroke with the formatted (unmodified) value. */
  onUpdate?: (value: string) => void;
  /** Renders the control as plain text (no borders) and forces `readOnly`. */
  plaintext?: boolean;
  /** Sets the `readonly` attribute on the control. */
  readOnly?: boolean;
  /** Validation state: `true` valid, `false` invalid, `null` none. */
  state?: boolean | null;
  /** Trims leading and trailing white space from the model value (the `.trim` modifier). */
  trim?: boolean;
  /** The type of input to render. Unsupported values fall back to `"text"`. */
  type?: GlFormInputType;
  /** The current value of the input. The model value is a string unless `number` is set. */
  value?: GlFormInputValue;
  /** Maximum width of the input, either fixed or responsive per breakpoint. */
  width?: GlFormInputWidth | GlFormInputResponsiveWidth | null;
};

// bootstrap-vue `toFloat` (packages/gitlab-ui/src/utils/number_utils.js)
function toFloat(value: string, defaultValue: GlFormInputValue = NaN): GlFormInputValue {
  const float = parseFloat(value);
  return Number.isNaN(float) ? defaultValue : float;
}

// lodash `toString` semantics for the supported value types
function toStringValue(value: GlFormInputValue | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

// bootstrap-vue `isVisible` (vendor/bootstrap-vue/src/utils/dom.js)
function isVisible(element: HTMLElement | null): boolean {
  if(!element || !element.parentNode || !document.body.contains(element)) {
    return false;
  }
  if(getComputedStyle(element).display === "none") {
    return false;
  }
  const rect = element.getBoundingClientRect();
  return Boolean(rect && rect.height > 0 && rect.width > 0);
}

function widthClasses(width: GlFormInputProps["width"]): string[] {
  if(width === null || width === undefined) {
    return [];
  }
  if(typeof width === "object") {
    const { default: defaultWidth, ...breakpointWidths } = width;
    return [
      ...(defaultWidth ? [`gl-form-input-${defaultWidth}`] : []),
      ...Object.entries(breakpointWidths).map(
        ([breakpoint, breakpointWidth]) => `gl-${breakpoint}-form-input-${breakpointWidth}`,
      ),
    ];
  }
  return [`gl-form-input-${width}`];
}

const inputVariants = cva("gl-form-input", {
  variants: {
    kind: {
      // `form-control` is not used by `type="range"` or `plaintext`, and is
      // always used by `type="color"`; `custom-range` is only for `range`.
      control: "form-control",
      plaintext: "form-control-plaintext",
      range: "custom-range",
    },
    state: {
      none: null,
      valid: "is-valid",
      invalid: "is-invalid",
    },
  },
});

const GlFormInput = forwardRef<HTMLInputElement, GlFormInputProps>(function GlFormInput({
  ariaInvalid = false,
  autofocus = false,
  className,
  debounce,
  disabled = false,
  form,
  formatter,
  id,
  lazy = false,
  lazyFormatter = false,
  list,
  max,
  min,
  name,
  number = false,
  onBlur,
  onChange,
  onInput,
  onUpdate,
  placeholder,
  plaintext = false,
  readOnly = false,
  required = false,
  state = null,
  step,
  trim = false,
  type = "text",
  value = "",
  width = null,
  ...elementProps
}, forwardedRef) {
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const localType: GlFormInputType = (() => {
    // We only allow certain types
    const allowed: GlFormInputType[] = [
      "text", "password", "email", "number", "url", "tel", "search", "range", "color",
      "date", "time", "datetime", "datetime-local", "month", "week",
    ];
    return allowed.includes(type) ? type : "text";
  })();

  const computedState = typeof state === "boolean" ? state : null;
  const hasFormatter = typeof formatter === "function";

  // `localValue` is the string rendered into the input; `modelValueRef` tracks
  // the last value emitted through `onInput` (the upstream `vModelValue`).
  const [localValue, setLocalValue] = useState(() => toStringValue(value));
  const modelValueRef = useRef<GlFormInputValue | null>(null);
  if(modelValueRef.current === null) {
    modelValueRef.current = modifyValue(value);
  }

  function modifyValue(newValue: GlFormInputValue): GlFormInputValue {
    let modified: GlFormInputValue = toStringValue(newValue);
    // Emulate the `.trim` modifier behaviour
    if(trim) {
      modified = modified.trim();
    }
    // Emulate the `.number` modifier behaviour
    if(number) {
      modified = toFloat(modified, modified);
    }
    return modified;
  }

  function clearDebounce() {
    if(debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }

  function formatValue(
    newValue: GlFormInputValue,
    event: Event | ChangeEvent<HTMLInputElement> | FocusEvent<HTMLInputElement>,
    force = false,
  ): string | false {
    if(hasFormatter && (!lazyFormatter || force)) {
      return formatter(toStringValue(newValue), event);
    }
    return toStringValue(newValue);
  }

  // Sync from the `value` prop, mirroring the upstream watcher: adjustments
  // during render keep the input in sync before paint, like Vue's pre-render
  // watcher.
  const [prevValue, setPrevValue] = useState(value);
  if(!Object.is(prevValue, value)) {
    setPrevValue(value);
    const stringified = toStringValue(value);
    const modified = modifyValue(value);
    if(stringified !== localValue || modified !== modelValueRef.current) {
      // Clear any pending debounce timeout, as we are overwriting the user input
      clearDebounce();
      setLocalValue(stringified);
      modelValueRef.current = modified;
    }
  }

  function updateValue(newValue: string, force = false) {
    if(lazy && !force) {
      return;
    }
    // Make sure to always clear the debounce when `updateValue()` is called,
    // even when the model hasn't changed
    clearDebounce();
    const doUpdate = () => {
      const modified = modifyValue(newValue);
      if(modified !== modelValueRef.current) {
        modelValueRef.current = modified;
        onInput?.(modified);
      } else if(hasFormatter) {
        // When the model value hasn't changed but the actual input value is
        // out of sync, make sure to reset it to the model value. Usually
        // caused by browser autocomplete and how it triggers the change or
        // input event, or depending on the formatter function.
        // https://github.com/bootstrap-vue/bootstrap-vue/issues/2657
        // https://github.com/bootstrap-vue/bootstrap-vue/issues/3498
        const input = inputRef.current;
        if(input && modified !== input.value) {
          input.value = toStringValue(modified);
        }
      }
    };
    // Ensure we have a positive integer equal to or greater than 0
    // (lodash `toInteger` semantics)
    const numericDebounce = Number(debounce);
    const computedDebounce = Number.isFinite(numericDebounce)
      ? Math.max(Math.trunc(numericDebounce), 0)
      : 0;
    // Only debounce the value update when a value greater than `0` is set and
    // we are not in lazy mode or this is a forced update
    if(computedDebounce > 0 && !lazy && !force) {
      debounceTimerRef.current = setTimeout(doUpdate, computedDebounce);
    } else {
      doUpdate();
    }
  }

  // React's `onChange` is the native `input` event (upstream `onInput`).
  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    const inputValue = event.target.value;
    const formattedValue = formatValue(inputValue, event);
    // Exit when the `formatter` function strictly returned `false`
    // or prevented the input event
    if(formattedValue === false || event.defaultPrevented) {
      event.preventDefault();
      return;
    }
    setLocalValue(formattedValue);
    updateValue(formattedValue);
    // The `input` and `update` events are swapped upstream, see
    // https://gitlab.com/gitlab-org/gitlab-ui/-/merge_requests/1628
    onUpdate?.(formattedValue);
  }

  // The native `change` event (upstream `onChange`), attached natively because
  // React maps `onChange` to the `input` event. The listener is re-registered
  // on every render so it always closes over the latest props.
  useEffect(() => {
    const input = inputRef.current;
    if(!input) return undefined;

    const handleChange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const formattedValue = formatValue(target.value, event);
      // Exit when the `formatter` function strictly returned `false`
      // or prevented the input event
      if(formattedValue === false || event.defaultPrevented) {
        event.preventDefault();
        return;
      }
      setLocalValue(formattedValue);
      updateValue(formattedValue, true);
      onChange?.(formattedValue);
    };

    input.addEventListener("change", handleChange);
    return () => input.removeEventListener("change", handleChange);
  });

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    // Apply the `localValue` on blur to prevent cursor jumps on mobile
    // browsers (e.g. caused by autocomplete)
    const formattedValue = formatValue(event.target.value, event, true);
    if(formattedValue !== false) {
      // We need to use the modified value here to apply the `.trim` and
      // `.number` modifiers properly
      setLocalValue(toStringValue(modifyValue(formattedValue)));
      // We pass the formatted value here since `updateValue` handles the
      // modifiers itself
      updateValue(formattedValue, true);
    }
    onBlur?.(event);
  }

  // Upstream `setWheelStopper`: a focused number input must not change its
  // value on wheel; the wheel event is cancelled and the input blurred.
  useEffect(() => {
    const input = inputRef.current;
    if(!input || localType !== "number") return undefined;

    const stopWheel = (event: WheelEvent) => {
      event.preventDefault();
      if(!input.disabled) {
        input.blur();
      }
    };
    const onWheelFocus = () => document.addEventListener("wheel", stopWheel, { passive: false });
    const onWheelBlur = () => document.removeEventListener("wheel", stopWheel);

    input.addEventListener("focus", onWheelFocus);
    input.addEventListener("blur", onWheelBlur);
    return () => {
      input.removeEventListener("focus", onWheelFocus);
      input.removeEventListener("blur", onWheelBlur);
      document.removeEventListener("wheel", stopWheel);
    };
  }, [localType]);

  // Upstream `handleAutofocus`: focus on mount when `autofocus` is set and the
  // control is visible.
  useEffect(() => {
    if(!autofocus) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const input = inputRef.current;
      if(input && !input.disabled && isVisible(input)) {
        input.focus();
      }
    });
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear a pending debounce on unmount (upstream `beforeDestroy`).
  useEffect(() => clearDebounce, []);

  const computedAriaInvalid = normalizeAriaInvalid(ariaInvalid, computedState);

  const isRange = localType === "range";
  const isColor = localType === "color";

  const computedClass = inputVariants({
    className: [...widthClasses(width), className].filter(Boolean).join(" ") || undefined,
    // `plaintext` is not supported by `type="range"` or `type="color"`
    kind: isRange ? "range" : plaintext && !isColor ? "plaintext" : "control",
    state: computedState === true ? "valid" : computedState === false ? "invalid" : "none",
  });

  return (
    <BaseInput
      {...elementProps}
      ref={mergeRefs(inputRef, forwardedRef)}
      aria-invalid={computedAriaInvalid}
      aria-required={required ? true : undefined}
      className={computedClass}
      disabled={disabled}
      form={form}
      id={id ?? `gl-form-input-${generatedId}`}
      list={localType !== "password" ? list : undefined}
      max={max}
      min={min}
      name={name}
      onBlur={handleBlur}
      onChange={handleInput}
      placeholder={placeholder}
      readOnly={readOnly || plaintext}
      required={required}
      step={step}
      type={localType}
      value={localValue} />
  );
});

export default GlFormInput;
