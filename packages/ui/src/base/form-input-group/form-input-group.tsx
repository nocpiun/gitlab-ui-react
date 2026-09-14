/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/form/form_input_group/form_input_group.vue
 * packages/gitlab-ui/src/components/base/form/input_group_text/input_group_text.vue
 *
 * Adaptations:
 * - The default input and Vue prepend/append slots map to explicit React
 *   children. The root deliberately does not inspect, reorder, or validate
 *   those children.
 * - The prepend and append wrappers are exposed as one typed addon component;
 *   `position` selects the matching upstream structural class.
 * - Upstream's value helpers, predefined-options dropdown, and select-on-click
 *   behavior are composed by consumers with GlFormInput and GlListbox.
 */

import { forwardRef, type HTMLAttributes } from "react";
import { cva } from "class-variance-authority";

export type GlFormInputGroupAddonPosition = "prepend" | "append";

export type GlFormInputGroupProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "role"
>;

export type GlFormInputGroupAddonProps = HTMLAttributes<HTMLDivElement> & {
  /** Places the addon before or after the composed form control. */
  position: GlFormInputGroupAddonPosition;
};

export type GlInputGroupTextProps = HTMLAttributes<HTMLDivElement>;

const inputGroupVariants = cva(["gl-form-input-group", "input-group"]);

const inputGroupAddonVariants = cva("gl-form-input-group-addon", {
  variants: {
    position: {
      append: "input-group-append",
      prepend: "input-group-prepend",
    },
  },
});

const inputGroupTextVariants = cva(["gl-input-group-text", "input-group-text"]);

const GlFormInputGroup = forwardRef<HTMLDivElement, GlFormInputGroupProps>(
  function GlFormInputGroup({ className, ...elementProps }, forwardedRef) {
    return (
      <div
        {...elementProps}
        ref={forwardedRef}
        className={inputGroupVariants({ className })}
        role="group" />
    );
  },
);

export const GlFormInputGroupAddon = forwardRef<
  HTMLDivElement,
  GlFormInputGroupAddonProps
>(function GlFormInputGroupAddon({ className, position, ...elementProps }, forwardedRef) {
  return (
    <div
      {...elementProps}
      ref={forwardedRef}
      className={inputGroupAddonVariants({ className, position })} />
  );
});

export const GlInputGroupText = forwardRef<HTMLDivElement, GlInputGroupTextProps>(
  function GlInputGroupText({ className, ...elementProps }, forwardedRef) {
    return (
      <div
        {...elementProps}
        ref={forwardedRef}
        className={inputGroupTextVariants({ className })} />
    );
  },
);

export default GlFormInputGroup;
