/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/form/form_date/form_date.vue
 *
 * Adaptations:
 * - The `v-model` pair maps to a controlled `value` prop plus `onChange`
 *   (the upstream model event, emitted with the date string on the native
 *   `change` event). The upstream `keydown`, `focus`, and `blur` events map
 *   to the `onKeyDown`, `onFocus`, and `onBlur` callbacks.
 * - Fallback IDs are generated with `useId` during render (SSR-safe) instead
 *   of upstream's post-mount `uniqueId`.
 * - `valueAsDate` is read from the underlying input element after commit
 *   (mount and `value` prop changes) and on `change`, replacing upstream's
 *   `$refs.input.$el.valueAsDate` reads.
 * - `aria-describedby` is omitted instead of rendering an empty-ish
 *   attribute when there is neither an output value nor invalid feedback.
 * - The forwarded ref exposes the underlying `<input>` element.
 */

import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEventHandler,
  type KeyboardEventHandler,
} from "react";
import GlFormInput, { type GlFormInputProps } from "../form-input/form-input";

type FormInputPassthroughProps = Omit<
  GlFormInputProps,
  | "aria-describedby"
  | "ariaInvalid"
  | "debounce"
  | "formatter"
  | "lazy"
  | "lazyFormatter"
  | "max"
  | "min"
  | "number"
  | "onBlur"
  | "onChange"
  | "onFocus"
  | "onInput"
  | "onKeyDown"
  | "onUpdate"
  | "pattern"
  | "placeholder"
  | "plaintext"
  | "state"
  | "trim"
  | "type"
  | "value"
  | "width"
>;

export type GlFormDateProps = FormInputPassthroughProps & {
  /** Unique identifier for the date input. A fallback is generated when omitted. */
  id?: string;
  /** Minimum allowed date value. */
  min?: string | null;
  /** Maximum allowed date value. */
  max?: string | null;
  /** Error message displayed when the value is below the minimum. */
  minInvalidFeedback?: string;
  /** Error message displayed when the value exceeds the maximum. */
  maxInvalidFeedback?: string;
  /** The current value of the date picker, as a `yyyy-mm-dd` string. */
  value?: string | null;
  /** The model event: called with the date string on the native `change` event. */
  onChange?: (value: string) => void;
  /** Called when a key is pressed inside the date input. */
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  /** Called when the date input receives focus. */
  onFocus?: FocusEventHandler<HTMLInputElement>;
  /** Called when the date input loses focus. */
  onBlur?: FocusEventHandler<HTMLInputElement>;
};

const GlFormDate = forwardRef<HTMLInputElement, GlFormDateProps>(function GlFormDate({
  id = null,
  min = null,
  max = null,
  minInvalidFeedback = "Must be after minimum date.",
  maxInvalidFeedback = "Must be before maximum date.",
  onBlur,
  onChange,
  onFocus,
  onKeyDown,
  value = null,
  ...inputProps
}, forwardedRef) {
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const inputId = id ?? `form-date-${generatedId}`;
  const invalidFeedbackId = `form-date-invalid-feedback-${generatedId}`;
  const outputId = `form-date-output-${generatedId}`;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [currentValue, setCurrentValue] = useState(value);
  const [valueAsDate, setValueAsDate] = useState<Date | null>(null);

  // Sync from the `value` prop, mirroring the upstream watcher: adjustments
  // during render keep the input in sync before paint, like Vue's pre-render
  // watcher.
  const [prevValue, setPrevValue] = useState(value);
  if(!Object.is(prevValue, value)) {
    setPrevValue(value);
    setCurrentValue(value);
  }

  // Upstream `updateValueAsDate`: refreshed on mount, on `value` prop changes,
  // and on `change` (see `handleChange` below).
  useEffect(() => {
    setValueAsDate(inputRef.current?.valueAsDate ?? null);
  }, [value]);

  const isLessThanMin = Boolean(currentValue && min && currentValue < min);
  const isGreaterThanMax = Boolean(currentValue && max && currentValue > max);
  const isInvalid = isLessThanMin || isGreaterThanMax;

  const outputValue = valueAsDate
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(valueAsDate)
    : null;

  const ariaDescribedBy = [
    valueAsDate ? outputId : null,
    isInvalid ? invalidFeedbackId : null,
  ].filter(Boolean).join(" ") || undefined;

  function handleChange(newValue: string) {
    setValueAsDate(inputRef.current?.valueAsDate ?? null);
    onChange?.(newValue);
  }

  return (
    <div className="gl-form-date">
      <GlFormInput
        {...inputProps}
        ref={(element: HTMLInputElement | null) => {
          inputRef.current = element;
          if(typeof forwardedRef === "function") {
            forwardedRef(element);
          } else if(forwardedRef) {
            forwardedRef.current = element;
          }
        }}
        aria-describedby={ariaDescribedBy}
        id={inputId}
        max={max ?? undefined}
        min={min ?? undefined}
        onBlur={onBlur}
        onChange={handleChange}
        onFocus={onFocus}
        onInput={(newValue) => setCurrentValue(String(newValue))}
        onKeyDown={onKeyDown}
        pattern="\d{4}-\d{2}-\d{2}"
        placeholder="yyyy-mm-dd"
        state={!isInvalid}
        type="date"
        value={currentValue ?? ""} />
      {outputValue ? (
        <output id={outputId} htmlFor={inputId} className="gl-sr-only">
          {outputValue}
        </output>
      ) : null}
      {isInvalid ? (
        <div id={invalidFeedbackId} className="invalid-feedback">
          {isLessThanMin ? minInvalidFeedback : null}
          {isGreaterThanMax ? maxInvalidFeedback : null}
        </div>
      ) : null}
    </div>
  );
});

export default GlFormDate;
