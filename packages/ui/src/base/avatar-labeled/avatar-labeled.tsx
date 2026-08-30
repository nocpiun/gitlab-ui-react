/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/avatar_labeled/avatar_labeled.vue
 */

import {
  forwardRef,
  useRef,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import { cva } from "class-variance-authority";
import GlAvatar, { type GlAvatarProps } from "../avatar/avatar";
import GlAvatarLink, { type GlAvatarLinkProps } from "../avatar-link/avatar-link";

type AvatarLabeledAvatarProps = Omit<GlAvatarProps, "alt" | "className">;
type LabelLinkAttrs = Omit<GlAvatarLinkProps, "children" | "href">;

export type GlAvatarLabeledProps = AvatarLabeledAvatarProps & {
  /** Additional information displayed below the labels. */
  children?: ReactNode;
  /** Class applied to the Avatar element. */
  avatarClassName?: string;
  /** Class applied to the outer labeled-avatar container. */
  className?: string;
  /** Displays the label and sub-label in one row. */
  inlineLabels?: boolean;
  /** Primary text displayed beside the avatar. */
  label: string;
  /** Link destination for the primary label. */
  labelLink?: string;
  /** Additional props passed to the primary label link. */
  labelLinkAttrs?: LabelLinkAttrs;
  /** Metadata displayed next to the primary label. */
  meta?: ReactNode;
  /** Called when the primary label link is activated, including through the avatar. */
  onLabelLinkClick?: MouseEventHandler<HTMLAnchorElement>;
  /** Secondary text displayed below, or beside, the primary label. */
  subLabel?: string;
  /** Link destination for the secondary label. */
  subLabelLink?: string;
};

const rootVariants = cva("gl-avatar-labeled");

const avatarVariants = cva(null, {
  variants: {
    linked: {
      false: null,
      true: "gl-cursor-pointer",
    },
  },
});

const labelsVariants = cva(["gl-avatar-labeled-labels", "!gl-text-left"], {
  variants: {
    inline: {
      false: null,
      true: "inline-labels",
    },
  },
});

const GlAvatarLabeled = forwardRef<HTMLDivElement, GlAvatarLabeledProps>(
  function GlAvatarLabeled({
    avatarClassName,
    children,
    className,
    inlineLabels = false,
    label,
    labelLink = "",
    labelLinkAttrs = {},
    meta,
    onLabelLinkClick,
    size = 64,
    subLabel = "",
    subLabelLink = "",
    ...avatarProps
  }, forwardedRef) {
    const labelLinkRef = useRef<HTMLAnchorElement>(null);
    const {
      className: labelLinkClassName,
      onClick: onLabelLinkAttrsClick,
      ...labelLinkProps
    } = labelLinkAttrs;
    const hasLabelLink = Boolean(labelLink);
    const hasSubLabelLink = Boolean(subLabelLink);

    const handleLabelLinkClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
      onLabelLinkAttrsClick?.(event);
      onLabelLinkClick?.(event);
    };

    const handleAvatarClick = hasLabelLink
      ? () => labelLinkRef.current?.click()
      : avatarProps.onClick;

    return (
      <div ref={forwardedRef} className={rootVariants({ className })}>
        <GlAvatar
          {...avatarProps}
          alt=""
          className={avatarVariants({
            className: avatarClassName,
            linked: hasLabelLink,
          })}
          onClick={handleAvatarClick}
          size={size} />
        <div className={labelsVariants({ inline: inlineLabels })}>
          <div className="gl-avatar-labeled-label-row">
            {hasLabelLink ? (
              <GlAvatarLink
                {...labelLinkProps}
                ref={labelLinkRef}
                className={labelLinkClassName}
                href={labelLink}
                onClick={handleLabelLinkClick}>
                <span className="gl-avatar-labeled-label">{label}</span>
              </GlAvatarLink>
            ) : (
              <span className="gl-avatar-labeled-label">{label}</span>
            )}
            {meta}
          </div>
          {hasSubLabelLink ? (
            <GlAvatarLink href={subLabelLink}>
              <span className="gl-avatar-labeled-sublabel">{subLabel}</span>
            </GlAvatarLink>
          ) : (
            <span className="gl-avatar-labeled-sublabel">{subLabel}</span>
          )}
          {children}
        </div>
      </div>
    );
  },
);

export default GlAvatarLabeled;
