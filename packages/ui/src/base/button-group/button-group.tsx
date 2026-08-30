/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/button_group/button_group.vue
 */

import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cva } from "class-variance-authority";

type ButtonGroupElementProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "className" | "role"
>;

export type GlButtonGroupProps = ButtonGroupElementProps & {
  /** The buttons or button-like controls to visually group. */
  children?: ReactNode;
  className?: string;
  /** Stacks the grouped controls vertically. */
  vertical?: boolean;
};

const buttonGroupVariants = cva(null, {
  variants: {
    vertical: {
      false: ["gl-button-group", "btn-group"],
      true: ["gl-button-group-vertical", "btn-group-vertical"],
    },
  },
  defaultVariants: {
    vertical: false,
  },
});

const GlButtonGroup = forwardRef<HTMLDivElement, GlButtonGroupProps>(function GlButtonGroup({
  children,
  className,
  vertical = false,
  ...elementProps
}, forwardedRef) {
  return (
    <div
      {...elementProps}
      ref={forwardedRef}
      className={buttonGroupVariants({ className, vertical })}
      role="group">
      {children}
    </div>
  );
});

export default GlButtonGroup;
