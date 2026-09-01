/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/form/form_checkbox/form_checkbox_group.vue
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
 * - Group state is shared with child GlFormCheckboxes through
 *   GlFormCheckboxGroupContext (upstream's `getCheckboxGroup` provide/inject),
 *   so checkboxes rendered from `options` or passed as children share the
 *   model, name, required, disabled, and validation state.
 * - `aria-describedby`/`aria-labelledby` are carried through the group
 *   context and applied to every grouped checkbox input instead of the
 *   wrapper. Upstream's PASS_DOWN_ATTRS only reaches option-generated
 *   checkboxes; here slotted checkboxes (`first`/`children`) receive them
 *   too, so their accessible names/descriptions keep the group labelling. A
 *   checkbox's own attributes still take precedence.
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
import GlFormCheckbox from "./form-checkbox";
import SafeHtml from "../../internal/safe-html/safe-html";
import { normalizeAriaInvalid } from "../../internal/form/aria-invalid-utils";
import { looseEqual } from "../../internal/form/equality-utils";
import { normalizeFormOptions } from "../../internal/form/form-options-utils";
import {
  GlFormCheckboxGroupContext,
  type GlFormCheckboxGroupContextValue,
} from "./form-checkbox-group-context";

export type GlFormCheckboxGroupOption = string | number | {
  /** Value added to the model when this option is checked. Defaults to `text`. */
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

export type GlFormCheckboxGroupProps = GroupElementProps & {
  /**
   * Optional value for the wrapper's `aria-invalid`. `'true'`/`true`/`''` set
   * it to "true"; when unset, a `state` of `false` dictates it instead.
   */
  ariaInvalid?: boolean | string;
  /** The current value of the group: the values of the checked boxes. Defaults to `[]`. */
  checked?: unknown[];
  /** Checkboxes rendered after the checkboxes generated from `options`. */
  children?: ReactNode;
  /** Disables the whole group; child checkboxes can additionally be disabled individually. */
  disabled?: boolean;
  /** Checkboxes rendered before the checkboxes generated from `options`. */
  first?: ReactNode;
  /** Used as the wrapper `id` and as the base for the generated group name. */
  id?: string;
  /**
   * The `name` attribute of the grouped checkboxes. Defaults to the generated
   * group ID, so grouped checkboxes always share a name.
   */
  name?: string;
  /** The model event: called with the new checked values when they change. */
  onInput?: (checked: unknown[]) => void;
  /** Called with the new checked values on user interaction. */
  onChange?: (checked: unknown[]) => void;
  /** Array of items to render as checkboxes. */
  options?: GlFormCheckboxGroupOption[];
  /** Adds the `required` attribute to the grouped checkboxes. */
  required?: boolean;
  /** Validation state: `true` valid, `false` invalid, `null` none. */
  state?: boolean | null;
};

// A stable empty-array default: an inline `checked = []` destructuring
// default would create a new array on every render, and the render-phase
// prop sync below would then see a "changed" `checked` identity on every
// render and setState in an infinite loop.
const DEFAULT_EMPTY_CHECKED: unknown[] = [];

export default function GlFormCheckboxGroup({
  "aria-describedby": ariaDescribedby,
  "aria-labelledby": ariaLabelledby,
  ariaInvalid = false,
  checked = DEFAULT_EMPTY_CHECKED,
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
}: GlFormCheckboxGroupProps) {
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const internalId = id || `gitlab_ui_checkbox_group_${generatedId}`;

  // Internal checked state seeded from the `checked` prop, mirroring
  // upstream's `localChecked`. The prop watcher maps to a render-phase
  // adjustment so the selection stays in sync before paint.
  const [localChecked, setLocalChecked] = useState<unknown[]>(checked);
  const [prevChecked, setPrevChecked] = useState(checked);
  if(!Object.is(prevChecked, checked)) {
    setPrevChecked(checked);
    if(!looseEqual(checked, localChecked)) {
      setLocalChecked(checked);
    }
  }

  const computedState = typeof state === "boolean" ? state : null;
  const computedAriaInvalid = normalizeAriaInvalid(ariaInvalid, computedState);

  // A user interaction updates the shared model and emits the model event
  // first, then the change event, like upstream. Upstream's `localChecked`
  // watcher only emits when the value actually changes, so loosely equal
  // updates are ignored here as well.
  const updateChecked = useCallback((value: unknown[]) => {
    if(looseEqual(value, localChecked)) {
      return;
    }
    setLocalChecked(value);
    onInput?.(value);
    onChange?.(value);
  }, [localChecked, onInput, onChange]);

  const contextValue = useMemo<GlFormCheckboxGroupContextValue>(() => ({
    ariaDescribedby,
    ariaLabelledby,
    checked: localChecked,
    disabled,
    // Checkboxes tied to the same model must have the same name, especially
    // for ARIA accessibility. Groups always have one (upstream's `groupName`).
    name: name || internalId,
    required,
    state: computedState,
    updateChecked,
  }), [
    ariaDescribedby,
    ariaLabelledby,
    localChecked,
    disabled,
    name,
    internalId,
    required,
    computedState,
    updateChecked,
  ]);

  const formOptions = normalizeFormOptions(options);

  return (
    <GlFormCheckboxGroupContext.Provider value={contextValue}>
      <div
        {...elementProps}
        aria-invalid={computedAriaInvalid}
        aria-required={required || undefined}
        className={["gl-form-checkbox-group gl-outline-none", className].filter(Boolean).join(" ")}
        id={internalId}
        role="group"
        tabIndex={-1}>
        {first}
        {formOptions.map((option, index) => (
          <GlFormCheckbox
            key={index}
            disabled={option.disabled}
            value={option.value}>
            {option.html ? <SafeHtml fallback={option.text} html={option.html} /> : option.text}
          </GlFormCheckbox>
        ))}
        {children}
      </div>
    </GlFormCheckboxGroupContext.Provider>
  );
}
