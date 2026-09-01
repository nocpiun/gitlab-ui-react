/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/form/form_checkbox/form_checkbox.vue
 *
 * Uses the shared equality helpers in `src/internal/form/equality-utils.ts`
 * (ported from packages/gitlab-ui/src/utils/equality_utils.js).
 *
 * Adaptations:
 * - The `v-model` pair maps to the `checked` prop plus `onInput` (the model
 *   event) and `onChange` (user interaction) callbacks. Like upstream's
 *   `localChecked`, the component keeps internal state seeded from `checked`
 *   and re-synced when the prop changes, so it also toggles without a
 *   listener.
 * - The `help` scoped slot maps to the `help` prop. Additional attributes are
 *   applied to the `<input>` element, like upstream's `v-bind="computedAttrs"`;
 *   `className` is applied to the root wrapper, matching Vue's class
 *   fallthrough with `inheritAttrs: false`.
 * - Group integration (upstream's `getCheckboxGroup` injection) is deferred
 *   until GlFormCheckboxGroup is ported; standalone behavior is complete.
 * - The fallback input ID is generated with `useId` during render (SSR-safe)
 *   instead of upstream's post-mount `uniqueId`.
 * - Upstream's `indeterminate` / `update:indeterminate` events map to
 *   `onIndeterminateChange`, fired on user interaction; syncing the DOM
 *   `indeterminate` property from the prop does not re-emit.
 * - The forwarded ref exposes the `<input>` element, covering upstream's
 *   `focus`/`blur` methods.
 */

import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cva } from "class-variance-authority";
import { looseEqual, looseIndexOf } from "../../internal/form/equality-utils";
import { mergeRefs } from "../../internal/merge-refs";

type CheckboxElementProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | "aria-invalid"
  | "aria-label"
  | "aria-labelledby"
  | "aria-required"
  | "checked"
  | "children"
  | "className"
  | "onChange"
  | "onInput"
  | "type"
  | "value"
>;

export type GlFormCheckboxProps = CheckboxElementProps & {
  /** Value for the `aria-label` attribute on the input. */
  ariaLabel?: string;
  /** ID of the element that labels the checkbox; used as `aria-labelledby`. */
  ariaLabelledby?: string;
  /**
   * The current value of the checkbox. Must be an array when multiple
   * checkboxes are bound to the same model. Defaults to `null`.
   */
  checked?: unknown;
  /** The checkbox content, rendered inside the `<label>`. */
  children?: ReactNode;
  /** Additional CSS class(es) merged onto the root wrapper. */
  className?: string;
  /** Help text rendered below the label content. */
  help?: ReactNode;
  /** Renders the checkbox in an indeterminate state (single-checkbox mode only). */
  indeterminate?: boolean;
  /** Called with the input's `indeterminate` flag after user interaction. */
  onIndeterminateChange?: (indeterminate: boolean) => void;
  /** The model event: called with the new checked value when it changes. */
  onInput?: (checked: unknown) => void;
  /** Called with the new checked value on user interaction. */
  onChange?: (checked: unknown) => void;
  /**
   * Adds the `required` attribute to the input. Only takes effect when a
   * `name` is provided, like upstream.
   */
  required?: boolean;
  /** Validation state: `true` valid, `false` invalid, `null` none. */
  state?: boolean | null;
  /** Value returned when this checkbox is unchecked. Not applicable when the model is an array. */
  uncheckedValue?: unknown;
  /** Value returned when this checkbox is checked. */
  value?: unknown;
};

const inputVariants = cva("custom-control-input", {
  variants: {
    state: {
      none: null,
      valid: "is-valid",
      invalid: "is-invalid",
    },
  },
});

const GlFormCheckbox = forwardRef<HTMLInputElement, GlFormCheckboxProps>(function GlFormCheckbox({
  ariaLabel,
  ariaLabelledby,
  checked = null,
  children,
  className,
  disabled = false,
  help,
  id,
  indeterminate = false,
  name,
  onChange,
  onIndeterminateChange,
  onInput,
  required = false,
  state = null,
  uncheckedValue = false,
  value = true,
  ...elementProps
}, forwardedRef) {
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const inputId = id || `gitlab_ui_checkbox_${generatedId}`;
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Internal checked state seeded from the `checked` prop, mirroring
  // upstream's `localChecked`. The prop watcher maps to a render-phase
  // adjustment so the input stays in sync before paint.
  const [localChecked, setLocalChecked] = useState<unknown>(checked);
  const [prevChecked, setPrevChecked] = useState(checked);
  if(!Object.is(prevChecked, checked)) {
    setPrevChecked(checked);
    if(!looseEqual(checked, localChecked)) {
      setLocalChecked(checked);
    }
  }

  const isArrayMode = Array.isArray(localChecked);
  const isChecked = isArrayMode
    ? looseIndexOf(localChecked, value) > -1
    : looseEqual(localChecked, value);

  const computedState = typeof state === "boolean" ? state : null;
  // Required only works when a name is provided for the input
  const isRequired = Boolean(name) && required;

  // The DOM `indeterminate` property is only supported in single-checkbox
  // mode, never when the model is an array (upstream `setIndeterminate`).
  useEffect(() => {
    const input = inputRef.current;
    if(input) {
      input.indeterminate = isArrayMode ? false : indeterminate;
    }
  }, [indeterminate, isArrayMode]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { checked: targetChecked, indeterminate: targetIndeterminate } = event.target;

    let newChecked: unknown;
    if(Array.isArray(localChecked)) {
      const index = looseIndexOf(localChecked, value);
      if(targetChecked && index < 0) {
        // Add value to array
        newChecked = [...localChecked, value];
      } else if(!targetChecked && index > -1) {
        // Remove value from array
        newChecked = [...localChecked.slice(0, index), ...localChecked.slice(index + 1)];
      } else {
        newChecked = localChecked;
      }
    } else {
      newChecked = targetChecked ? value : uncheckedValue;
    }
    setLocalChecked(newChecked);

    // Upstream emits the model event first (via the `localChecked` watcher)
    // and the `change` event on the next tick.
    onInput?.(newChecked);
    onChange?.(newChecked);
    onIndeterminateChange?.(targetIndeterminate);
  }

  return (
    <div
      className={[
        "gl-form-checkbox custom-checkbox custom-control",
        className,
      ].filter(Boolean).join(" ")}>
      <input
        {...elementProps}
        ref={mergeRefs(inputRef, forwardedRef)}
        aria-invalid={computedState === false ? "true" : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-required={isRequired || undefined}
        checked={isChecked}
        className={inputVariants({
          state: computedState === true ? "valid" : computedState === false ? "invalid" : "none",
        })}
        disabled={disabled}
        id={inputId}
        name={name}
        onChange={handleChange}
        required={isRequired}
        type="checkbox"
        value={value as string | number | readonly string[] | undefined} />
      <label className="custom-control-label" htmlFor={inputId}>
        {children}
        {help ? <p className="help-text">{help}</p> : null}
      </label>
    </div>
  );
});

export default GlFormCheckbox;
