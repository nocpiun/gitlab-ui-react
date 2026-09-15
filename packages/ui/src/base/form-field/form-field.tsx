/**
 * Adapted from GitLab UI:
 * packages/gitlab-ui/src/components/base/form/form_group/form_group.vue
 * packages/gitlab-ui/src/components/base/form/form_fields/form_fields.vue
 *
 * The upstream configuration and validation runtime is intentionally replaced
 * by small semantic React components. Consumers own IDs, ARIA relationships,
 * field state, and integration with their form engine.
 */

import {
  forwardRef,
  type FieldsetHTMLAttributes,
  type HTMLAttributes,
  type LabelHTMLAttributes,
} from "react";
import { cva } from "class-variance-authority";

type FieldElementProps = Omit<HTMLAttributes<HTMLDivElement>, "role">;

export type GlFormFieldProps = FieldElementProps;
export type GlFormFieldGroupProps = HTMLAttributes<HTMLDivElement>;
export type GlFormFieldSetProps = FieldsetHTMLAttributes<HTMLFieldSetElement>;
export type GlFormFieldLegendProps = HTMLAttributes<HTMLLegendElement>;
export type GlFormFieldLabelProps = LabelHTMLAttributes<HTMLLabelElement>;
export type GlFormFieldDescriptionProps = HTMLAttributes<HTMLElement>;
export type GlFormFieldErrorProps = HTMLAttributes<HTMLDivElement>;

const fieldVariants = cva(["gl-form-field", "form-group"]);
const fieldGroupVariants = cva([
  "gl-form-field-group",
  "gl-flex",
  "gl-flex-col",
  "gl-gap-5",
]);
const fieldSetVariants = cva(["gl-form-field-set", "form-group"]);
const fieldLegendVariants = cva([
  "gl-form-field-legend",
  "col-form-label",
]);
const fieldLabelVariants = cva([
  "gl-form-field-label",
  "col-form-label",
]);
const fieldDescriptionVariants = cva([
  "gl-form-field-description",
  "form-text",
  "text-muted",
]);
const fieldErrorVariants = cva([
  "gl-form-field-error",
  "invalid-feedback",
]);

const GlFormField = forwardRef<HTMLDivElement, GlFormFieldProps>(function GlFormField({
  className,
  ...elementProps
}, forwardedRef) {
  return (
    <div
      {...elementProps}
      ref={forwardedRef}
      className={fieldVariants({ className })}
      role="group" />
  );
});

export const GlFormFieldGroup = forwardRef<HTMLDivElement, GlFormFieldGroupProps>(
  function GlFormFieldGroup({ className, ...elementProps }, forwardedRef) {
    return (
      <div
        {...elementProps}
        ref={forwardedRef}
        className={fieldGroupVariants({ className })} />
    );
  },
);

export const GlFormFieldSet = forwardRef<HTMLFieldSetElement, GlFormFieldSetProps>(
  function GlFormFieldSet({ className, ...elementProps }, forwardedRef) {
    return (
      <fieldset
        {...elementProps}
        ref={forwardedRef}
        className={fieldSetVariants({ className })} />
    );
  },
);

export const GlFormFieldLegend = forwardRef<HTMLLegendElement, GlFormFieldLegendProps>(
  function GlFormFieldLegend({ className, ...elementProps }, forwardedRef) {
    return (
      <legend
        {...elementProps}
        ref={forwardedRef}
        className={fieldLegendVariants({ className })} />
    );
  },
);

export const GlFormFieldLabel = forwardRef<HTMLLabelElement, GlFormFieldLabelProps>(
  function GlFormFieldLabel({ className, htmlFor, ...elementProps }, forwardedRef) {
    return (
      <label
        {...elementProps}
        ref={forwardedRef}
        className={fieldLabelVariants({ className })}
        htmlFor={htmlFor} />
    );
  },
);

export const GlFormFieldDescription = forwardRef<
  HTMLElement,
  GlFormFieldDescriptionProps
>(function GlFormFieldDescription({ className, ...elementProps }, forwardedRef) {
  return (
    <small
      {...elementProps}
      ref={forwardedRef}
      className={fieldDescriptionVariants({ className })} />
  );
});

export const GlFormFieldError = forwardRef<HTMLDivElement, GlFormFieldErrorProps>(
  function GlFormFieldError({ className, ...elementProps }, forwardedRef) {
    return (
      <div
        {...elementProps}
        ref={forwardedRef}
        className={fieldErrorVariants({ className })} />
    );
  },
);

export default GlFormField;
