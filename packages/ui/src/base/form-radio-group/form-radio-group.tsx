/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/form/form_radio_group/form_radio_group.vue
 *
 * Uses the shared option normalization in
 * `src/internal/form/form-options-utils.ts` (ported from
 * packages/gitlab-ui/src/utils/form_options_utils.js).
 *
 * Adaptations:
 * - The `v-model` pair maps to the `checked` prop plus `onInput` (the model
 *   event) and `onChange` (user interaction) callbacks. Like upstream's
 *   `localChecked`, internal state is seeded from `checked` and re-synced when
 *   the prop changes, so the group also works uncontrolled.
 * - The `first` and default slots map to the `first` prop and `children`.
 * - Option `html` is sanitized and rendered by the internal SafeHtml
 *   component, the React counterpart of upstream's `safe_html` directive; on
 *   the server it fails closed and renders the option text as fallback.
 * - Group state is shared with child GlFormRadios through
 *   GlFormRadioGroupContext (upstream's `getRadioGroup` provide/inject), so
 *   radios rendered from `options` or passed as children share the model,
 *   name, required, disabled, and validation state.
 * - `aria-describedby`/`aria-labelledby` are passed down to the option
 *   radios' inputs instead of the wrapper, like upstream's PASS_DOWN_ATTRS.
 * - The fallback group ID is generated with `useId` during render (SSR-safe)
 *   instead of upstream's post-mount `uniqueId`.
 */

import {
  useCallback,
  useId,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { clsx } from "cn";
import GlFormRadio from "../form-radio/form-radio";
import SafeHtml from "../../internal/safe-html/safe-html";
import { normalizeAriaInvalid } from "../../internal/form/aria-invalid-utils";
import { looseEqual } from "../../internal/form/equality-utils";
import { normalizeFormOptions } from "../../internal/form/form-options-utils";
import {
  GlFormRadioGroupContext,
  type GlFormRadioGroupContextValue,
} from "./form-radio-group-context";

export type GlFormRadioGroupOption = string | number | {
  /** Value returned when this option is selected. Defaults to `text`. */
  value?: unknown;
  /** Visible label text. */
  text: string;
  /** Label rendered as sanitized HTML (upstream's `safe_html` directive). */
  html?: string;
  /** Renders this option disabled. */
  disabled?: boolean;
};

type GroupElementProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  | "aria-invalid"
  | "aria-required"
  | "onChange"
  | "onInput"
>;

export type GlFormRadioGroupProps = GroupElementProps & {
  /**
   * Optional value for the wrapper's `aria-invalid`. `'true'`/`true`/`''` set
   * it to "true"; when unset, a `state` of `false` dictates it instead.
   */
  ariaInvalid?: boolean | string;
  /**
   * The current value of the group: the value of the currently selected
   * radio. Defaults to `null`.
   */
  checked?: unknown;
  /** Radios rendered after the radios generated from `options`. */
  children?: ReactNode;
  /** Disables the whole group; child radios can additionally be disabled individually. */
  disabled?: boolean;
  /** Radios rendered before the radios generated from `options`. */
  first?: ReactNode;
  /** Used as the wrapper `id` and as the base for the generated group name. */
  id?: string;
  /**
   * The `name` attribute of the grouped radios. Defaults to the generated
   * group ID, so grouped radios always share a name.
   */
  name?: string;
  /** The model event: called with the selected value when it changes. */
  onInput?: (checked: unknown) => void;
  /** Called with the selected value on user interaction. */
  onChange?: (value: unknown) => void;
  /** Array of items to render as radios. */
  options?: GlFormRadioGroupOption[];
  /** Adds the `required` attribute to the grouped radios. */
  required?: boolean;
  /** Validation state: `true` valid, `false` invalid, `null` none. */
  state?: boolean | null;
};

export default function GlFormRadioGroup({
  "aria-describedby": ariaDescribedby,
  "aria-labelledby": ariaLabelledby,
  ariaInvalid = false,
  checked = null,
  children,
  className,
  disabled = false,
  first,
  id,
  name,
  onChange,
  onInput,
  options = [],
  required = false,
  state = null,
  ...elementProps
}: GlFormRadioGroupProps) {
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const internalId = id || `gitlab_ui_radio_group_${generatedId}`;

  // Internal checked state seeded from the `checked` prop, mirroring
  // upstream's `localChecked`. The prop watcher maps to a render-phase
  // adjustment so the selection stays in sync before paint.
  const [localChecked, setLocalChecked] = useState<unknown>(checked);
  const [prevChecked, setPrevChecked] = useState(checked);
  if(!Object.is(prevChecked, checked)) {
    setPrevChecked(checked);
    if(!looseEqual(checked, localChecked)) {
      setLocalChecked(checked);
    }
  }

  const computedState = typeof state === "boolean" ? state : null;
  const computedAriaInvalid = normalizeAriaInvalid(ariaInvalid, computedState);

  // A user selection updates the shared model and emits the model event
  // first, then the change event, like upstream.
  const select = useCallback((value: unknown) => {
    setLocalChecked(value);
    onInput?.(value);
    onChange?.(value);
  }, [onInput, onChange]);

  const contextValue = useMemo<GlFormRadioGroupContextValue>(() => ({
    checked: localChecked,
    disabled,
    // Radios tied to the same model must have the same name, especially for
    // ARIA accessibility. Groups always have one (upstream's `groupName`).
    name: name || internalId,
    required,
    select,
    state: computedState,
  }), [localChecked, disabled, name, internalId, required, select, computedState]);

  const formOptions = normalizeFormOptions(options);

  return (
    <GlFormRadioGroupContext.Provider value={contextValue}>
      <div
        {...elementProps}
        aria-invalid={computedAriaInvalid}
        aria-required={required || undefined}
        className={clsx("gl-form-radio-group gl-outline-none", className)}
        id={internalId}
        role="radiogroup"
        tabIndex={-1}>
        {first}
        {formOptions.map((option, index) => (
          <GlFormRadio
            key={index}
            aria-describedby={ariaDescribedby}
            aria-labelledby={ariaLabelledby}
            disabled={option.disabled}
            value={option.value}>
            {option.html ? <SafeHtml fallback={option.text} html={option.html} /> : option.text}
          </GlFormRadio>
        ))}
        {children}
      </div>
    </GlFormRadioGroupContext.Provider>
  );
}
