/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/toggle/toggle.vue
 */

import {
  forwardRef,
  useId,
  useState,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cva } from "class-variance-authority";
import GlIcon from "../icon/icon";
import GlLoadingIcon from "../loading-icon/loading-icon";

export type GlToggleLabelPosition = "top" | "left" | "hidden";

type ToggleElementProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange"
>;

export type GlToggleProps = ToggleElementProps & {
  /** Initial state when used uncontrolled. */
  defaultValue?: boolean;
  /** Description text below the label. Only rendered in vertical layouts (`top`/`hidden`). */
  description?: ReactNode;
  /** Whether the toggle is disabled. */
  disabled?: boolean;
  /** Help text below the toggle, linked via `aria-describedby`. Only rendered in vertical layouts. */
  help?: ReactNode;
  /** Whether the toggle is in the loading state: a spinner replaces the thumb. */
  isLoading?: boolean;
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
  /** Called with the next state when the toggle is activated. */
  onChange?: (value: boolean) => void;
  /** The toggle's state. */
  value?: boolean;
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
  help,
  isLoading = false,
  label,
  labelId: labelIdProp,
  labelPosition = "top",
  name,
  onChange,
  value,
  ...elementProps
}, forwardedRef) {
  const generatedId = useId();
  const labelId = labelIdProp ?? `toggle-label-${generatedId}`;
  const helpId = `toggle-help-${generatedId}`;

  const [uncontrolledValue, setUncontrolledValue] = useState(Boolean(defaultValue));
  const checked = value ?? uncontrolledValue;

  const isVerticalLayout = labelPosition !== "left";
  const shouldRenderDescription = Boolean(description) && isVerticalLayout;
  const shouldRenderHelp = Boolean(help) && isVerticalLayout;

  const toggleFeature = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if(disabled) return;

    const nextValue = !checked;
    setUncontrolledValue(nextValue);
    onChange?.(nextValue);
  };

  return (
    <div
      {...elementProps}
      className={wrapperVariants({
        className,
        disabled,
        layout: isVerticalLayout ? "vertical" : "inline",
      })}
      data-testid="toggle-wrapper">
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
      {name ? <input name={name} type="hidden" value={String(checked)} /> : null}
      <button
        aria-checked={checked}
        aria-describedby={shouldRenderHelp ? helpId : undefined}
        aria-disabled={disabled || undefined}
        aria-labelledby={labelId}
        className={toggleVariants({ checked, disabled: disabled || isLoading, loading: isLoading })}
        disabled={disabled}
        onClick={toggleFeature}
        ref={forwardedRef}
        role="switch"
        type="button">
        {isLoading ? (
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
