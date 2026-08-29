/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/badge/badge.vue
 */

import {
  Children,
  forwardRef,
  type HTMLAttributeAnchorTarget,
  type HTMLAttributes,
  type JSX,
  type MouseEventHandler,
  type ReactNode,
  type Ref,
} from "react";
import { useRender } from "@base-ui/react/use-render";
import { cva } from "class-variance-authority";
import GlIcon from "../icon/icon";
import GlLink from "../link/link";

export type GlBadgeVariant = "neutral" | "info" | "success" | "warning" | "danger" | "tier";
export type GlBadgeIconSize = "sm" | "md";

const badgeIconSizes: Record<GlBadgeIconSize, 12 | 16> = {
  sm: 12,
  md: 16,
};

const circularIconNames = new Set(["issue-open-m", "issue-close"]);

type BaseBadgeProps = Omit<
  HTMLAttributes<HTMLElement>,
  "aria-label" | "children" | "className" | "onClick" | "role"
>;

export type GlBadgeProps = BaseBadgeProps & {
  /** Applies the active visual state when `href` is set. */
  active?: boolean;
  "aria-label"?: string;
  children?: ReactNode;
  className?: string;
  /** Disables the link when `href` is set. */
  disabled?: boolean;
  /** Turns the badge into a link; the `tag` prop is ignored. */
  href?: string;
  /** Name of an icon from `@gitlab/svgs` shown before the text. */
  icon?: string;
  /** Optically aligns circular icons with the badge. */
  iconOpticallyAligned?: boolean;
  /** Icon size: `sm` (12px) or `md` (16px). */
  iconSize?: GlBadgeIconSize;
  onClick?: MouseEventHandler<HTMLElement>;
  /** Sets the `rel` attribute when `href` is set. */
  rel?: string;
  /** Base UI composition hook; forwarded to the link when `href` is set. */
  render?: useRender.RenderProp;
  /** ARIA role; forced to `img` for icon-only badges. */
  role?: HTMLAttributes<HTMLElement>["role"];
  /** Overrides the rendered element when `href` is not set. Defaults to `span`. */
  tag?: keyof JSX.IntrinsicElements;
  /** Sets the `target` attribute when `href` is set. Defaults to `_self`. */
  target?: HTMLAttributeAnchorTarget;
  /** The variant of the badge. */
  variant?: GlBadgeVariant;
};

const badgeVariants = cva(["gl-badge", "badge", "badge-pill"], {
  variants: {
    active: {
      false: null,
      true: "active",
    },
    content: {
      false: "!gl-px-2",
      true: null,
    },
    disabled: {
      false: null,
      true: "disabled",
    },
    variant: {
      danger: "badge-danger",
      info: "badge-info",
      neutral: "badge-neutral",
      success: "badge-success",
      tier: "badge-tier",
      warning: "badge-warning",
    },
  },
});

const badgeIconVariants = cva("gl-badge-icon", {
  variants: {
    circular: {
      false: null,
      true: "-gl-ml-2",
    },
  },
});

const GlBadge = forwardRef<HTMLElement, GlBadgeProps>(function GlBadge({
  active = false,
  "aria-label": ariaLabel,
  children,
  className,
  disabled = false,
  href,
  icon,
  iconOpticallyAligned = false,
  iconSize = "md",
  onClick,
  rel,
  render,
  role,
  tag = "span",
  target = "_self",
  variant = "neutral",
  ...elementProps
}, forwardedRef) {
  const hasContent = Children.count(children) > 0;
  const hasIconOnly = Boolean(icon) && !hasContent;

  const environment = typeof process === "undefined" ? undefined : process.env.NODE_ENV;
  if(environment !== "production" && hasIconOnly && !ariaLabel) {
    console.warn(
      "[GlBadge] Icon-only badges require an aria-label for accessibility. " +
      "The label should describe the metadata (e.g., \"Due date\", \"Open issue\"), " +
      "not the icon name. " +
      "See https://design.gitlab.com/components/badge#using-icon-only-badges",
    );
  }

  // GlLink's unstyled variant strips state classes, so the badge applies
  // them itself to preserve the upstream `.active` / `.disabled` selectors.
  const isLink = Boolean(href);
  const classes = badgeVariants({
    active: isLink && active,
    className,
    content: hasContent,
    disabled: isLink && disabled,
    variant,
  });
  const badgeRole = hasIconOnly ? "img" : role;

  const content = (
    <>
      {icon ? (
        <GlIcon
          className={badgeIconVariants({
            circular: iconOpticallyAligned || circularIconNames.has(icon),
          })}
          name={icon}
          size={badgeIconSizes[iconSize]} />
      ) : null}
      {hasContent ? <span className="gl-badge-content">{children}</span> : null}
    </>
  );

  const element = useRender({
    defaultTagName: tag,
    enabled: !isLink,
    props: {
      ...elementProps,
      "aria-label": ariaLabel,
      children: content,
      className: classes,
      onClick,
      role: badgeRole,
    },
    ref: forwardedRef,
    render,
  });

  if(isLink) {
    return (
      <GlLink
        {...elementProps}
        ref={forwardedRef as Ref<HTMLAnchorElement>}
        active={active}
        aria-label={ariaLabel}
        className={classes}
        disabled={disabled}
        href={href}
        onClick={onClick as MouseEventHandler<HTMLAnchorElement>}
        rel={rel}
        render={render as useRender.ComponentProps<"a">["render"]}
        role={badgeRole}
        target={target}
        variant="unstyled">
        {content}
      </GlLink>
    );
  }

  return element;
});

export default GlBadge;
