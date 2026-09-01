/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/form/form_select/form_select.vue
 *
 * Adaptations:
 * - Upstream's `options` array and option-normalization props are replaced by
 *   the compound GlFormSelectItem and GlFormSelectGroup components.
 * - The native `<select>` is intentionally retained instead of replacing it
 *   with a custom listbox. This preserves upstream's form, keyboard, mobile,
 *   and accessibility semantics while allowing idiomatic React composition.
 * - Vue's `v-model` maps to React's controlled `value` or uncontrolled
 *   `defaultValue`; `onInput` and `onChange` receive the selected string (or
 *   a string array in multiple mode).
 * - `className` applies to the select and `wrapperClassName` applies to the
 *   structural wrapper that draws the chevron.
 */

import {
  forwardRef,
  useId,
  type ChangeEvent,
  type OptgroupHTMLAttributes,
  type OptionHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { cva } from "class-variance-authority";
import { normalizeAriaInvalid } from "../../internal/form/aria-invalid-utils";

export type GlFormSelectValue = string | readonly string[];

export type GlFormSelectWidth = "xs" | "sm" | "md" | "lg" | "xl";

/** Responsive widths: `default` is the base width; other keys apply at their breakpoint. */
export type GlFormSelectResponsiveWidth = Partial<
  Record<"default" | "sm" | "md" | "lg" | "xl", GlFormSelectWidth>
>;

type SelectElementProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  | "aria-invalid"
  | "children"
  | "className"
  | "defaultValue"
  | "onChange"
  | "onInput"
  | "value"
>;

export type GlFormSelectProps = SelectElementProps & {
  /** Value for `aria-invalid`. When unset, `state={false}` implies `"true"`. */
  ariaInvalid?: boolean | string;
  /** GlFormSelectItem and GlFormSelectGroup children. */
  children?: ReactNode;
  /** Additional CSS class(es) merged onto the select element. */
  className?: string;
  /** Initial value for an uncontrolled select. */
  defaultValue?: GlFormSelectValue;
  /** Called with the selected value on user interaction. */
  onChange?: (value: GlFormSelectValue) => void;
  /** The model callback, called before `onChange` with the selected value. */
  onInput?: (value: GlFormSelectValue) => void;
  /** Validation state: `true` valid, `false` invalid, `null` none. */
  state?: boolean | null;
  /** Current value for a controlled select. */
  value?: GlFormSelectValue;
  /** Maximum width of the control, either fixed or responsive per breakpoint. */
  width?: GlFormSelectWidth | GlFormSelectResponsiveWidth | null;
  /** Additional CSS class(es) merged onto the chevron wrapper. */
  wrapperClassName?: string;
};

export type GlFormSelectItemProps = Omit<
  OptionHTMLAttributes<HTMLOptionElement>,
  "value"
> & {
  /** String value submitted and emitted when the item is selected. */
  value: string;
};

export type GlFormSelectGroupProps = Omit<
  OptgroupHTMLAttributes<HTMLOptGroupElement>,
  "label"
> & {
  /** Accessible and visible label for the option group. */
  label: string;
};

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

const selectVariants = cva("gl-form-select custom-select", {
  variants: {
    state: {
      none: null,
      valid: "is-valid",
      invalid: "is-invalid",
    },
  },
});

const GlFormSelect = forwardRef<HTMLSelectElement, GlFormSelectProps>(function GlFormSelect({
  ariaInvalid = false,
  children,
  className,
  defaultValue,
  id,
  onChange,
  onInput,
  required = false,
  state = null,
  value,
  width = null,
  wrapperClassName,
  ...elementProps
}, forwardedRef) {
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const computedState = typeof state === "boolean" ? state : null;
  const computedAriaInvalid = normalizeAriaInvalid(ariaInvalid, computedState);

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const selectedValue = event.currentTarget.multiple
      ? Array.from(event.currentTarget.selectedOptions, (option) => option.value)
      : event.currentTarget.value;

    onInput?.(selectedValue);
    onChange?.(selectedValue);
  }

  return (
    <span
      className={[
        "gl-form-select-wrapper",
        ...widthClasses(width),
        wrapperClassName,
      ].filter(Boolean).join(" ")}>
      <select
        {...elementProps}
        ref={forwardedRef}
        aria-invalid={computedAriaInvalid}
        aria-required={required || undefined}
        className={selectVariants({
          className,
          state: computedState === true ? "valid" : computedState === false ? "invalid" : "none",
        })}
        defaultValue={defaultValue}
        id={id ?? `gl-form-select-${generatedId}`}
        onChange={handleChange}
        required={required}
        value={value}>
        {children}
      </select>
    </span>
  );
});

export const GlFormSelectItem = forwardRef<HTMLOptionElement, GlFormSelectItemProps>(
  function GlFormSelectItem({ children, ...optionProps }, forwardedRef) {
    return (
      <option {...optionProps} ref={forwardedRef}>
        {children}
      </option>
    );
  },
);

export const GlFormSelectGroup = forwardRef<HTMLOptGroupElement, GlFormSelectGroupProps>(
  function GlFormSelectGroup({ children, ...groupProps }, forwardedRef) {
    return (
      <optgroup {...groupProps} ref={forwardedRef}>
        {children}
      </optgroup>
    );
  },
);

export default GlFormSelect;
