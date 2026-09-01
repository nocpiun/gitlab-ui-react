/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/form/form_select/form_select.vue
 *
 * Adaptations:
 * - The `v-model` pair maps to the `value` prop plus `onInput` (the model
 *   event) and `onChange` (the native `change` event; both carry the selected
 *   option value(s) in their original type). Unlike upstream, an external
 *   `value` change does not re-emit `onInput`.
 * - Vue's class fallthrough maps to `className` on the wrapper `<span>`; the
 *   `selectClass` prop (string) is merged onto the `<select>` element.
 * - The `first` slot maps to the `first` prop (rendered before the generated
 *   options); explicit `<option>`/`<optgroup>` markup goes in `children`,
 *   rendered after them.
 * - Option values keep their original type (including non-strings): the
 *   generated options are encoded into positional DOM values and mapped back
 *   on change, like bootstrap-vue's `_value` DOM property.
 * - The `html` option field renders raw HTML (`dangerouslySetInnerHTML`),
 *   matching upstream's `htmlOrText`; consumers must sanitize it themselves.
 * - The fallback select ID is generated with `useId` during render (SSR-safe)
 *   instead of upstream's post-mount `__BVID__`.
 * - The forwarded ref exposes the underlying `<select>` element, covering
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
import { normalizeAriaInvalid } from "../../internal/form/aria-invalid-utils";
import { mergeRefs } from "../../internal/utils/merge-refs";

export type GlFormSelectWidth = "xs" | "sm" | "md" | "lg" | "xl";

/** Responsive widths: `default` for the base width, breakpoints for `gl-{breakpoint}-form-select-{width}`. */
export type GlFormSelectResponsiveWidth = Partial<
  Record<"default" | "sm" | "md" | "lg" | "xl", GlFormSelectWidth>
>;

/**
 * An option value in its original type (strings, numbers, objects, …).
 * In `multiple` mode the model value is an array of these.
 */
export type GlFormSelectValue = unknown;

/** An `<option>` description. Custom field names are supported via the `*Field` props. */
export type GlFormSelectOption = {
  value?: GlFormSelectValue;
  text?: string;
  /** Raw HTML rendered instead of `text` when set. Not sanitized. */
  html?: string;
  disabled?: boolean;
  [field: string]: unknown;
};

/** An `<optgroup>` description. Custom field names are supported via `labelField`/`optionsField`. */
export type GlFormSelectOptionGroup = {
  label?: string;
  options?: (GlFormSelectOption | string | number)[];
  [field: string]: unknown;
};

type NativeSelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  | "aria-invalid"
  | "autoFocus"
  | "children"
  | "className"
  | "defaultValue"
  | "multiple"
  | "onChange"
  | "onInput"
  | "size"
  | "value"
>;

export type GlFormSelectProps = NativeSelectProps & {
  /** Value for the `aria-invalid` attribute. When unset, `state={false}` implies `"true"`. */
  ariaInvalid?: boolean | string;
  /** Attempts to focus the select on mount when visible. Does not set the `autofocus` attribute. */
  autofocus?: boolean;
  /** Additional CSS class(es) merged onto the wrapper element. */
  className?: string;
  /** Explicit `<option>`/`<optgroup>` markup, rendered after the generated options (upstream's default slot). */
  children?: ReactNode;
  /** Field name for the disabled flag of an option object. */
  disabledField?: string;
  /** Rendered before the generated options (upstream's `first` slot). */
  first?: ReactNode;
  /** Field name for the raw HTML of an option object. */
  htmlField?: string;
  /** Field name for the label of an option group object. */
  labelField?: string;
  /** Renders a multi-select listbox. The model value is an array. */
  multiple?: boolean;
  /** Called with the selected value(s) on the native `change` event, after `onInput`. */
  onChange?: (value: GlFormSelectValue) => void;
  /** The model event: called with the selected value(s) on user interaction. */
  onInput?: (value: GlFormSelectValue) => void;
  /**
   * Options to render: option/group objects, plain values, or a deprecated
   * `value`-keyed object map. Mutually exclusive with explicit `children`.
   */
  options?: (GlFormSelectOption | GlFormSelectOptionGroup | string | number)[] | Record<string, unknown>;
  /** Field name for the options of an option group object. */
  optionsField?: string;
  /** Renders the Bootstrap `form-control` styling hooks instead of `custom-select`. */
  plain?: boolean;
  /** Additional CSS class(es) merged onto the `<select>` element. */
  selectClass?: string;
  /**
   * Number of rows to display. A custom (non-plain) select with the default
   * `0` renders no `size` attribute so the dropdown arrow stays visible.
   */
  selectSize?: number;
  /** Control size variant, appended to the Bootstrap class. */
  size?: "sm" | "lg";
  /** Validation state: `true` valid, `false` invalid, `null` none. */
  state?: boolean | null;
  /** Field name for the text of an option object. */
  textField?: string;
  /** The current value of the select (an array in `multiple` mode). */
  value?: GlFormSelectValue;
  /** Field name for the value of an option object. */
  valueField?: string;
  /** Maximum width of the select, either fixed or responsive per breakpoint. */
  width?: GlFormSelectWidth | GlFormSelectResponsiveWidth | null;
};

// --- bootstrap-vue helpers (vendor/bootstrap-vue/src/utils) ---

type UnknownRecord = Record<string, unknown>;

function isObject(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === "object";
}

function isPlainObject(value: unknown): value is UnknownRecord {
  return Object.prototype.toString.call(value) === "[object Object]";
}

/** bootstrap-vue `getRaw`/`get`: dot/array-notation property access, `null` when missing. */
function get(obj: unknown, path: string, defaultValue: unknown = null): unknown {
  if(!path || !isObject(obj)) {
    return defaultValue;
  }
  // Handle edge case where the key itself contains dot(s)
  if(path in obj) {
    const value = obj[path];
    return value === undefined || value === null ? defaultValue : value;
  }
  const steps = path.replace(/\[(\d+)]/g, ".$1").split(".").filter(Boolean);
  if(steps.length === 0) {
    return defaultValue;
  }
  let current: unknown = obj;
  const found = steps.every((step) => {
    if(!isObject(current) || !(step in current)) {
      return false;
    }
    current = current[step];
    return current !== undefined && current !== null;
  });
  const value = found ? current : current === null ? null : undefined;
  return value === undefined || value === null ? defaultValue : value;
}

/** bootstrap-vue `stripTags`: removes anything that looks like an HTML tag. */
function stripTags(text = ""): string {
  return String(text).replace(/(<([^>]+)>)/gi, "");
}

/** Vue 2 `looseEqual`, used by the `v-model` select directive to match values. */
function looseEqual(a: unknown, b: unknown): boolean {
  if(a === b) {
    return true;
  }
  const isObjectA = isObject(a);
  const isObjectB = isObject(b);
  if(isObjectA && isObjectB) {
    const isArrayA = Array.isArray(a);
    const isArrayB = Array.isArray(b);
    if(isArrayA && isArrayB) {
      return a.length === (b as unknown[]).length
        && a.every((entry, index) => looseEqual(entry, (b as unknown[])[index]));
    }
    if(isArrayA || isArrayB) {
      return false;
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    return keysA.length === keysB.length
      && keysA.every((key) => looseEqual(a[key], b[key]));
  }
  if(!isObjectA && !isObjectB) {
    return String(a) === String(b);
  }
  return false;
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

// --- option normalization (form-select/helpers/mixin-options.js) ---

type NormalizedOption = {
  value: GlFormSelectValue;
  text: string;
  html: unknown;
  disabled: boolean;
};

type NormalizedGroup = {
  label: string;
  options: NormalizedOption[];
};

type OptionFields = {
  disabledField: string;
  htmlField: string;
  labelField: string;
  optionsField: string;
  textField: string;
  valueField: string;
};

/** `formOptionsMixin.normalizeOption`: also used for the options of a group (tags stripped). */
function normalizePlainOption(
  option: unknown,
  key: string | null,
  fields: OptionFields,
): NormalizedOption {
  if(isPlainObject(option)) {
    const value = get(option, fields.valueField);
    const text = get(option, fields.textField);
    return {
      value: value === undefined ? key || text : value,
      text: stripTags(String(text === undefined ? key : text)),
      html: get(option, fields.htmlField),
      disabled: Boolean(get(option, fields.disabledField)),
    };
  }
  return {
    value: key || option,
    text: stripTags(String(option)),
    disabled: false,
    html: undefined,
  };
}

/** `optionsMixin.normalizeOption`: top-level options and option groups (tags kept). */
function normalizeOption(
  option: unknown,
  key: string | null,
  fields: OptionFields,
): NormalizedOption | NormalizedGroup {
  if(isPlainObject(option)) {
    const value = get(option, fields.valueField);
    const text = get(option, fields.textField);
    const options = get(option, fields.optionsField, null);
    // When it has options, create an `<optgroup>` object
    if(options !== null) {
      return {
        label: String(get(option, fields.labelField) || text),
        options: normalizeOptions(options, fields, normalizePlainOption) as NormalizedOption[],
      };
    }
    return {
      value: value === undefined ? key || text : value,
      text: String(text === undefined ? key : text),
      html: get(option, fields.htmlField),
      disabled: Boolean(get(option, fields.disabledField)),
    };
  }
  return {
    value: key || option,
    text: String(option),
    disabled: false,
    html: undefined,
  };
}

function normalizeOptions(
  options: unknown,
  fields: OptionFields,
  normalize: typeof normalizeOption = normalizeOption,
): (NormalizedOption | NormalizedGroup)[] {
  if(Array.isArray(options)) {
    return options.map((option) => normalize(option, null, fields));
  }
  if(isPlainObject(options)) {
    // eslint-disable-next-line no-console
    console.warn(
      "[BootstrapVue warn]: GlFormSelect - Setting prop \"options\" to an object is deprecated. Use the array format instead.",
    );
    return Object.keys(options).map((key) => normalize(options[key] || {}, key, fields));
  }
  return [];
}

function isGroup(option: NormalizedOption | NormalizedGroup): option is NormalizedGroup {
  return "options" in option;
}

// --- component ---

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

const selectVariants = cva("gl-form-select", {
  variants: {
    kind: {
      custom: "custom-select",
      plain: "form-control",
    },
    state: {
      none: null,
      valid: "is-valid",
      invalid: "is-invalid",
    },
  },
});

const GlFormSelect = forwardRef<HTMLSelectElement, GlFormSelectProps>(function GlFormSelect({
  ariaInvalid = false,
  autofocus = false,
  children,
  className,
  disabled = false,
  disabledField = "disabled",
  first,
  form,
  htmlField = "html",
  id,
  labelField = "label",
  multiple = false,
  name,
  onChange,
  onInput,
  options = [],
  optionsField = "options",
  plain = false,
  required = false,
  selectClass,
  selectSize = 0,
  size,
  state = null,
  textField = "text",
  value,
  valueField = "value",
  width = null,
  ...elementProps
}, forwardedRef) {
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const selectRef = useRef<HTMLSelectElement | null>(null);

  const computedState = typeof state === "boolean" ? state : null;

  // `localValue` mirrors upstream's `data.localValue`: initialized from the
  // `value` prop, updated on user interaction, synced when the prop changes.
  const [localValue, setLocalValue] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  if(!Object.is(prevValue, value)) {
    setPrevValue(value);
    setLocalValue(value);
  }

  const normalizedOptions = normalizeOptions(options, {
    disabledField,
    htmlField,
    labelField,
    optionsField,
    textField,
    valueField,
  });

  // The DOM can only carry string option values; each generated option gets a
  // positional value mapped back to the original value on change (upstream's
  // `_value` DOM property).
  const leafValues: GlFormSelectValue[] = [];
  const renderedOptions = normalizedOptions.map((option, optionIndex) => {
    if(isGroup(option)) {
      return (
        <optgroup key={`option_${optionIndex}`} label={option.label}>
          {option.options.map((groupOption) => {
            const key = String(leafValues.push(groupOption.value) - 1);
            return groupOption.html
              ? (
                <option
                  key={key}
                  disabled={groupOption.disabled}
                  value={key}
                  dangerouslySetInnerHTML={{ __html: String(groupOption.html) }} />
              )
              : (
                <option key={key} disabled={groupOption.disabled} value={key}>
                  {groupOption.text}
                </option>
              );
          })}
        </optgroup>
      );
    }
    const key = String(leafValues.push(option.value) - 1);
    return option.html
      ? (
        <option
          key={key}
          disabled={option.disabled}
          value={key}
          dangerouslySetInnerHTML={{ __html: String(option.html) }} />
      )
      : (
        <option key={key} disabled={option.disabled} value={key}>
          {option.text}
        </option>
      );
  });

  const encodeValue = (optionValue: GlFormSelectValue): string => {
    const index = leafValues.findIndex((leafValue) => looseEqual(leafValue, optionValue));
    return index === -1 ? "" : String(index);
  };
  const domValue = multiple
    ? (Array.isArray(localValue) ? localValue.map(encodeValue) : [])
    : encodeValue(localValue);

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const { target } = event;
    const selectedValues = Array.from(target.selectedOptions)
      .map((option) => leafValues[Number(option.value)]);
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

  // Custom selects with a size of zero would hide the dropdown arrow, so the
  // `size` attribute is not rendered in that case.
  const computedSelectSize = !plain && selectSize === 0 ? undefined : selectSize;

  const computedClass = selectVariants({
    className: [
      size && (plain ? `form-control-${size}` : `custom-select-${size}`),
      selectClass,
    ].filter(Boolean).join(" ") || undefined,
    kind: plain ? "plain" : "custom",
    state: computedState === true ? "valid" : computedState === false ? "invalid" : "none",
  });

  const wrapperClass = ["gl-form-select-wrapper", ...widthClasses(width), className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={wrapperClass}>
      <select
        {...elementProps}
        ref={mergeRefs(selectRef, forwardedRef)}
        aria-invalid={normalizeAriaInvalid(ariaInvalid, computedState)}
        aria-required={required ? true : undefined}
        className={computedClass}
        disabled={disabled}
        form={form}
        id={id ?? `gl-form-select-${generatedId}`}
        multiple={multiple}
        name={name}
        onChange={handleChange}
        required={required}
        size={computedSelectSize}
        value={domValue}>
        {first}
        {renderedOptions}
        {children}
      </select>
    </span>
  );
});

export default GlFormSelect;
