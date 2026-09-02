/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/form/form_textarea/form_textarea.vue
 *
 * Adaptations:
 * - Vue's `v-model` maps to the controlled `value` / `onInput` pair. The
 *   upstream `update`, native `change`, `blur`, `focus`, and `submit` events
 *   map to `onUpdate`, `onChange`, `onBlur`, `onFocus`, and `onSubmit`.
 * - The two character-count scoped slots map to the
 *   `remainingCharacterCountText` and `characterCountOverLimitText` value
 *   props. The component does not accept `children`.
 * - Native React names are used for `readOnly` and `autoComplete`.
 * - `useId` supplies SSR-safe textarea and character-count IDs instead of
 *   upstream's post-mount `uniqueId` calls.
 * - The forwarded ref exposes the underlying `<textarea>` and all of its
 *   focus, selection, range-text, and validity methods.
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
  type KeyboardEventHandler,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { cva } from "class-variance-authority";
import clsx, { type ClassValue } from "clsx";
import GlFormCharacterCount from "../form-character-count/form-character-count";
import { normalizeAriaInvalid } from "../../internal/form/aria-invalid-utils";
import { mergeRefs } from "../../internal/utils/merge-refs";
import { observeVisibility } from "./visible";

export type GlFormTextareaSize = "lg" | "sm";

export type GlFormTextareaFormatter = (
  value: string,
  event: Event | ChangeEvent<HTMLTextAreaElement> | FocusEvent<HTMLTextAreaElement>,
) => string | false;

type NativeTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  | "aria-invalid"
  | "autoFocus"
  | "children"
  | "className"
  | "dangerouslySetInnerHTML"
  | "defaultValue"
  | "disabled"
  | "form"
  | "id"
  | "name"
  | "onBlur"
  | "onChange"
  | "onFocus"
  | "onInput"
  | "onKeyUp"
  | "placeholder"
  | "readOnly"
  | "required"
  | "rows"
  | "style"
  | "value"
>;

export type GlFormTextareaProps = NativeTextareaProps & {
  /** Optional value for the `aria-invalid` attribute. */
  ariaInvalid?: boolean | string;
  /** Attempts to focus the textarea on mount when it is visible. */
  autofocus?: boolean;
  /** Browser autocomplete hint. */
  autoComplete?: string;
  /** Maximum character count used to display the associated character counter. */
  characterCountLimit?: number | null;
  /** Internationalized text displayed when the value exceeds `characterCountLimit`. */
  characterCountOverLimitText?: ReactNode;
  /** This component has no unnamed content slot. */
  children?: never;
  /** Additional class name merged onto the native textarea. */
  className?: string;
  /** Debounces the model update (`onInput`) by this many milliseconds. */
  debounce?: number | string;
  /** Disables the native textarea. */
  disabled?: boolean;
  /** Formats values produced by input, change, and blur interactions. */
  formatter?: GlFormTextareaFormatter;
  /** ID of the form associated with the textarea. */
  form?: string;
  /** ID of the textarea. A fallback is generated when omitted. */
  id?: string;
  /** Maximum visible rows. A value above `rows` enables automatic height. */
  maxRows?: number | string;
  /** Native form-control name. */
  name?: string;
  /** Prevents manual resizing. Automatic-height mode always prevents it. */
  noResize?: boolean;
  /** Called with the formatted value on the native `change` event. */
  onChange?: (value: string) => void;
  /** Called with the native blur event. */
  onBlur?: FocusEventHandler<HTMLTextAreaElement>;
  /** Called with the native focus event. */
  onFocus?: FocusEventHandler<HTMLTextAreaElement>;
  /** The model event, called with the formatted value after any debounce. */
  onInput?: (value: string) => void;
  /** Called for native keyup events in addition to submit-key handling. */
  onKeyUp?: KeyboardEventHandler<HTMLTextAreaElement>;
  /** Called when Ctrl+Enter or Cmd+Enter is released and `submitOnEnter` is enabled. */
  onSubmit?: () => void;
  /** Called immediately on every accepted input event with its formatted value. */
  onUpdate?: (value: string) => void;
  /** Native placeholder text. */
  placeholder?: string;
  /** Sets the native readonly state. */
  readOnly?: boolean;
  /** Internationalized text displayed while the value is within `characterCountLimit`. */
  remainingCharacterCountText?: ReactNode;
  /** Sets the native required state and `aria-required`. */
  required?: boolean;
  /** Minimum visible rows; coerced to an integer of at least 2. */
  rows?: number | string;
  /** Bootstrap-compatible visual size class. */
  size?: GlFormTextareaSize;
  /** Validation appearance: valid, invalid, or neutral. */
  state?: boolean | null;
  /** Native inline styles merged before component-owned resize and auto-height styles. */
  style?: CSSProperties;
  /** Enables Ctrl/Cmd+Enter submission. */
  submitOnEnter?: boolean;
  /** Additional clsx-compatible classes applied to the native textarea. */
  textareaClasses?: ClassValue;
  /** Current textarea value. */
  value?: string | null;
};

const textareaVariants = cva(["gl-form-input", "gl-form-textarea", "form-control"], {
  variants: {
    size: {
      lg: "form-control-lg",
      sm: "form-control-sm",
    },
    state: {
      invalid: "is-invalid",
      neutral: null,
      valid: "is-valid",
    },
  },
});

function toInteger(value: number | string | undefined): number {
  const numericValue = Number(value);
  if(Number.isNaN(numericValue)) return 0;
  if(numericValue === Number.POSITIVE_INFINITY) return Number.MAX_VALUE;
  if(numericValue === Number.NEGATIVE_INFINITY) return -Number.MAX_VALUE;
  return Math.trunc(numericValue);
}

function toStringValue(value: string | null | undefined): string {
  return value ?? "";
}

function isVisible(element: HTMLTextAreaElement | null): element is HTMLTextAreaElement {
  if(!element?.parentNode || !document.body.contains(element)) return false;
  if(getComputedStyle(element).display === "none") return false;

  const rect = element.getBoundingClientRect();
  return rect.height > 0 && rect.width > 0;
}

function computeHeight(
  element: HTMLTextAreaElement | null,
  minRows: number,
  maxRows: number,
): string | null {
  if(!isVisible(element)) return null;

  const computedStyle = getComputedStyle(element);
  const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 1;
  const border = (Number.parseFloat(computedStyle.borderTopWidth) || 0)
    + (Number.parseFloat(computedStyle.borderBottomWidth) || 0);
  const padding = (Number.parseFloat(computedStyle.paddingTop) || 0)
    + (Number.parseFloat(computedStyle.paddingBottom) || 0);
  const offset = border + padding;
  const minHeight = lineHeight * minRows + offset;

  const oldHeight = element.style.height || computedStyle.height;
  element.style.height = "auto";
  const { scrollHeight } = element;
  element.style.height = oldHeight;

  const contentRows = Math.max((scrollHeight - padding) / lineHeight, 2);
  const rows = Math.min(Math.max(contentRows, minRows), maxRows);
  const height = Math.max(Math.ceil(rows * lineHeight + offset), minHeight);

  return `${height}px`;
}

const GlFormTextarea = forwardRef<HTMLTextAreaElement, GlFormTextareaProps>(
  function GlFormTextarea({
    "aria-describedby": ariaDescribedBy,
    ariaInvalid = false,
    autofocus = false,
    autoComplete,
    characterCountLimit = null,
    characterCountOverLimitText,
    className,
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
    onFocus,
    onInput,
    onKeyUp,
    onSubmit,
    onUpdate,
    placeholder,
    readOnly = false,
    remainingCharacterCountText,
    required = false,
    rows = 4,
    size,
    state = null,
    style,
    submitOnEnter = false,
    textareaClasses,
    value = "",
    ...elementProps
  }, forwardedRef) {
    const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const textareaId = id || `gl-form-textarea-${generatedId}`;
    const characterCountTextId = `form-textarea-character-count-${generatedId}`;
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const modelValueRef = useRef<string | null>(value);
    const [localValue, setLocalValue] = useState(() => toStringValue(value));
    const [heightInPx, setHeightInPx] = useState<string | null>(null);

    const computedState = typeof state === "boolean" ? state : null;
    const computedMinRows = Math.max(toInteger(rows), 2);
    const computedMaxRows = Math.max(computedMinRows, toInteger(maxRows));
    const computedRows = computedMinRows === computedMaxRows ? computedMinRows : undefined;
    const isAutoHeight = computedRows === undefined;
    const showCharacterCount = characterCountLimit !== null;

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
      return formatter ? formatter(newValue, event) : newValue;
    }

    function updateValue(newValue: string, force = false) {
      clearDebounce();

      const doUpdate = () => {
        if(newValue !== modelValueRef.current) {
          modelValueRef.current = newValue;
          onInput?.(newValue);
        } else if(formatter) {
          const textarea = textareaRef.current;
          if(textarea && newValue !== textarea.value) {
            textarea.value = newValue;
          }
        }
      };

      const computedDebounce = Math.max(toInteger(debounce), 0);
      if(computedDebounce > 0 && !force) {
        debounceTimerRef.current = setTimeout(doUpdate, computedDebounce);
      } else {
        doUpdate();
      }
    }

    const [previousValue, setPreviousValue] = useState(value);
    if(!Object.is(previousValue, value)) {
      setPreviousValue(value);
      const stringifiedValue = toStringValue(value);
      if(stringifiedValue !== localValue || value !== modelValueRef.current) {
        clearDebounce();
        setLocalValue(stringifiedValue);
        modelValueRef.current = value;
      }
    }

    const scheduleHeight = useCallback(() => {
      if(animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      if(!isAutoHeight) {
        animationFrameRef.current = null;
        setHeightInPx(null);
        return;
      }

      animationFrameRef.current = window.requestAnimationFrame(() => {
        animationFrameRef.current = null;
        setHeightInPx(computeHeight(textareaRef.current, computedMinRows, computedMaxRows));
      });
    }, [computedMaxRows, computedMinRows, isAutoHeight]);

    useEffect(() => {
      scheduleHeight();
    }, [localValue, scheduleHeight]);

    useEffect(() => {
      const textarea = textareaRef.current;
      if(!textarea) return undefined;
      return observeVisibility(textarea, scheduleHeight);
    }, [scheduleHeight, showCharacterCount]);

    useEffect(() => {
      const textarea = textareaRef.current;
      if(!textarea) return undefined;

      const handleChange = (event: Event) => {
        const target = event.target as HTMLTextAreaElement;
        const formattedValue = formatValue(target.value, event);
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

    useEffect(() => {
      if(!autofocus) return undefined;

      const frame = window.requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if(isVisible(textarea) && !textarea.disabled) {
          textarea.focus();
        }
      });
      return () => window.cancelAnimationFrame(frame);
      // Upstream only responds to the initial mount/activation.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => () => {
      clearDebounce();
      if(animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    }, []);

    function handleInput(event: ChangeEvent<HTMLTextAreaElement>) {
      const formattedValue = formatValue(event.target.value, event);
      if(formattedValue === false || event.defaultPrevented) {
        event.preventDefault();
        return;
      }
      setLocalValue(formattedValue);
      updateValue(formattedValue);
      onUpdate?.(formattedValue);
    }

    function handleBlur(event: FocusEvent<HTMLTextAreaElement>) {
      const formattedValue = formatValue(event.target.value, event);
      if(formattedValue !== false) {
        setLocalValue(formattedValue);
        updateValue(formattedValue, true);
      }
      onBlur?.(event);
    }

    function handleKeyUp(event: KeyboardEvent<HTMLTextAreaElement>) {
      onKeyUp?.(event);
      if(submitOnEnter && event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        onSubmit?.();
      }
    }

    const textareaClassName = textareaVariants({
      className: clsx(textareaClasses, className) || undefined,
      size,
      state: computedState === true ? "valid" : computedState === false ? "invalid" : "neutral",
    });
    const textareaStyle: CSSProperties | undefined = style || noResize || isAutoHeight
      ? {
          ...style,
          ...(noResize || isAutoHeight ? { resize: "none" } : {}),
          ...(isAutoHeight ? {
            ...(heightInPx ? { height: heightInPx } : {}),
            overflowY: "scroll",
          } : {}),
        }
      : undefined;
    const computedAriaInvalid = normalizeAriaInvalid(ariaInvalid, computedState);

    const textarea = (
      <textarea
        {...elementProps}
        ref={mergeRefs(textareaRef, forwardedRef)}
        aria-describedby={showCharacterCount ? characterCountTextId : ariaDescribedBy}
        aria-invalid={computedAriaInvalid}
        aria-required={required ? true : undefined}
        autoComplete={autoComplete || undefined}
        className={textareaClassName}
        disabled={disabled}
        form={form || undefined}
        id={textareaId}
        name={name || undefined}
        onBlur={handleBlur}
        onChange={handleInput}
        onFocus={onFocus}
        onKeyUp={handleKeyUp}
        placeholder={placeholder || undefined}
        readOnly={readOnly}
        required={required}
        rows={computedRows}
        style={textareaStyle}
        value={localValue} />
    );

    if(!showCharacterCount) return textarea;

    return (
      <div>
        {textarea}
        <GlFormCharacterCount
          countTextId={characterCountTextId}
          limit={characterCountLimit}
          overLimitText={characterCountOverLimitText ?? null}
          remainingCountText={remainingCharacterCountText ?? null}
          value={value} />
      </div>
    );
  },
);

export default GlFormTextarea;
