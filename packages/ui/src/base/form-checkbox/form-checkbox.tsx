/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/form/form_checkbox/form_checkbox.vue
 *
 * Uses the shared equality helpers in `src/internal/form/equality-utils.ts`
 * (ported from packages/gitlab-ui/src/utils/equality_utils.js).
 *
 * Adaptations:
 * - Checked state uses React's controlled `checked` or uncontrolled
 *   `defaultChecked` API, with `onCheckedChange` reporting state changes.
 *   `onChange` and `onInput` retain their native React event semantics.
 * - The `help` scoped slot maps to the `help` prop. Additional attributes are
 *   applied to the `<input>` element, like upstream's `v-bind="computedAttrs"`;
 *   `className` is applied to the root wrapper, matching Vue's class
 *   fallthrough with `inheritAttrs: false`.
 * - Group integration (upstream's `getCheckboxGroup` provide/inject) maps to
 *   GlFormCheckboxGroupContext: inside a GlFormCheckboxGroup the checkbox
 *   takes the shared model array, name, required, disabled, and validation
 *   state from the group, and user interaction toggles through the group's
 *   `updateChecked` callback. The checkbox's own `checked` prop is ignored
 *   inside a group; the group is the source of truth. The group also carries
 *   its `aria-describedby`/`aria-labelledby` through the context; a
 *   checkbox's own attributes take precedence.
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
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cva } from "class-variance-authority";
import { clsx } from "cn";
import { looseIndexOf } from "../../internal/form/equality-utils";
import { mergeRefs } from "../../internal/utils/merge-refs";
import { GlFormCheckboxGroupContext } from "./form-checkbox-group-context";

type CheckboxElementProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | "aria-invalid"
  | "aria-label"
  | "aria-labelledby"
  | "aria-required"
  | "checked"
  | "children"
  | "className"
  | "defaultChecked"
  | "onChange"
  | "type"
  | "value"
>;

export type GlFormCheckboxProps = CheckboxElementProps & {
  /** Value for the `aria-label` attribute on the input. */
  ariaLabel?: string;
  /** ID of the element that labels the checkbox; used as `aria-labelledby`. */
  ariaLabelledby?: string;
  /** The controlled checked state. Ignored inside a GlFormCheckboxGroup. */
  checked?: boolean;
  /** The checkbox content, rendered inside the `<label>`. */
  children?: ReactNode;
  /** Additional CSS class(es) merged onto the root wrapper. */
  className?: string;
  /** Initial checked state when used uncontrolled. Ignored inside a group. */
  defaultChecked?: boolean;
  /** Help text rendered below the label content. */
  help?: ReactNode;
  /** Renders the checkbox in an indeterminate state (single-checkbox mode only). */
  indeterminate?: boolean;
  /** Called with the input's `indeterminate` flag after user interaction. */
  onIndeterminateChange?: (indeterminate: boolean) => void;
  /** Called with the native React change event. */
  onChange?: InputHTMLAttributes<HTMLInputElement>["onChange"];
  /** Called with the next checked state on user interaction. */
  onCheckedChange?: (checked: boolean) => void;
  /**
   * Adds the `required` attribute to the input. Only takes effect when a
   * `name` is provided, like upstream.
   */
  required?: boolean;
  /** Validation state: `true` valid, `false` invalid, `null` none. */
  state?: boolean | null;
  /** Native form value and, inside a group, the option value. */
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
  "aria-describedby": ariaDescribedby,
  ariaLabel,
  ariaLabelledby,
  checked,
  children,
  className,
  defaultChecked = false,
  disabled = false,
  help,
  id,
  indeterminate = false,
  name,
  onChange,
  onCheckedChange,
  onIndeterminateChange,
  required = false,
  state = null,
  value = true,
  ...elementProps
}, forwardedRef) {
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const inputId = id || `gitlab_ui_checkbox_${generatedId}`;
  const inputRef = useRef<HTMLInputElement | null>(null);

  const group = useContext(GlFormCheckboxGroupContext);
  const isGroup = group !== null;

  const isControlled = checked !== undefined;
  const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);
  const isChecked = isGroup
    ? looseIndexOf(group.value, value) > -1
    : isControlled ? checked : uncontrolledChecked;

  // Inside a group, the group's validation state wins (upstream's
  // `computedState` reads `group.computedState`).
  const computedState = isGroup ? group.state : typeof state === "boolean" ? state : null;
  // The group name is preferred over the local name; groups always have one.
  const computedName = (isGroup ? group.name : name) || undefined;
  // A child can be disabled while the group isn't, but is always disabled
  // when the group is.
  const isDisabled = isGroup ? group.disabled || disabled : disabled;
  // Required only works when a name is provided for the input(s); a child can
  // only be required when its group is.
  const isRequired = Boolean(computedName) && (isGroup ? group.required : required);
  // Group-level ARIA references apply to every grouped checkbox, unless the
  // checkbox sets its own (the group carries upstream's PASS_DOWN_ATTRS).
  const computedAriaDescribedby = ariaDescribedby ?? group?.ariaDescribedby;
  const computedAriaLabelledby = ariaLabelledby ?? group?.ariaLabelledby;

  // The DOM `indeterminate` property is only supported outside a group.
  useEffect(() => {
    const input = inputRef.current;
    if(input) {
      input.indeterminate = isGroup ? false : indeterminate;
    }
  }, [indeterminate, isGroup]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { checked: targetChecked, indeterminate: targetIndeterminate } = event.target;
    onChange?.(event);
    if(event.defaultPrevented) return;

    if(isGroup) {
      const index = looseIndexOf(group.value, value);
      let nextValue: unknown[];
      if(targetChecked && index < 0) {
        nextValue = [...group.value, value];
      } else if(!targetChecked && index > -1) {
        nextValue = [...group.value.slice(0, index), ...group.value.slice(index + 1)];
      } else {
        nextValue = [...group.value];
      }
      group.updateValue(nextValue);
    } else {
      if(!isControlled) setUncontrolledChecked(targetChecked);
    }

    onCheckedChange?.(targetChecked);
    onIndeterminateChange?.(targetIndeterminate);
  }

  return (
    <div
      className={clsx("gl-form-checkbox custom-checkbox custom-control", className)}>
      <input
        {...elementProps}
        ref={mergeRefs(inputRef, forwardedRef)}
        aria-describedby={computedAriaDescribedby}
        aria-invalid={computedState === false ? "true" : undefined}
        aria-label={ariaLabel}
        aria-labelledby={computedAriaLabelledby}
        aria-required={isRequired || undefined}
        checked={isChecked}
        className={inputVariants({
          state: computedState === true ? "valid" : computedState === false ? "invalid" : "none",
        })}
        disabled={isDisabled}
        id={inputId}
        name={computedName}
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
