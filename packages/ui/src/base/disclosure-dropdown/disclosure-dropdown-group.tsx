/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/new_dropdowns/disclosure/disclosure_dropdown_group.vue
 */

import {
  Children,
  forwardRef,
  isValidElement,
  type ReactElement,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { cva } from "class-variance-authority";
import {
  DisclosureDropdownIconSpacingContext,
  hasDirectDisclosureDropdownItemIcon,
} from "./disclosure-dropdown";

export type GlDisclosureDropdownGroupBorderPosition = "top" | "bottom";

export type GlDisclosureDropdownGroupProps = Omit<
  BaseMenu.Group.Props,
  "children" | "className" | "render" | "style"
> & {
  bordered?: boolean;
  borderPosition?: GlDisclosureDropdownGroupBorderPosition;
  children?: ReactNode;
  className?: string;
  /** Forces an icon column when direct item children are hidden behind wrapper components. */
  reserveIconSpace?: boolean;
  style?: CSSProperties;
};

export type GlDisclosureDropdownGroupLabelProps = Omit<
  BaseMenu.GroupLabel.Props,
  "children" | "className" | "render" | "style"
> & {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

const groupVariants = cva([], {
  variants: {
    bordered: {
      false: null,
      true: null,
    },
    borderPosition: {
      bottom: null,
      top: null,
    },
  },
  compoundVariants: [
    {
      bordered: true,
      borderPosition: "bottom",
      className: "gl-border-b gl-border-b-dropdown-divider gl-pb-2 gl-mb-2",
    },
    {
      bordered: true,
      borderPosition: "top",
      className: "gl-border-t gl-border-t-dropdown-divider gl-pt-2 gl-mt-2",
    },
  ],
  defaultVariants: {
    bordered: false,
    borderPosition: "top",
  },
});

const groupItemsVariants = cva([
  "gl-new-dropdown-item-group",
  "gl-mb-0",
  "gl-list-none",
  "gl-pl-0",
]);

const groupLabelVariants = cva([
  "gl-py-2",
  "gl-pl-4",
  "gl-text-sm",
  "gl-font-bold",
  "gl-text-strong",
]);

function isGroupLabel(
  child: ReactNode,
): child is ReactElement<GlDisclosureDropdownGroupLabelProps> {
  return isValidElement(child) && child.type === GlDisclosureDropdownGroupLabel;
}

export const GlDisclosureDropdownGroup = forwardRef<
  HTMLDivElement,
  GlDisclosureDropdownGroupProps
>(function GlDisclosureDropdownGroup({
  bordered = false,
  borderPosition = "top",
  children,
  className,
  reserveIconSpace,
  style,
  ...groupProps
}, forwardedRef) {
  const hasIconColumn = reserveIconSpace
    ?? hasDirectDisclosureDropdownItemIcon(children);
  const childArray = Children.toArray(children);
  const labels = childArray.filter(isGroupLabel);
  const items = childArray.filter((child) => !isGroupLabel(child));

  return (
    <BaseMenu.Group
      {...groupProps}
      ref={forwardedRef}
      className={groupVariants({ bordered, borderPosition, className })}
      style={style}>
      {labels}
      <DisclosureDropdownIconSpacingContext.Provider value={hasIconColumn}>
        <div className={groupItemsVariants()}>{items}</div>
      </DisclosureDropdownIconSpacingContext.Provider>
    </BaseMenu.Group>
  );
});

export const GlDisclosureDropdownGroupLabel = forwardRef<
  HTMLDivElement,
  GlDisclosureDropdownGroupLabelProps
>(function GlDisclosureDropdownGroupLabel({
  children,
  className,
  style,
  ...labelProps
}, forwardedRef) {
  return (
    <BaseMenu.GroupLabel
      {...labelProps}
      ref={forwardedRef}
      className={groupLabelVariants({ className })}
      style={style}>
      {children}
    </BaseMenu.GroupLabel>
  );
});
