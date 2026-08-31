/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/form/form_select/form_select.vue
 * packages/gitlab-ui/src/vendor/bootstrap-vue/src/components/form-select/form-select.js
 * packages/gitlab-ui/src/vendor/bootstrap-vue/src/components/form-select/form-select-option.js
 * packages/gitlab-ui/src/vendor/bootstrap-vue/src/components/form-select/form-select-option-group.js
 * packages/gitlab-ui/src/vendor/bootstrap-vue/src/components/form-select/helpers/mixin-options.js
 *
 * Adaptations:
 * - The `v-model` pair maps to the `value` prop plus `onInput` (the model
 *   event) and `onChange` (user interaction) callbacks. Like upstream's
 *   `localValue`, internal state is seeded from `value` and re-synced when the
 *   prop changes, so the select also works uncontrolled; unlike upstream, a
 *   `value` prop change does not re-emit the model event.
 * - The `first` and default slots map to the `first` prop and `children`.
 * - Option `html` is rendered via `dangerouslySetInnerHTML`, matching
 *   upstream's `htmlOrText` (`domProps: { innerHTML }`), which does not
 *   sanitize. Only pass trusted markup.
 * - Option values keep their JavaScript type: the original value is stashed
 *   per `<option>` element (upstream's `_value` expando set by the v-model
 *   directive) and read back on change, so numbers and objects round-trip
 *   even though the DOM `value` attribute is a string.
 * - The deprecated object form of `options` and the `*Field` props
 *   (`textField`/`valueField`/`htmlField`/`disabledField`/`labelField`/
 *   `optionsField`) are not ported; `options` is an array with fixed field
 *   names, as in the GlFormRadioGroup port.
 * - The fallback select ID is generated with `useId` during render (SSR-safe)
 *   instead of upstream's post-mount `uniqueId`.
 * - Base UI has no native-select primitive (its Select is a listbox), so a
 *   native `<select>` is rendered; the forwarded ref exposes it, covering
 *   upstream's `focus`/`blur` methods.
 */

import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { cva } from "class-variance-authority";

export type GlFormSelectWidth = "xs" | "sm" | "md" | "lg" | "xl";

/** Responsive widths: `default` for the base width, breakpoints for `gl-{breakpoint}-form-select-{width}`. */
export type GlFormSelectResponsiveWidth = Partial<
  Record<"default" | "sm" | "md" | "lg" | "xl", GlFormSelectWidth>
>;

export type GlFormSelectOption = string | number | {
  /** Value returned when this option is selected. Defaults to `text`. */
  value?: unknown;
  /** Visible label text. */
  text: string;
  /**
   * Label rendered as raw HTML instead of `text` (upstream's `html` field,
   * rendered unsanitized via `innerHTML`). Only pass trusted markup.
   */
  html?: string;
  /** Renders this option disabled. */
  disabled?: boolean;
};

export type GlFormSelectOptionGroup = {
  /** Visible label of the generated `<optgroup>`. */
  label: string;
  /** Options rendered inside the group. */
  options: GlFormSelectOption[];
};

type NormalizedOption = {
  value: unknown;
  text: string;
  html?: string;
  disabled: boolean;
  /** DOM `value` attribute; the typed value is stashed separately. */
  domValue: string;
};

type NormalizedOptionOrGroup = NormalizedOption | {
  label: string;
  options: NormalizedOption[];
};

// Ported from vendor/bootstrap-vue/src/utils/loose-equal.js: primitives fall
// back to String comparison, arrays and objects compare structurally, dates
// compare by time.
export function looseEqual(a: unknown, b: unknown): boolean {
  if(a === b) {
    return true;
  }
  if(a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : false;
  }
  if(Array.isArray(a) || Array.isArray(b)) {
    if(!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    for(let i = 0; i < a.length; i += 1) {
      if(!looseEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }
  const aIsObject = a !== null && typeof a === "object";
  const bIsObject = b !== null && typeof b === "object";
  if(aIsObject || bIsObject) {
    if(!aIsObject || !bIsObject) {
      return false;
    }
    const aRecord = a as Record<string, unknown>;
    const bRecord = b as Record<string, unknown>;
    if(Object.keys(aRecord).length !== Object.keys(bRecord).length) {
      return false;
    }
    // Intentionally iterates inherited properties, like upstream's for..in.
    for(const key in aRecord) {
      const aHasKey = Object.prototype.hasOwnProperty.call(aRecord, key);
      const bHasKey = Object.prototype.hasOwnProperty.call(bRecord, key);
      if((aHasKey && !bHasKey) || (!aHasKey && bHasKey) || !looseEqual(aRecord[key], bRecord[key])) {
        return false;
      }
    }
    return true;
  }
  return String(a) === String(b);
}

// Ported from form-select/helpers/mixin-options.js: object options with an
// `options` field become optgroups; other objects become options defaulting
// `value` to `text`; primitives become { value, text, disabled: false }.
// The deprecated object form of `options` (and its `key` fallbacks) is not
// ported.
function normalizeOptions(options: GlFormSelectProps["options"]): NormalizedOptionOrGroup[] {
  if(!Array.isArray(options)) {
    return [];
  }
  return options.map((option): NormalizedOptionOrGroup => {
    if(option !== null && typeof option === "object") {
      const { value, text, html, disabled } = option as {
        value?: unknown;
        text?: string;
        html?: string;
        disabled?: boolean;
      };
      const groupOptions = (option as GlFormSelectOptionGroup).options;
      if(groupOptions !== undefined && groupOptions !== null) {
        return {
          label: String((option as GlFormSelectOptionGroup).label || text),
          options: normalizeOptions(groupOptions) as NormalizedOption[],
        };
      }
      const normalizedValue = value === undefined ? text : value;
      return {
        value: normalizedValue,
        text: String(text === undefined ? normalizedValue : text),
        html,
        disabled: Boolean(disabled),
        domValue: String(normalizedValue),
      };
    }
    return {
      value: option,
      text: String(option),
      disabled: false,
      domValue: String(option),
    };
  });
}

function flatOptions(options: NormalizedOptionOrGroup[]): NormalizedOption[] {
  return options.flatMap((option) => ("options" in option ? option.options : [option]));
}

// bootstrap-vue `isVisible` (vendor/bootstrap-vue/src/utils/dom.js)
function isVisible(element: HTMLElement | null): boolean {
  if(!element || !element.parentNode || !document.body.contains(element)) {
    return false;
  }
  if(getComputedStyle(element).display === "none") {
    return false;
  }
  const rect = element.getBoundingClientRect();
  return Boolean(rect && rect.height > 0 && rect.width > 0);
}

function widthClasses(width: GlFormSelectProps["width"]): string[] {
  if(width === null || width === undefined) {
    return [];
  }
  if(typeof width === "object") {
    const { default: defaultWidth, ...breakpointWidths } = width;
    return [
      ...(defaultWidth ? [`gl-form-select-${defaultWidth}`] : []),
      ...Object.entries(breakpointWidths).map(
        ([breakpoint, breakpointWidth]) => `gl-${breakpoint}-form-select-${breakpointWidth}`,
      ),
    ];
  }
  return [`gl-form-select-${width}`];
}

// Vue class-binding semantics for the `selectClass` prop
function normalizeSelectClass(selectClass: GlFormSelectProps["selectClass"]): string | undefined {
  if(!selectClass) {
    return undefined;
  }
  if(typeof selectClass === "string") {
    return selectClass;
  }
  if(Array.isArray(selectClass)) {
    return selectClass.filter(Boolean).join(" ") || undefined;
  }
  const classes = Object.entries(selectClass)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([name]) => name);
  return classes.length > 0 ? classes.join(" ") : undefined;
}

const selectVariants = cva("gl-form-select custom-select", {
  variants: {
    state: {
      none: null,
      valid: "is-valid",
      invalid: "is-invalid",
    },
  },
});

type SelectElementProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  | "aria-invalid"
  | "autoFocus"
  | "defaultValue"
  | "multiple"
  | "onChange"
  | "onInput"
  | "size"
  | "value"
>;

export type GlFormSelectProps = SelectElementProps & {
  /** Value for the `aria-invalid` attribute. When unset, `state={false}` implies `"true"`. */
  ariaInvalid?: boolean | string;
  /** Attempts to focus the control on mount when visible. Does not set the `autofocus` attribute. */
  autofocus?: boolean;
  /** Additional CSS class(es) merged onto the select element. */
  selectClass?: string | string[] | Record<string, boolean | undefined> | null;
  /** Options rendered before the options generated from `options` (upstream's `first` slot). */
  first?: ReactNode;
  /** Explicit `<option>`/`<optgroup>` elements rendered after the generated options. */
  children?: ReactNode;
  /** Renders a multi-select list box instead of a dropdown; `value` is an array. */
  multiple?: boolean;
  /** The model event: called with the selected value when it changes. */
  onInput?: (value: unknown) => void;
  /** Called with the selected value on user interaction. */
  onChange?: (value: unknown) => void;
  /** Items to render as options; objects with an `options` field render as optgroups. */
  options?: (GlFormSelectOption | GlFormSelectOptionGroup)[];
  /**
   * Number of rows to display in a multi-select list box. The default `0`
   * does not render the `size` attribute (it would hide the dropdown arrows).
   */
  selectSize?: number;
  /** Validation state: `true` valid, `false` invalid, `null` none. */
  state?: boolean | null;
  /** The current value: the value of the selected option, or an array when `multiple`. */
  value?: unknown;
  /** Maximum width of the select, either fixed or responsive per breakpoint. */
  width?: GlFormSelectWidth | GlFormSelectResponsiveWidth | null;
};

const GlFormSelect = forwardRef<HTMLSelectElement, GlFormSelectProps>(function GlFormSelect({
  ariaInvalid = false,
  autofocus = false,
  children,
  className,
  disabled = false,
  first,
  form,
  id,
  multiple = false,
  name,
  onChange,
  onInput,
  options = [],
  required = false,
  selectClass,
  selectSize = 0,
  state = null,
  value,
  width = null,
  ...elementProps
}, forwardedRef) {
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const selectRef = useRef<HTMLSelectElement | null>(null);
  // Typed option values stashed per <option> element (upstream's `_value`).
  const optionValuesRef = useRef(new WeakMap<HTMLOptionElement, unknown>());

  // Internal value seeded from the `value` prop, mirroring upstream's
  // `localValue`. The prop watcher maps to a render-phase adjustment so the
  // selection stays in sync before paint.
  const [localValue, setLocalValue] = useState<unknown>(value);
  const [prevValue, setPrevValue] = useState(value);
  if(!Object.is(prevValue, value)) {
    setPrevValue(value);
    setLocalValue(value);
  }

  const computedState = typeof state === "boolean" ? state : null;

  const formOptions = normalizeOptions(options);
  const normalized = flatOptions(formOptions);

  // Maps a typed model value to the DOM value of the matching option, using
  // upstream's looseEqual. Falls back to the stringified value, which matches
  // no option and leaves the select without a selection (selectedIndex -1),
  // like upstream's v-model.
  const domValueFor = (modelValue: unknown): string => {
    const match = normalized.find((option) => looseEqual(option.value, modelValue));
    return match ? match.domValue : String(modelValue);
  };

  const selectDomValue: string | string[] = multiple
    ? (Array.isArray(localValue) ? localValue.map(domValueFor) : [])
    : domValueFor(localValue);

  // Upstream `onChange`: collects the selected values (typed via the stashed
  // option values, like `'_value' in o ? o._value : o.value`), updates the
  // model, and emits input then change.
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const { target } = event;
    const selectedValues = Array.from(target.options)
      .filter((option) => option.selected)
      .map((option) => (
        optionValuesRef.current.has(option) ? optionValuesRef.current.get(option) : option.value
      ));
    const newValue = target.multiple ? selectedValues : selectedValues[0];
    setLocalValue(newValue);
    onInput?.(newValue);
    onChange?.(newValue);
  }

  // Upstream `handleAutofocus`: focus on mount when `autofocus` is set and the
  // control is visible.
  useEffect(() => {
    if(!autofocus) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const select = selectRef.current;
      if(select && !select.disabled && isVisible(select)) {
        select.focus();
      }
    });
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let computedAriaInvalid: SelectHTMLAttributes<HTMLSelectElement>["aria-invalid"];
  if(ariaInvalid === true || ariaInvalid === "true" || ariaInvalid === "") {
    computedAriaInvalid = "true";
  } else if(computedState === false) {
    computedAriaInvalid = "true";
  } else if(typeof ariaInvalid === "string" && ariaInvalid) {
    computedAriaInvalid = ariaInvalid as "true" | "false" | "grammar" | "spelling";
  }

  const computedClass = selectVariants({
    className: [normalizeSelectClass(selectClass), className].filter(Boolean).join(" ") || undefined,
    state: computedState === true ? "valid" : computedState === false ? "invalid" : "none",
  });

  const renderOption = (option: NormalizedOption, key: number) => {
    const stashValue = (element: HTMLOptionElement | null) => {
      if(element) {
        optionValuesRef.current.set(element, option.value);
      }
    };
    return option.html ? (
      <option
        key={key}
        ref={stashValue}
        disabled={option.disabled}
        value={option.domValue}
        dangerouslySetInnerHTML={{ __html: option.html }} />
    ) : (
      <option
        key={key}
        ref={stashValue}
        disabled={option.disabled}
        value={option.domValue}>
        {option.text}
      </option>
    );
  };

  return (
    <span className={["gl-form-select-wrapper", ...widthClasses(width)].join(" ")}>
      <select
        {...elementProps}
        ref={(element: HTMLSelectElement | null) => {
          selectRef.current = element;
          if(typeof forwardedRef === "function") {
            forwardedRef(element);
          } else if(forwardedRef) {
            forwardedRef.current = element;
          }
        }}
        aria-invalid={computedAriaInvalid}
        aria-required={required ? true : undefined}
        className={computedClass}
        disabled={disabled}
        form={form}
        id={id ?? `gl-form-select-${generatedId}`}
        multiple={multiple}
        name={name}
        onChange={handleChange}
        required={required}
        size={selectSize === 0 ? undefined : selectSize}
        value={selectDomValue}>
        {first}
        {formOptions.map((option, index) => (
          "options" in option ? (
            <optgroup key={index} label={option.label}>
              {option.options.map((groupOption, groupIndex) => renderOption(groupOption, groupIndex))}
            </optgroup>
          ) : renderOption(option, index)
        ))}
        {children}
      </select>
    </span>
  );
});

export default GlFormSelect;
