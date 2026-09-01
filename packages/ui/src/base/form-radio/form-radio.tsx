/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/form/form_radio/form_radio.vue
 *
 * Uses the shared equality helpers in `src/internal/form/equality-utils.ts`
 * (ported from packages/gitlab-ui/src/utils/equality_utils.js) and the
 * group context in `src/base/form-radio-group/form-radio-group-context.ts`.
 *
 * Adaptations:
 * - The `v-model` pair maps to the `checked` prop plus `onInput` (the model
 *   event) and `onChange` (user interaction) callbacks. Like upstream's
 *   `localChecked`, the component keeps internal state seeded from `checked`
 *   and re-synced when the prop changes, so it also selects without a
 *   listener.
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
  useId,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cva } from "class-variance-authority";
import { looseEqual } from "../../internal/form/equality-utils";
import { GlFormRadioGroupContext } from "../form-radio-group/form-radio-group-context";

type RadioElementProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | "aria-invalid"
  | "aria-required"
  | "checked"
  | "children"
  | "className"
  | "onChange"
  | "onInput"
  | "type"
  | "value"
>;

export type GlFormRadioProps = RadioElementProps & {
  /**
   * The current value of the radio. When bound to multiple radios, this is
   * the value of the currently selected radio. Defaults to `null`.
   */
  checked?: unknown;
  /** The radio content, rendered inside the `<label>`. */
  children?: ReactNode;
  /** Additional CSS class(es) merged onto the root wrapper. */
  className?: string;
  /** Help text rendered below the label content. */
  help?: ReactNode;
  /** The model event: called with the selected value when it changes. */
  onInput?: (checked: unknown) => void;
  /** Called with the selected value on user interaction. */
  onChange?: (value: unknown) => void;
  /**
   * Adds the `required` attribute to the input. Only takes effect when a
   * `name` is provided, like upstream.
   */
  required?: boolean;
  /** Validation state: `true` valid, `false` invalid, `null` none. */
  state?: boolean | null;
  /**
   * Value returned when this radio is selected. Defaults to `true`, unlike
   * the HTML default of "on", so selecting a radio without an explicit value
   * sets the bound model to `true`.
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
  checked = null,
  children,
  className,
  disabled = false,
  help,
  id,
  name,
  onChange,
  onInput,
  required = false,
  state = null,
  value = true,
  ...elementProps
}, forwardedRef) {
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const inputId = id || `gitlab_ui_radio_${generatedId}`;

  const group = useContext(GlFormRadioGroupContext);
  const isGroup = group !== null;

  // Internal checked state seeded from the `checked` prop, mirroring
  // upstream's `localChecked`. The prop watcher maps to a render-phase
  // adjustment so the input stays in sync before paint. Inside a group the
  // shared group value is the source of truth and this state is unused.
  const [localChecked, setLocalChecked] = useState<unknown>(checked);
  const [prevChecked, setPrevChecked] = useState(checked);
  if(!Object.is(prevChecked, checked)) {
    setPrevChecked(checked);
    if(!looseEqual(checked, localChecked)) {
      setLocalChecked(checked);
    }
  }

  const isChecked = looseEqual(isGroup ? group.checked : localChecked, value);

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

  function handleChange(_event: ChangeEvent<HTMLInputElement>) {
    // Upstream emits the model event first (via the `localChecked` watcher)
    // and the `change` event on the next tick; inside a group the selection
    // also updates the group's shared model and fires the group's events.
    if(isGroup) {
      group.select(value);
    } else {
      setLocalChecked(value);
    }
    onInput?.(value);
    onChange?.(value);
  }

  return (
    <div
      className={[
        "gl-form-radio custom-radio custom-control",
        className,
      ].filter(Boolean).join(" ")}>
      <input
        {...elementProps}
        ref={forwardedRef}
        aria-invalid={computedState === false ? "true" : undefined}
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
