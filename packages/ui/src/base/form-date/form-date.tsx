/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/form/form_date/form_date.vue
 *
 * Adaptations:
 * - The `v-model` pair maps to React's controlled `value` or uncontrolled
 *   `defaultValue`, with `onValueChange` receiving the date string.
 *   `onChange` retains its native React event semantics.
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
  type ChangeEventHandler,
  type FocusEventHandler,
  type KeyboardEventHandler,
} from "react";
import GlFormInput, {
  type GlFormInputProps,
  type GlFormInputValue,
} from "../form-input/form-input";
import { mergeAriaIds } from "../../internal/utils/merge-aria-ids";
import { mergeRefs } from "../../internal/utils/merge-refs";

type FormInputPassthroughProps = Omit<
  GlFormInputProps,
  | "ariaInvalid"
  | "debounce"
  | "defaultValue"
  | "formatter"
  | "lazy"
  | "lazyFormatter"
  | "max"
  | "min"
  | "number"
  | "onBlur"
  | "onChange"
  | "onFocus"
  | "onKeyDown"
  | "onValueChange"
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
  /** Initial date value when used uncontrolled. */
  defaultValue?: string;
  /** Error message displayed when the value is below the minimum. */
  minInvalidFeedback?: string;
  /** Error message displayed when the value exceeds the maximum. */
  maxInvalidFeedback?: string;
  /** The current value of the date picker, as a `yyyy-mm-dd` string. */
  value?: string | null;
  /** Called with the native React change event. */
  onChange?: ChangeEventHandler<HTMLInputElement>;
  /** Called with the date string on user interaction. */
  onValueChange?: (value: string) => void;
  /** Called when a key is pressed inside the date input. */
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  /** Called when the date input receives focus. */
  onFocus?: FocusEventHandler<HTMLInputElement>;
  /** Called when the date input loses focus. */
  onBlur?: FocusEventHandler<HTMLInputElement>;
};

const GlFormDate = forwardRef<HTMLInputElement, GlFormDateProps>(function GlFormDate({
  "aria-describedby": ariaDescribedBy,
  defaultValue = "",
  id = null,
  min = null,
  max = null,
  minInvalidFeedback = "Must be after minimum date.",
  maxInvalidFeedback = "Must be before maximum date.",
  onBlur,
  onChange,
  onFocus,
  onKeyDown,
  onValueChange,
  value,
  ...inputProps
}, forwardedRef) {
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const inputId = id ?? `form-date-${generatedId}`;
  const invalidFeedbackId = `form-date-invalid-feedback-${generatedId}`;
  const outputId = `form-date-output-${generatedId}`;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const currentValue = isControlled ? value : uncontrolledValue;
  const [valueAsDate, setValueAsDate] = useState<Date | null>(null);

  // Refresh the accessible description only after the effective value changes.
  // In controlled mode an attempted edit may be rejected by the parent, so the
  // native change event alone must not update this derived state.
  useEffect(() => {
    setValueAsDate(inputRef.current?.valueAsDate ?? null);
  }, [currentValue]);

  // GlFormInput leaves the DOM value to the browser in uncontrolled mode.
  // After a native reset, mirror that value into date validation and the
  // accessible long-date description without controlling the input itself.
  useEffect(() => {
    if(isControlled) return undefined;

    const input = inputRef.current;
    if(!input) return undefined;

    const syncValue = () => setUncontrolledValue(input.value);
    syncValue();

    const associatedForm = input.form;
    if(!associatedForm) return undefined;

    const handleReset = (event: Event) => {
      queueMicrotask(() => {
        if(!event.defaultPrevented && inputRef.current === input) syncValue();
      });
    };
    associatedForm.addEventListener("reset", handleReset);
    return () => associatedForm.removeEventListener("reset", handleReset);
  }, [defaultValue, inputProps.form, isControlled]);

  const isLessThanMin = Boolean(currentValue && min && currentValue < min);
  const isGreaterThanMax = Boolean(currentValue && max && currentValue > max);
  const isInvalid = isLessThanMin || isGreaterThanMax;

  const outputValue = valueAsDate
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(valueAsDate)
    : null;

  const computedAriaDescribedBy = mergeAriaIds(
    ariaDescribedBy,
    valueAsDate ? outputId : undefined,
    isInvalid ? invalidFeedbackId : undefined,
  );

  function handleValueChange(newValue: GlFormInputValue) {
    const nextValue = String(newValue);
    if(!isControlled) setUncontrolledValue(nextValue);
    onValueChange?.(nextValue);
  }

  return (
    <div className="gl-form-date">
      <GlFormInput
        {...inputProps}
        ref={mergeRefs(inputRef, forwardedRef)}
        aria-describedby={computedAriaDescribedBy}
        defaultValue={isControlled ? undefined : defaultValue}
        id={inputId}
        max={max ?? undefined}
        min={min ?? undefined}
        onBlur={onBlur}
        onChange={onChange}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        onValueChange={handleValueChange}
        pattern="\d{4}-\d{2}-\d{2}"
        placeholder="yyyy-mm-dd"
        state={!isInvalid}
        type="date"
        value={isControlled ? currentValue ?? "" : undefined} />
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
