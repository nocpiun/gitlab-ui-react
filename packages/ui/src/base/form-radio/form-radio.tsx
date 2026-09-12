/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/form/form_radio/form_radio.vue
 *
 * Uses the shared equality helpers in `src/internal/form/equality-utils.ts`
 * (ported from packages/gitlab-ui/src/utils/equality_utils.js) and the
 * group context in `src/base/form-radio-group/form-radio-group-context.ts`.
 *
 * Adaptations:
 * - Checked state uses React's controlled `checked` or uncontrolled
 *   `defaultChecked` API, with `onCheckedChange` reporting state changes.
 *   `onChange` and `onInput` retain their native React event semantics.
 * - The `help` scoped slot maps to the `help` prop. Additional attributes are
 *   applied to the `<input>` element, like upstream's `v-bind="computedAttrs"`;
 *   `className` is applied to the root wrapper, matching Vue's class
 *   fallthrough with `inheritAttrs: false`.
 * - Group integration (upstream's `getRadioGroup` provide/inject) maps to
 *   GlFormRadioGroupContext: inside a GlFormRadioGroup the radio takes the
 *   shared model value, name, required, disabled, and validation state from
 *   the group, and user interaction selects through the group's `select`
 *   callback. The radio's own `checked` prop is ignored inside a group; the
 *   group is the source of truth.
 * - The fallback input ID is generated with `useId` during render (SSR-safe)
 *   instead of upstream's post-mount `uniqueId`.
 * - The forwarded ref exposes the `<input>` element, covering upstream's
 *   `focus`/`blur` methods.
 */

import {
  forwardRef,
  useContext,
  useEffect,
  useId,
  useRef,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cva } from "class-variance-authority";
import { clsx } from "cn";
import { looseEqual } from "../../internal/form/equality-utils.js";
import { mergeRefs } from "../../internal/utils/merge-refs.js";
import { GlFormRadioGroupContext } from "../form-radio-group/form-radio-group-context.js";

type RadioElementProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | "aria-invalid"
  | "aria-required"
  | "checked"
  | "children"
  | "className"
  | "defaultChecked"
  | "onChange"
  | "type"
  | "value"
>;

export type GlFormRadioProps = RadioElementProps & {
  /** The controlled checked state. Ignored inside a GlFormRadioGroup. */
  checked?: boolean;
  /** The radio content, rendered inside the `<label>`. */
  children?: ReactNode;
  /** Additional CSS class(es) merged onto the root wrapper. */
  className?: string;
  /** Initial checked state when used uncontrolled. Ignored inside a group. */
  defaultChecked?: boolean;
  /** Help text rendered below the label content. */
  help?: ReactNode;
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
  /**
   * Native form value and, inside a group, the option value. Defaults to
   * `true`, preserving the upstream option default.
   */
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

const GlFormRadio = forwardRef<HTMLInputElement, GlFormRadioProps>(function GlFormRadio({
  checked,
  children,
  className,
  defaultChecked = false,
  disabled = false,
  form,
  help,
  id,
  name,
  onChange,
  onCheckedChange,
  required = false,
  state = null,
  value = true,
  ...elementProps
}, forwardedRef) {
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const inputId = id || `gitlab_ui_radio_${generatedId}`;
  const inputRef = useRef<HTMLInputElement | null>(null);

  const group = useContext(GlFormRadioGroupContext);
  const isGroup = group !== null;

  const isControlled = isGroup ? group.isControlled : checked !== undefined;
  const controlledChecked = isGroup ? looseEqual(group.value, value) : checked;
  const initialChecked = isGroup ? looseEqual(group.defaultValue, value) : defaultChecked;

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

  // Native form reset bypasses React's checked-value tracker. Synchronize it
  // after the browser restores defaultChecked so the next change is observed.
  useEffect(() => {
    if(isControlled) return undefined;

    const input = inputRef.current;
    const associatedForm = input?.form;
    if(!input || !associatedForm) return undefined;

    const handleReset = (event: Event) => {
      queueMicrotask(() => {
        if(!event.defaultPrevented && inputRef.current === input) {
          const resetChecked = input.checked;
          input.checked = resetChecked;
        }
      });
    };
    associatedForm.addEventListener("reset", handleReset);
    return () => associatedForm.removeEventListener("reset", handleReset);
  }, [form, isControlled]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange?.(event);
    if(event.defaultPrevented) return;

    if(isGroup) {
      group.select(value);
    }
    onCheckedChange?.(event.target.checked);
  }

  return (
    <div
      className={clsx("gl-form-radio custom-radio custom-control", className)}>
      <input
        {...elementProps}
        ref={mergeRefs(inputRef, forwardedRef)}
        aria-invalid={computedState === false ? "true" : undefined}
        aria-required={isRequired || undefined}
        checked={isControlled ? controlledChecked : undefined}
        className={inputVariants({
          state: computedState === true ? "valid" : computedState === false ? "invalid" : "none",
        })}
        disabled={isDisabled}
        defaultChecked={isControlled ? undefined : initialChecked}
        form={form}
        id={inputId}
        name={computedName}
        onChange={handleChange}
        required={isRequired}
        type="radio"
        value={value as string | number | readonly string[] | undefined} />
      <label className="custom-control-label" htmlFor={inputId}>
        {children}
        {help ? <p className="help-text">{help}</p> : null}
      </label>
    </div>
  );
});

export default GlFormRadio;
