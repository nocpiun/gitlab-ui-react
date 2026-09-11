/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/toggle/toggle.vue
 */

import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import { cva } from "class-variance-authority";
import { useMergedRefs } from "../../internal/utils/merge-refs";
import GlIcon from "../icon/icon";
import GlLoadingIcon from "../loading-icon/loading-icon";

export type GlToggleLabelPosition = "top" | "left" | "hidden";

type ToggleButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "defaultValue" | "disabled" | "name" | "type" | "value"
>;

export type GlToggleWrapperProps = Omit<HTMLAttributes<HTMLDivElement>, "children">;

export type GlToggleProps = ToggleButtonProps & {
  /** Initial state when used uncontrolled. */
  defaultValue?: boolean;
  /** Description text below the label. Only rendered in vertical layouts (`top`/`hidden`). */
  description?: ReactNode;
  /** Whether the toggle is disabled. */
  disabled?: boolean;
  /** Help text below the toggle, linked via `aria-describedby`. Only rendered in vertical layouts. */
  help?: ReactNode;
  /** Whether a spinner replaces the thumb and activation is prevented. */
  loading?: boolean;
  /** The toggle's label; used as the switch's accessible name via `aria-labelledby`. */
  label?: ReactNode;
  /** ID of the label element. Defaults to a generated ID. */
  labelId?: string;
  /**
   * The label's position relative to the toggle. `hidden` visually hides the
   * label while keeping it accessible to screen readers.
   */
  labelPosition?: GlToggleLabelPosition;
  /** Name attribute for a hidden input element carrying the value. */
  name?: string;
  /** Called with the next value when the toggle is activated. */
  onValueChange?: (value: boolean) => void;
  /** The controlled value. */
  value?: boolean;
  /** Attributes applied to the outer layout element. */
  wrapperProps?: GlToggleWrapperProps;
};

const wrapperVariants = cva(["gl-toggle-wrapper", "gl-mb-0", "gl-flex"], {
  variants: {
    layout: {
      inline: "gl-toggle-label-inline",
      vertical: "gl-flex-col",
    },
    disabled: {
      false: null,
      true: "is-disabled",
    },
  },
});

const labelVariants = cva(["gl-toggle-label", "gl-shrink-0"], {
  variants: {
    hidden: {
      false: null,
      true: "gl-sr-only",
    },
    spacing: {
      description: "gl-mb-2",
      plain: "gl-mb-3",
    },
  },
});

const toggleVariants = cva(["gl-toggle", "gl-shrink-0"], {
  variants: {
    checked: {
      false: null,
      true: "is-checked",
    },
    disabled: {
      false: null,
      true: "is-disabled",
    },
    loading: {
      false: null,
      true: "is-loading",
    },
  },
});

const GlToggle = forwardRef<HTMLButtonElement, GlToggleProps>(function GlToggle({
  className,
  defaultValue,
  description,
  disabled = false,
  form,
  help,
  label,
  labelId: labelIdProp,
  labelPosition = "top",
  loading = false,
  name,
  onClick,
  onValueChange,
  value,
  wrapperProps,
  ...buttonProps
}, forwardedRef) {
  const generatedId = useId();
  const labelId = labelIdProp ?? `toggle-label-${generatedId}`;
  const helpId = `toggle-help-${generatedId}`;

  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(Boolean(defaultValue));
  const checked = isControlled ? value : uncontrolledValue;
  const effectiveDisabled = disabled || loading;
  const buttonElementRef = useRef<HTMLButtonElement | null>(null);
  const buttonRef = useMergedRefs(buttonElementRef, forwardedRef);
  const { className: wrapperClassName, ...wrapperElementProps } = wrapperProps ?? {};

  // A toggle is a composite control, so the browser cannot reset its React
  // state through the hidden input. Restore the uncontrolled state when its
  // associated form is reset.
  useEffect(() => {
    if(isControlled) return undefined;

    const button = buttonElementRef.current;
    const associatedForm = button?.form;
    if(!button || !associatedForm) return undefined;

    const handleReset = (event: Event) => {
      queueMicrotask(() => {
        if(!event.defaultPrevented && buttonElementRef.current === button) {
          setUncontrolledValue(Boolean(defaultValue));
        }
      });
    };
    associatedForm.addEventListener("reset", handleReset);
    return () => associatedForm.removeEventListener("reset", handleReset);
  }, [defaultValue, form, isControlled]);

  const isVerticalLayout = labelPosition !== "left";
  const shouldRenderDescription = Boolean(description) && isVerticalLayout;
  const shouldRenderHelp = Boolean(help) && isVerticalLayout;

  const toggleFeature: MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick?.(event);
    if(event.defaultPrevented || effectiveDisabled) return;

    const nextValue = !checked;
    if(!isControlled) setUncontrolledValue(nextValue);
    onValueChange?.(nextValue);
  };

  return (
    <div
      data-testid="toggle-wrapper"
      {...wrapperElementProps}
      className={wrapperVariants({
        className: wrapperClassName,
        disabled: effectiveDisabled,
        layout: isVerticalLayout ? "vertical" : "inline",
      })}>
      <span
        className={labelVariants({
          hidden: labelPosition === "hidden",
          spacing: shouldRenderDescription ? "description" : "plain",
        })}
        data-testid="toggle-label"
        id={labelId}>
        {label}
      </span>
      {shouldRenderDescription ? (
        <span className="gl-description-label gl-mb-3" data-testid="toggle-description">
          {description}
        </span>
      ) : null}
      {name ? <input form={form} name={name} type="hidden" value={String(checked)} /> : null}
      <button
        {...buttonProps}
        aria-checked={checked}
        aria-describedby={shouldRenderHelp ? helpId : undefined}
        aria-disabled={effectiveDisabled || undefined}
        aria-labelledby={labelId}
        className={toggleVariants({
          checked,
          className,
          disabled: effectiveDisabled,
          loading,
        })}
        disabled={effectiveDisabled}
        form={form}
        onClick={toggleFeature}
        ref={buttonRef}
        role="switch"
        type="button">
        {loading ? (
          <GlLoadingIcon className="toggle-loading" color="dark" />
        ) : (
          <span className="toggle-icon">
            <GlIcon name={checked ? "check-xs" : "close-xs"} size={12} />
          </span>
        )}
      </button>
      {shouldRenderHelp ? (
        <span className="gl-help-label" data-testid="toggle-help" id={helpId}>
          {help}
        </span>
      ) : null}
    </div>
  );
});

export default GlToggle;
