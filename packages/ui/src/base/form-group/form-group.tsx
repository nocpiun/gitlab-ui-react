/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/form/form_group/form_group.vue
 * packages/gitlab-ui/src/vendor/bootstrap-vue/src/components/form-group/form-group.js
 *
 * Adaptations:
 * - Vue slots map to typed React nodes: `label`, `labelDescription`,
 *   `description`, `invalidFeedback`, `validFeedback`, and `children`.
 *   The upstream label slot's opt-out of the optional indicator does not map
 *   to React (there is a single `label` prop); compose `label` manually and
 *   leave `optional` off for full control.
 * - `labelClass` accepts a string only; it is merged with the
 *   `col-form-label` class upstream always adds.
 * - The bootstrap-vue horizontal layout props (`label-cols*`,
 *   `content-cols*`, `label-align*`) are deliberately not ported; horizontal
 *   forms are not part of the Pajamas form guidance. The `tooltip` feedback
 *   variant is also not ported.
 * - Feedback/description element IDs are always generated (via `useId`),
 *   whereas bootstrap-vue only generates them when an `id` prop is set, so
 *   the `aria-describedby` wiring works without extra props.
 */

import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cva } from "class-variance-authority";

export type GlFormGroupProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "label"> & {
  /** The form controls to group. */
  children?: ReactNode;
  /** Help text rendered below the content and linked via `aria-describedby`. */
  description?: ReactNode;
  /**
   * Disables the group's controls. Only takes effect when no `labelFor` is
   * set, where the group renders a `fieldset` carrying the `disabled`
   * attribute.
   */
  disabled?: boolean;
  /** The `aria-live` value for the feedback elements. */
  feedbackAriaLive?: "assertive" | "off" | "polite";
  /** Feedback shown when `state` is `false`. */
  invalidFeedback?: ReactNode;
  /** Text or content rendered as the group's label. */
  label?: ReactNode;
  /** Additional CSS class(es) to apply to the label element. */
  labelClass?: string;
  /** Descriptive text rendered below the label. */
  labelDescription?: ReactNode;
  /**
   * ID of the control this group labels. When set, the group renders a
   * `<label for>`; otherwise it renders a `fieldset`/`legend` pair.
   */
  labelFor?: string;
  /** ID of the label element. Defaults to a generated ID. */
  labelId?: string;
  /** Sizing variant of the label (`col-form-label-{size}`). */
  labelSize?: "lg" | "sm";
  /** Visually hides the label while keeping it accessible to screen readers. */
  labelSrOnly?: boolean;
  /** When true, displays optional text next to the label. */
  optional?: boolean;
  /** Text to display when the field is optional. */
  optionalText?: string;
  /** Validation state: `true` valid, `false` invalid, `null` none. */
  state?: boolean | null;
  /** Feedback shown when `state` is `true`. */
  validFeedback?: ReactNode;
  /** Adds the `was-validated` class, mirroring Bootstrap's validation opt-in. */
  validated?: boolean;
};

const INPUT_SELECTOR = ["input", "select", "textarea"]
  .map((tag) => `${tag}:not([disabled])`)
  .join(",");

const LEGEND_INTERACTIVE_ELEMENTS = ["input", "select", "textarea", "a", "button", "label"];

const groupVariants = cva(["form-group", "gl-form-group"], {
  variants: {
    state: {
      none: null,
      valid: "is-valid",
      invalid: "is-invalid",
    },
    validated: {
      false: null,
      true: "was-validated",
    },
  },
});

const labelVariants = cva("col-form-label", {
  variants: {
    fieldset: {
      // The legend emulates the label's top padding of `0` and hides its
      // programmatic focus ring, matching bootstrap-vue.
      false: "!gl-block",
      true: ["bv-no-focus-ring", "!gl-pt-0"],
    },
  },
});

const feedbackVariants = cva(null, {
  variants: {
    kind: {
      invalid: "invalid-feedback",
      valid: "valid-feedback",
    },
    shown: {
      false: null,
      true: "!gl-block",
    },
  },
});

// Merge the group's description/feedback IDs into the labeled control's
// `aria-describedby`, preserving IDs the control already had (bootstrap-vue
// `updateAriaDescribedby`). Runs against the DOM because the control is an
// arbitrary child rather than a coordinated React descendant.
function useAriaDescribedby(
  contentRef: React.RefObject<HTMLDivElement | null>,
  labelFor: string | undefined,
  describedBy: string | null,
) {
  useEffect(() => {
    if(!labelFor || !describedBy) return undefined;

    const content = contentRef.current;
    const input = content?.querySelector<HTMLElement>(`#${CSS.escape(labelFor)}`);
    if(!input) return undefined;

    const ownIds = describedBy.split(/\s+/).filter(Boolean);
    const preserved = (input.getAttribute("aria-describedby") ?? "")
      .split(/\s+/)
      .filter((id) => id && !ownIds.includes(id));
    input.setAttribute("aria-describedby", [...preserved, ...ownIds].join(" "));

    return () => {
      const remaining = (input.getAttribute("aria-describedby") ?? "")
        .split(/\s+/)
        .filter((id) => id && !ownIds.includes(id));
      if(remaining.length > 0) {
        input.setAttribute("aria-describedby", remaining.join(" "));
      } else {
        input.removeAttribute("aria-describedby");
      }
    };
  }, [contentRef, labelFor, describedBy]);
}

const GlFormGroup = forwardRef<HTMLDivElement, GlFormGroupProps>(function GlFormGroup({
  "aria-invalid": ariaInvalid,
  children,
  className,
  description,
  disabled = false,
  feedbackAriaLive = "assertive",
  invalidFeedback,
  label,
  labelClass,
  labelDescription,
  labelFor,
  labelId: labelIdProp,
  labelSize,
  labelSrOnly = false,
  optional = false,
  optionalText = "(optional)",
  state = null,
  validFeedback,
  validated = false,
  ...elementProps
}, forwardedRef) {
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const contentRef = useRef<HTMLDivElement>(null);

  const isFieldset = !labelFor;
  const computedState = typeof state === "boolean" ? state : null;

  const hasLabel = Boolean(label);
  const labelId = hasLabel ? (labelIdProp ?? `gl-form-group-label-${generatedId}`) : undefined;
  const invalidFeedbackId = invalidFeedback ? `${generatedId}-feedback-invalid` : undefined;
  const validFeedbackId = validFeedback ? `${generatedId}-feedback-valid` : undefined;
  const descriptionId = description ? `${generatedId}-description` : undefined;

  // Screen readers announce `aria-describedby` targets even when hidden, so
  // only the feedback matching the current state is linked.
  const describedBy = [
    descriptionId,
    computedState === false ? invalidFeedbackId : undefined,
    computedState === true ? validFeedbackId : undefined,
  ].filter(Boolean).join(" ") || null;

  useAriaDescribedby(contentRef, labelFor, describedBy);

  // bootstrap-vue `computedAriaInvalid`: an explicit `aria-invalid` wins over
  // the validation state, except that `state={false}` forces `"true"`.
  const computedAriaInvalid = ariaInvalid === true || ariaInvalid === "true"
    ? true
    : computedState === false
      ? true
      : ariaInvalid;

  const labelContent = hasLabel ? (
    <>
      {label}
      {optional ? (
        <span className="optional-label" data-testid="optional-label">{optionalText}</span>
      ) : null}
      {labelDescription ? (
        <div className="label-description" data-testid="label-description">
          {labelDescription}
        </div>
      ) : null}
    </>
  ) : null;

  // Clicking the legend emulates label behavior: focus the single enabled
  // control, unless an interactive element inside the legend was clicked.
  const handleLegendClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement | null;
    if(target && LEGEND_INTERACTIVE_ELEMENTS.includes(target.tagName.toLowerCase())) {
      return;
    }

    const inputs = Array.from(
      contentRef.current?.querySelectorAll<HTMLElement>(INPUT_SELECTOR) ?? [],
    ).filter((input) => input.getClientRects().length > 0);
    if(inputs.length === 1) {
      inputs[0].focus();
    }
  };

  const computedLabelClass = labelVariants({
    className: [labelClass, labelSize ? `col-form-label-${labelSize}` : null]
      .filter(Boolean)
      .join(" ") || undefined,
    fieldset: isFieldset,
  });

  const labelElement = hasLabel ? (
    labelSrOnly ? (
      // bootstrap-vue wraps the sr-only label/legend in a plain div.
      <div>
        {isFieldset ? (
          <legend className="gl-sr-only" id={labelId}>{labelContent}</legend>
        ) : (
          <label className="gl-sr-only" htmlFor={labelFor} id={labelId}>{labelContent}</label>
        )}
      </div>
    ) : isFieldset ? (
      <legend
        className={computedLabelClass}
        id={labelId}
        onClick={handleLegendClick}
        tabIndex={-1}>
        {labelContent}
      </legend>
    ) : (
      <label
        className={computedLabelClass}
        htmlFor={labelFor}
        id={labelId}>
        {labelContent}
      </label>
    )
  ) : null;

  const feedbackProps = {
    "aria-atomic": true as const,
    "aria-live": feedbackAriaLive,
    tabIndex: -1,
  };

  const content = (
    <div ref={contentRef}>
      {children}
      {invalidFeedback ? (
        <div
          {...feedbackProps}
          className={feedbackVariants({ kind: "invalid", shown: computedState === false })}
          id={invalidFeedbackId}>
          {invalidFeedback}
        </div>
      ) : null}
      {validFeedback ? (
        <div
          {...feedbackProps}
          className={feedbackVariants({ kind: "valid", shown: computedState === true })}
          id={validFeedbackId}>
          {validFeedback}
        </div>
      ) : null}
      {description ? (
        <small className="form-text text-muted" id={descriptionId} tabIndex={-1}>
          {description}
        </small>
      ) : null}
    </div>
  );

  const groupClassName = groupVariants({
    className,
    state: computedState === true ? "valid" : computedState === false ? "invalid" : "none",
    validated,
  });

  return isFieldset ? (
    <fieldset
      {...elementProps as HTMLAttributes<HTMLFieldSetElement>}
      ref={forwardedRef as React.Ref<HTMLFieldSetElement>}
      aria-invalid={computedAriaInvalid}
      className={groupClassName}
      disabled={disabled || undefined}>
      {labelElement}
      {content}
    </fieldset>
  ) : (
    <div
      {...elementProps}
      ref={forwardedRef}
      aria-invalid={computedAriaInvalid}
      className={groupClassName}
      role="group">
      {labelElement}
      {content}
    </div>
  );
});

export default GlFormGroup;
