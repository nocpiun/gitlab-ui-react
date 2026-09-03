/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/form/form_password_input/form_password_input.vue
 *
 * Adaptations:
 * - The `v-model` pair maps to the controlled `value` prop plus the `onInput`
 *   callback forwarded to the inner GlFormInput (upstream forwards all
 *   listeners with `v-on="$listeners"`); `onChange`/`onUpdate`/`onBlur` and
 *   the other GlFormInput props pass through as well.
 * - The `visibility-change` event maps to the `onVisibilityChange` callback.
 * - The `v-gl-tooltip` directive on the toggle maps to wrapping the button in
 *   GlTooltip (Base UI trigger composition).
 * - The i18n defaults for the toggle labels resolve to the upstream English
 *   defaults; this package has no i18n runtime.
 * - Additional attributes are forwarded to the inner input, like upstream's
 *   `v-bind="$attrs"`; `className` and `style` are applied to the root
 *   wrapper, matching Vue's class/style fallthrough with
 *   `inheritAttrs: false`. A consumer-passed `type` is not accepted: the
 *   component keeps control of it, like upstream.
 * - The inherited `width` prop constrains the root wrapper instead of the
 *   input: the toggle button is positioned against the wrapper, so this keeps
 *   the toggle aligned with the constrained input (upstream leaves it at the
 *   full-width wrapper's edge; deliberate fix).
 * - The forwarded ref exposes the underlying `<input>` element.
 * - Upstream's `inputClass` prop (String | Array | Object) maps to the
 *   React-idiomatic string-only `inputClassName`, applied to the inner input
 *   like upstream's `:class="inputClass"`; `className` stays on the wrapper.
 * - Deliberate deviation: the disabled toggle follows this repo's GlButton
 *   policy (`focusableWhenDisabled`): it renders `aria-disabled="true"`,
 *   stays in the tab order, and suppresses activation, instead of upstream's
 *   native `disabled` attribute. This also keeps the toggle's tooltip
 *   available while disabled, which a natively disabled button cannot do.
 */

import { forwardRef, useState, type CSSProperties } from "react";
import { clsx } from "cn";
import GlButton from "../button/button";
import GlFormInput, { type GlFormInputProps, widthClasses } from "../form-input/form-input";
import GlTooltip from "../tooltip/tooltip";

export type GlFormPasswordInputProps = Omit<
  GlFormInputProps,
  | "className"
  | "disabled"
  | "style"
  | "type"
  | "value"
> & {
  /** Additional CSS class(es) merged onto the root wrapper. */
  className?: string;
  /**
   * Additional CSS class(es) applied to the inner input element, not the
   * wrapper. Use it for hooks or styles that must target the input itself,
   * since `className` lands on the wrapper.
   */
  inputClassName?: string;
  /**
   * Disables the field and its toggle. Neither is in the tab order and the
   * value is not submitted with the form. To prevent edits while keeping the
   * value readable, copyable and submitted, use `readOnly` instead.
   */
  disabled?: boolean;
  /** Accessible label and tooltip for the toggle button while the value is revealed. */
  hideLabel?: string;
  /** Whether the value is revealed (unmasked) on initial render. */
  initialVisibility?: boolean;
  /** Called when the reveal/hide button is clicked, with the new visibility. */
  onVisibilityChange?: (visible: boolean) => void;
  /** Accessible label and tooltip for the toggle button while the value is masked. */
  revealLabel?: string;
  /** Inline style applied to the root wrapper (Vue's style fallthrough). */
  style?: CSSProperties;
  /** The input's value. */
  value?: string;
};

const GlFormPasswordInput = forwardRef<HTMLInputElement, GlFormPasswordInputProps>(
  function GlFormPasswordInput({
    className,
    inputClassName,
    disabled = false,
    // Upstream defaults resolve through its i18n runtime (`translate`); this
    // package has none, so the upstream English defaults are used directly.
    hideLabel = "Hide password",
    initialVisibility = false,
    onInput,
    onVisibilityChange,
    revealLabel = "Reveal password",
    style,
    value = "",
    width = null,
    ...inputProps
  }, forwardedRef) {
    const [isMasked, setIsMasked] = useState(!initialVisibility);

    const toggleLabel = isMasked ? revealLabel : hideLabel;

    function toggleVisibility() {
      const visible = isMasked;
      setIsMasked(!isMasked);
      onVisibilityChange?.(visible);
    }

    return (
      <div
        className={clsx("gl-form-password-input", widthClasses(width), className)}
        style={style}>
        <GlFormInput
          {...inputProps}
          ref={forwardedRef}
          className={clsx("gl-form-password-input-field", inputClassName)}
          disabled={disabled}
          onInput={onInput}
          type={isMasked ? "password" : "text"}
          value={value} />
        <GlTooltip title={toggleLabel}>
          <GlButton
            aria-label={toggleLabel}
            category="tertiary"
            className="gl-form-password-input-toggle"
            disabled={disabled}
            icon={isMasked ? "eye" : "eye-slash"}
            onClick={toggleVisibility}
            size="small" />
        </GlTooltip>
      </div>
    );
  },
);

export default GlFormPasswordInput;
