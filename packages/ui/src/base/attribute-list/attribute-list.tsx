/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/attribute_list/attribute_list.vue
 *
 * Adaptations:
 * - The upstream items and scoped-slot API is expressed as React composition.
 * - Children must be directly inspectable GlAttributeListItem elements so the
 *   upstream column-first layout can derive an exact row count during render.
 * - A private container establishes the inline-size query used by the upstream
 *   responsive layout, so consumers do not need to configure one themselves.
 */

import {
  Children,
  Fragment,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cva } from "class-variance-authority";
import GlIcon from "../icon/icon";

export type GlAttributeListLayout = "horizontal" | "vertical";

type GlAttributeListChild =
  | ReactElement<GlAttributeListItemProps>
  | readonly GlAttributeListChild[]
  | boolean
  | null
  | undefined;

export type GlAttributeListProps = Omit<
  HTMLAttributes<HTMLDListElement>,
  "children"
> & {
  /**
   * Direct GlAttributeListItem children. Arrays, Fragments, and conditional
   * children are supported; opaque wrapper components are not.
   */
  children?: GlAttributeListChild;
  /** Classes applied to every item label. */
  labelClassName?: string;
  /** Classes applied to every item description. */
  descriptionClassName?: string;
  /** Places labels beside or above their descriptions when space allows. */
  layout?: GlAttributeListLayout;
};

export type GlAttributeListItemProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  children?: ReactNode;
  /** Classes applied to this item's description. */
  descriptionClassName?: string;
  /** Optional decorative icon displayed before the label. */
  icon?: string;
  /** The attribute term rendered in a semantic `dt` element. */
  label: ReactNode;
  /** Classes applied to this item's label. */
  labelClassName?: string;
};

type AttributeListContextValue = {
  descriptionClassName?: string;
  labelClassName?: string;
};

const AttributeListContext = createContext<AttributeListContextValue>({});

const attributeListContainerVariants = cva("gl-attribute-list-container");
const attributeListVariants = cva("gl-attribute-list", {
  variants: {
    layout: {
      horizontal: "gl-attribute-list-horizontal-items",
      vertical: "gl-attribute-list-vertical-items",
    },
  },
  defaultVariants: {
    layout: "horizontal",
  },
});
const attributeListItemVariants = cva("gl-attribute-list-item");
const attributeListItemLabelVariants = cva("gl-attribute-list-item-label");
const attributeListItemDescriptionVariants = cva(
  "gl-attribute-list-item-description",
);

function countAttributeListItems(children: GlAttributeListChild): number {
  let count = 0;

  Children.forEach(children, (child) => {
    if(child === null || typeof child === "boolean") {
      return;
    }

    if(isValidElement<{ children?: GlAttributeListChild }>(child) && child.type === Fragment) {
      count += countAttributeListItems(child.props.children);
      return;
    }

    if(isValidElement(child) && child.type === GlAttributeListItem) {
      count += 1;
      return;
    }

    throw new Error(
      "GlAttributeList only accepts GlAttributeListItem as direct children. "
      + "Arrays, Fragments, and conditional children are supported.",
    );
  });

  return count;
}

const GlAttributeList = forwardRef<HTMLDListElement, GlAttributeListProps>(
  function GlAttributeList({
    children,
    className,
    descriptionClassName,
    labelClassName,
    layout = "horizontal",
    style,
    ...elementProps
  }, forwardedRef) {
    const rowCount = Math.ceil(countAttributeListItems(children) / 2);
    const listStyle = {
      ...style,
      "--attribute-list-row-count": rowCount,
    } as CSSProperties;

    return (
      <div className={attributeListContainerVariants()}>
        <dl
          {...elementProps}
          ref={forwardedRef}
          className={attributeListVariants({ className, layout })}
          style={listStyle}>
          <AttributeListContext value={{ descriptionClassName, labelClassName }}>
            {children}
          </AttributeListContext>
        </dl>
      </div>
    );
  },
);

export const GlAttributeListItem = forwardRef<
  HTMLDivElement,
  GlAttributeListItemProps
>(function GlAttributeListItem({
  children,
  className,
  descriptionClassName,
  icon,
  label,
  labelClassName,
  ...elementProps
}, forwardedRef) {
  const listClasses = useContext(AttributeListContext);

  return (
    <div
      {...elementProps}
      ref={forwardedRef}
      className={attributeListItemVariants({ className })}>
      <dt
        className={attributeListItemLabelVariants({
          className: [listClasses.labelClassName, labelClassName],
        })}>
        {icon ? (
          <GlIcon
            className="gl-attribute-list-item-label-icon"
            name={icon}
            variant="strong" />
        ) : null}
        <span>{label}</span>
      </dt>
      <dd
        className={attributeListItemDescriptionVariants({
          className: [listClasses.descriptionClassName, descriptionClassName],
        })}>
        {children}
      </dd>
    </div>
  );
});

export default GlAttributeList;
