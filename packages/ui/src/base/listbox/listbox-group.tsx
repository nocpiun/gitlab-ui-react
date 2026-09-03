/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/new_dropdowns/listbox/listbox_group.vue
 */

import {
  forwardRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { cva } from "class-variance-authority";
import { ListboxGroupContext } from "./listbox-contexts";

export type GlListboxGroupProps = Omit<
  BaseMenu.Group.Props,
  "children" | "className" | "render" | "role" | "style"
> & {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export type GlListboxGroupLabelProps = Omit<
  BaseMenu.GroupLabel.Props,
  "children" | "className" | "render" | "style"
> & {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  textSrOnly?: boolean;
};

const groupVariants = cva([
  "gl-listbox-group",
  "gl-mb-0",
  "gl-list-none",
  "gl-pl-0",
]);

const labelVariants = cva([
  "gl-listbox-group-label",
  "gl-pb-2",
  "gl-pl-4",
  "gl-pt-3",
  "gl-text-sm",
  "gl-font-bold",
  "gl-text-strong",
], {
  variants: {
    textSrOnly: {
      false: null,
      true: "gl-sr-only",
    },
  },
  defaultVariants: {
    textSrOnly: false,
  },
});

export const GlListboxGroup = forwardRef<HTMLDivElement, GlListboxGroupProps>(
  function GlListboxGroup({ children, className, style, ...groupProps }, forwardedRef) {
    return (
      <ListboxGroupContext.Provider value>
        <BaseMenu.Group
          {...groupProps}
          ref={forwardedRef}
          className={groupVariants({ className })}
          role="group"
          style={style}>
          {children}
        </BaseMenu.Group>
      </ListboxGroupContext.Provider>
    );
  },
);

export const GlListboxGroupLabel = forwardRef<
  HTMLDivElement,
  GlListboxGroupLabelProps
>(function GlListboxGroupLabel({
  children,
  className,
  style,
  textSrOnly = false,
  ...labelProps
}, forwardedRef) {
  return (
    <BaseMenu.GroupLabel
      {...labelProps}
      ref={forwardedRef}
      className={labelVariants({ className, textSrOnly })}
      style={style}>
      {children}
    </BaseMenu.GroupLabel>
  );
});
