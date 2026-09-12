/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/form/form_checkbox/form_checkbox_group.vue
 *
 * Uses the shared option normalization in
 * `src/internal/form/form-options-utils.ts` (ported from
 * packages/gitlab-ui/src/utils/form_options_utils.js).
 *
 * Adaptations:
 * - The `v-model` pair maps to React's controlled `value` or uncontrolled
 *   `defaultValue`, with `onValueChange` reporting selection changes.
 *   `onChange` and `onInput` retain their native bubbling event semantics on
 *   the group wrapper.
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
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { clsx } from "cn";
import GlFormCheckbox from "./form-checkbox.js";
import SafeHtml from "../../internal/safe-html/safe-html.js";
import { normalizeAriaInvalid } from "../../internal/form/aria-invalid-utils.js";
import { looseEqual } from "../../internal/form/equality-utils.js";
import { normalizeFormOptions } from "../../internal/form/form-options-utils.js";
import {
  GlFormCheckboxGroupContext,
  type GlFormCheckboxGroupContextValue,
} from "./form-checkbox-group-context.js";

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
  | "defaultValue"
>;

export type GlFormCheckboxGroupProps = GroupElementProps & {
  /**
   * Optional value for the wrapper's `aria-invalid`. `'true'`/`true`/`''` set
   * it to "true"; when unset, a `state` of `false` dictates it instead.
   */
  ariaInvalid?: boolean | string;
  /** Initial selected values for an uncontrolled group. */
  defaultValue?: unknown[];
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
  /** Called with the selected values on user interaction. */
  onValueChange?: (value: unknown[]) => void;
  /** Array of items to render as checkboxes. */
  options?: GlFormCheckboxGroupOption[];
  /** Adds the `required` attribute to the grouped checkboxes. */
  required?: boolean;
  /** Validation state: `true` valid, `false` invalid, `null` none. */
  state?: boolean | null;
  /** Current selected values for a controlled group. */
  value?: unknown[];
};

// Keep the uncontrolled default stable when the prop is omitted.
const DEFAULT_EMPTY_VALUE: unknown[] = [];

export default function GlFormCheckboxGroup({
  "aria-describedby": ariaDescribedby,
  "aria-labelledby": ariaLabelledby,
  ariaInvalid = false,
  children,
  className,
  defaultValue = DEFAULT_EMPTY_VALUE,
  disabled = false,
  first,
  id,
  name,
  onValueChange,
  options = [],
  required = false,
  state = null,
  value,
  ...elementProps
}: GlFormCheckboxGroupProps) {
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const internalId = id || `gitlab_ui_checkbox_group_${generatedId}`;

  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState<unknown[]>(() => [...defaultValue]);
  const selectedValue = isControlled ? value : uncontrolledValue;
  const groupRef = useRef<HTMLDivElement | null>(null);
  const selectedValueRef = useRef(selectedValue);

  const computedState = typeof state === "boolean" ? state : null;
  const computedAriaInvalid = normalizeAriaInvalid(ariaInvalid, computedState);

  // Uncontrolled checkboxes are reset by the browser. Keep the group's model
  // in sync so later checkbox interactions start from the restored selection.
  useEffect(() => {
    if(isControlled) return undefined;

    const groupElement = groupRef.current;
    const associatedForm = groupElement?.closest("form");
    if(!groupElement || !associatedForm) return undefined;

    const handleReset = (event: Event) => {
      const previousValue = selectedValueRef.current;
      const nextValue = [...defaultValue];
      selectedValueRef.current = nextValue;
      queueMicrotask(() => {
        if(event.defaultPrevented) {
          selectedValueRef.current = previousValue;
        } else if(groupRef.current === groupElement) {
          setUncontrolledValue(nextValue);
        }
      });
    };
    associatedForm.addEventListener("reset", handleReset);
    return () => associatedForm.removeEventListener("reset", handleReset);
  }, [defaultValue, isControlled]);

  // Upstream only emits for actual selection changes, so loosely equal
  // updates are ignored here as well.
  const updateValue = useCallback((nextValue: unknown[]) => {
    const currentValue = isControlled ? value : selectedValueRef.current;
    if(looseEqual(nextValue, currentValue)) {
      return;
    }
    if(!isControlled) {
      selectedValueRef.current = nextValue;
      setUncontrolledValue(nextValue);
    }
    onValueChange?.(nextValue);
  }, [isControlled, onValueChange, value]);

  const getValue = useCallback(
    () => isControlled ? value : selectedValueRef.current,
    [isControlled, value],
  );

  const contextValue = useMemo<GlFormCheckboxGroupContextValue>(() => ({
    ariaDescribedby,
    ariaLabelledby,
    defaultValue,
    getValue,
    isControlled,
    value: selectedValue,
    disabled,
    // Checkboxes tied to the same model must have the same name, especially
    // for ARIA accessibility. Groups always have one (upstream's `groupName`).
    name: name || internalId,
    required,
    state: computedState,
    updateValue,
  }), [
    ariaDescribedby,
    ariaLabelledby,
    defaultValue,
    getValue,
    isControlled,
    selectedValue,
    disabled,
    name,
    internalId,
    required,
    computedState,
    updateValue,
  ]);

  const formOptions = normalizeFormOptions(options);

  return (
    <GlFormCheckboxGroupContext.Provider value={contextValue}>
      <div
        {...elementProps}
        ref={groupRef}
        aria-invalid={computedAriaInvalid}
        aria-required={required || undefined}
        className={clsx("gl-form-checkbox-group gl-outline-none", className)}
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
