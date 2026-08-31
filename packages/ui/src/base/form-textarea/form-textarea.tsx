/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/form/form_textarea/form_textarea.vue
 * (with the IntersectionObserver-backed visibility directive from
 * form_textarea/visible.js)
 *
 * Adaptations:
 * - The `v-model` pair maps to a controlled `value` prop plus `onInput`
 *   (the model event, emitted per the `debounce` rules). The upstream
 *   `update`, `change`, `blur`, and `submit` events map to the `onUpdate`,
 *   `onChange`, `onBlur`, and `onSubmit` callbacks. `onChange` corresponds to
 *   the native `change` event, which React does not expose as a prop, so it
 *   is attached as a native listener.
 * - Upstream's `readonly` prop maps to the native `readOnly` attribute, and
 *   `ariaInvalid` maps to `aria-invalid`.
 * - The `remaining-character-count-text` and `character-count-over-limit-text`
 *   scoped slots map to the `remainingCountText` and `overLimitText` render
 *   props, each receiving the (absolute) character count.
 * - The fallback textarea ID and the character count text ID are generated
 *   with `useId` during render (SSR-safe) instead of upstream's post-mount
 *   `uniqueId`.
 * - The forwarded ref exposes the underlying `<textarea>` element, covering
 *   upstream's `focus`/`blur`/`select`/`setSelectionRange`/`setRangeText`/
 *   `setCustomValidity`/`checkValidity`/`reportValidity` methods.
 * - There is no Base UI primitive for `<textarea>`; a native element is
 *   rendered instead.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FocusEvent,
  type FocusEventHandler,
  type KeyboardEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { cva } from "class-variance-authority";
import GlFormCharacterCount from "../form-character-count/form-character-count";

export type GlFormTextareaSize = "sm" | "lg";

/** Additional CSS class(es); supports the shapes of Vue's class binding. */
export type GlFormTextareaClasses =
  | string
  | string[]
  | Record<string, boolean | null | undefined>
  | null
  | undefined;

export type GlFormTextareaFormatter = (
  value: string,
  event: Event | ChangeEvent<HTMLTextAreaElement> | FocusEvent<HTMLTextAreaElement>,
) => string | false;

type NativeTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  | "aria-invalid"
  | "autoFocus"
  | "className"
  | "defaultValue"
  | "onBlur"
  | "onChange"
  | "onInput"
  | "onSubmit"
  | "readOnly"
  | "rows"
  | "size"
  | "value"
>;

export type GlFormTextareaProps = NativeTextareaProps & {
  /** Value for the `aria-invalid` attribute. When unset, `state={false}` implies `"true"`. */
  ariaInvalid?: boolean | string;
  /** Attempts to focus the control on mount when visible. Does not set the `autofocus` attribute. */
  autofocus?: boolean;
  /** Max character count for the textarea. When set, the character count is rendered. */
  characterCountLimit?: number | null;
  /** Debounces the model update (`onInput`) by this many milliseconds. */
  debounce?: number | string;
  /** Formats the input value. Returning `false` cancels the update. */
  formatter?: GlFormTextareaFormatter;
  /** The maximum number of rows to show. When set and different from `rows`, enables auto-height. */
  maxRows?: number | string;
  /** When true, prevents the user from resizing the textarea (the default). */
  noResize?: boolean;
  /** Called with the native blur event. */
  onBlur?: FocusEventHandler<HTMLTextAreaElement>;
  /** Called with the formatted value on the native `change` event. */
  onChange?: (value: string) => void;
  /** The model event: called with the formatted value per the `debounce` rules. */
  onInput?: (value: string) => void;
  /** Emitted when Ctrl+Enter or Cmd+Enter is pressed and `submitOnEnter` is set. */
  onSubmit?: () => void;
  /** Called immediately on every keystroke with the formatted value. */
  onUpdate?: (value: string) => void;
  /** Internationalized over-limit text; receives the number of characters over the limit. */
  overLimitText?: (count: number) => ReactNode;
  /** Sets the `readonly` attribute on the control. */
  readOnly?: boolean;
  /** Internationalized remaining-count text; receives the number of remaining characters. */
  remainingCountText?: (count: number) => ReactNode;
  /** Number of visible text rows in the textarea (minimum 2). */
  rows?: number | string;
  /** The size of the component's appearance. Defaults to medium when omitted. */
  size?: GlFormTextareaSize;
  /** Validation state: `true` valid, `false` invalid, `null` none. */
  state?: boolean | null;
  /** Emits `onSubmit` when Ctrl+Enter or Cmd+Enter is pressed. */
  submitOnEnter?: boolean;
  /** Additional CSS class(es) to apply to the textarea element. */
  textareaClasses?: GlFormTextareaClasses;
  /** The current value of the textarea. */
  value?: string | null;
};

// lodash `toInteger` semantics for the supported prop types
function toInteger(value: number | string | null | undefined): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.trunc(numeric) : 0;
}

// lodash `toString` semantics for the supported value types
function toStringValue(value: string | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

// bootstrap-vue `toFloat` (packages/gitlab-ui/src/utils/number_utils.js)
function toFloat(value: string, defaultValue = NaN): number {
  const float = parseFloat(value);
  return Number.isNaN(float) ? defaultValue : float;
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

// IntersectionObserver-backed visibility observation, ported from
// form_textarea/visible.js. Calls the callback when the element enters the
// viewport (expanded by ROOT_MARGIN); the observer instance is shared.
const ROOT_MARGIN = "640px";

type VisibleCallback = () => void;

const visibleHandlers = new WeakMap<Element, VisibleCallback>();
let sharedObserver: IntersectionObserver | null = null;

function observeVisible(element: Element, callback: VisibleCallback): () => void {
  if(typeof IntersectionObserver === "undefined") {
    return () => {};
  }
  if(!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if(entry.isIntersecting) {
            visibleHandlers.get(entry.target)?.();
          }
        });
      },
      { rootMargin: ROOT_MARGIN },
    );
  }
  visibleHandlers.set(element, callback);
  sharedObserver.observe(element);
  return () => {
    visibleHandlers.delete(element);
    sharedObserver?.unobserve(element);
  };
}

const textareaVariants = cva("gl-form-input gl-form-textarea form-control", {
  variants: {
    size: {
      none: null,
      sm: "form-control-sm",
      lg: "form-control-lg",
    },
    state: {
      none: null,
      valid: "is-valid",
      invalid: "is-invalid",
    },
  },
});

const GlFormTextarea = forwardRef<HTMLTextAreaElement, GlFormTextareaProps>(
  function GlFormTextarea({
    ariaInvalid = false,
    autofocus = false,
    characterCountLimit = null,
    debounce = 0,
    disabled = false,
    formatter,
    form,
    id,
    maxRows,
    name,
    noResize = true,
    onBlur,
    onChange,
    onInput,
    onSubmit,
    onUpdate,
    overLimitText,
    placeholder,
    readOnly = false,
    remainingCountText,
    required = false,
    rows = 4,
    size,
    state = null,
    submitOnEnter = false,
    textareaClasses,
    value = "",
    ...elementProps
  }, forwardedRef) {
    const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const generatedCountId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingHeightFrameRef = useRef<number | null>(null);

    const computedState = typeof state === "boolean" ? state : null;
    const hasFormatter = typeof formatter === "function";
    const computedDebounce = Math.max(toInteger(debounce), 0);
    // Ensure rows is at least 2 and positive; a value of 1 can cause issues
    // in some browsers, and most browsers only support 2 as the smallest value.
    const computedMinRows = Math.max(toInteger(rows), 2);
    const computedMaxRows = Math.max(computedMinRows, toInteger(maxRows));
    // When auto-height is enabled (min !== max rows), the rows attribute is
    // omitted and CSS controls the height instead.
    const computedRows = computedMinRows === computedMaxRows ? computedMinRows : null;
    const showCharacterCount = characterCountLimit !== null;
    const characterCountTextId = `form-textarea-character-count-${generatedCountId}`;

    // `localValue` is the string rendered into the textarea; `modelValueRef`
    // tracks the last value emitted through `onInput` (upstream `vModelValue`).
    const [localValue, setLocalValue] = useState(() => toStringValue(value));
    const modelValueRef = useRef<string | null>(value);

    function clearDebounce() {
      if(debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    }

    function formatValue(
      newValue: string,
      event: Event | ChangeEvent<HTMLTextAreaElement> | FocusEvent<HTMLTextAreaElement>,
    ): string | false {
      const stringValue = toStringValue(newValue);
      return hasFormatter ? formatter(stringValue, event) : stringValue;
    }

    // Sync from the `value` prop, mirroring the upstream watcher: adjustments
    // during render keep the textarea in sync before paint, like Vue's
    // pre-render watcher.
    const [prevValue, setPrevValue] = useState(value);
    if(!Object.is(prevValue, value)) {
      setPrevValue(value);
      const stringified = toStringValue(value);
      if(stringified !== localValue || value !== modelValueRef.current) {
        // Clear any pending debounce timeout, as we are overwriting the user input
        clearDebounce();
        setLocalValue(stringified);
        modelValueRef.current = value;
      }
    }

    function updateValue(newValue: string, force = false) {
      // Make sure to always clear the debounce when `updateValue()` is called,
      // even when the model hasn't changed
      clearDebounce();
      const doUpdate = () => {
        if(newValue !== modelValueRef.current) {
          modelValueRef.current = newValue;
          onInput?.(newValue);
        } else if(hasFormatter) {
          // When the model value hasn't changed but the actual textarea value
          // is out of sync, reset it to the model value. Usually caused by
          // browser autocomplete or the formatter function.
          const textarea = textareaRef.current;
          if(textarea && newValue !== textarea.value) {
            textarea.value = newValue;
          }
        }
      };
      if(computedDebounce > 0 && !force) {
        debounceTimerRef.current = setTimeout(doUpdate, computedDebounce);
      } else {
        doUpdate();
      }
    }

    // React's `onChange` is the native `input` event (upstream `onInput`).
    function handleInput(event: ChangeEvent<HTMLTextAreaElement>) {
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

    // The native `change` event (upstream `onChange`), attached natively
    // because React maps `onChange` to the `input` event. The listener is
    // re-registered on every render so it always closes over the latest props.
    useEffect(() => {
      const textarea = textareaRef.current;
      if(!textarea) return undefined;

      const handleChange = (event: Event) => {
        const target = event.target as HTMLTextAreaElement;
        const formattedValue = formatValue(target.value, event);
        // Exit when the `formatter` function strictly returned `false`
        // or prevented the change event
        if(formattedValue === false || event.defaultPrevented) {
          event.preventDefault();
          return;
        }
        setLocalValue(formattedValue);
        updateValue(formattedValue, true);
        onChange?.(formattedValue);
      };

      textarea.addEventListener("change", handleChange);
      return () => textarea.removeEventListener("change", handleChange);
    });

    function handleBlur(event: FocusEvent<HTMLTextAreaElement>) {
      const formattedValue = formatValue(event.target.value, event);
      if(formattedValue !== false) {
        setLocalValue(toStringValue(formattedValue));
        updateValue(formattedValue, true);
      }
      onBlur?.(event);
    }

    function handleKeyUp(event: KeyboardEvent<HTMLTextAreaElement>) {
      if(submitOnEnter && event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        onSubmit?.();
      }
    }

    // --- Auto-height (upstream `setHeight`/`computeHeight`) ---

    const [heightInPx, setHeightInPx] = useState<string | null>(null);

    function computeHeight(): string | null {
      if(computedRows !== null) {
        return null;
      }
      const el = textareaRef.current;
      if(!el || !isVisible(el)) {
        return null;
      }
      const computedStyle = getComputedStyle(el);
      const lineHeight = toFloat(computedStyle.lineHeight, 1);
      const border =
        toFloat(computedStyle.borderTopWidth, 0) + toFloat(computedStyle.borderBottomWidth, 0);
      const padding =
        toFloat(computedStyle.paddingTop, 0) + toFloat(computedStyle.paddingBottom, 0);
      const offset = border + padding;
      const minHeight = lineHeight * computedMinRows + offset;

      const oldHeight = el.style.height || computedStyle.height;
      el.style.height = "auto";
      const { scrollHeight } = el;
      el.style.height = oldHeight;

      const contentRows = Math.max((scrollHeight - padding) / lineHeight, 2);
      const clampedRows = Math.min(Math.max(contentRows, computedMinRows), computedMaxRows);
      const height = Math.max(Math.ceil(clampedRows * lineHeight + offset), minHeight);

      return `${height}px`;
    }

    // Always points at the latest `setHeight` so the shared observer and
    // effects stay registered while calling into current props. Upstream
    // recomputes after `$nextTick` inside `requestAnimationFrame`.
    const setHeightRef = useRef<() => void>(() => {});
    setHeightRef.current = () => {
      if(pendingHeightFrameRef.current !== null) {
        window.cancelAnimationFrame(pendingHeightFrameRef.current);
      }
      pendingHeightFrameRef.current = window.requestAnimationFrame(() => {
        pendingHeightFrameRef.current = null;
        setHeightInPx(computeHeight());
      });
    };

    // Upstream `watch.localValue`: recompute the height when the rendered
    // value changes, and when the auto-height bounds change.
    useEffect(() => {
      setHeightRef.current();
    }, [localValue, computedRows, computedMinRows, computedMaxRows]);

    // Recompute the height when the textarea becomes visible (upstream
    // `v-gl-visible="setHeight"`). Keyed on the element so the observation
    // re-attaches when the textarea remounts, e.g. when `characterCountLimit`
    // toggles the wrapper.
    const [textareaEl, setTextareaEl] = useState<HTMLTextAreaElement | null>(null);
    useEffect(() => {
      if(!textareaEl) return undefined;
      return observeVisible(textareaEl, () => setHeightRef.current());
    }, [textareaEl]);

    const refCallback = useCallback(
      (element: HTMLTextAreaElement | null) => {
        textareaRef.current = element;
        setTextareaEl(element);
        if(typeof forwardedRef === "function") {
          forwardedRef(element);
        } else if(forwardedRef) {
          forwardedRef.current = element;
        }
      },
      [forwardedRef],
    );

    // Upstream `handleAutofocus`: focus on mount when `autofocus` is set and
    // the control is visible.
    useEffect(() => {
      if(!autofocus) return undefined;
      const frame = window.requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if(textarea && !textarea.disabled && isVisible(textarea)) {
          textarea.focus();
        }
      });
      return () => window.cancelAnimationFrame(frame);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Clear a pending debounce on unmount (upstream `beforeDestroy`).
    useEffect(() => clearDebounce, []);

    const computedAriaInvalid: TextareaHTMLAttributes<HTMLTextAreaElement>["aria-invalid"] =
      ariaInvalid === true || ariaInvalid === "true" || ariaInvalid === ""
        ? "true"
        : computedState === false
          ? "true"
          : ariaInvalid === false || ariaInvalid === undefined
            ? undefined
            : (ariaInvalid as "false" | "grammar" | "spelling" | "true");

    const computedClass = textareaVariants({
      className: textareaClasses,
      size: size ?? "none",
      state: computedState === true ? "valid" : computedState === false ? "invalid" : "none",
    });

    const computedStyle: CSSProperties = {
      // Disabling the resize handle when `noResize` is set or in auto-height mode
      resize: !computedRows || noResize ? "none" : undefined,
      ...(computedRows !== null
        ? {}
        : {
            // Only set the computed height when auto-height is enabled, and
            // always add a vertical scrollbar so the height calculation
            // returns a stable value.
            height: heightInPx ?? undefined,
            overflowY: "scroll" as const,
          }),
    };

    const { "aria-describedby": consumerDescribedBy, ...restElementProps } = elementProps;

    const textarea = (
      <textarea
        {...restElementProps}
        ref={refCallback}
        aria-describedby={showCharacterCount ? characterCountTextId : consumerDescribedBy}
        aria-invalid={computedAriaInvalid}
        aria-required={required ? true : undefined}
        className={computedClass}
        disabled={disabled}
        form={form}
        id={id ?? `gl-form-textarea-${generatedId}`}
        name={name}
        onBlur={handleBlur}
        onChange={handleInput}
        onKeyUp={handleKeyUp}
        placeholder={placeholder}
        readOnly={readOnly}
        required={required}
        rows={computedRows ?? undefined}
        style={computedStyle}
        value={localValue} />
    );

    if(!showCharacterCount) {
      return textarea;
    }

    return (
      <div>
        {textarea}
        <GlFormCharacterCount
          countTextId={characterCountTextId}
          limit={characterCountLimit}
          overLimitText={overLimitText ?? (() => null)}
          remainingCountText={remainingCountText ?? (() => null)}
          value={value} />
      </div>
    );
  },
);

export default GlFormTextarea;
