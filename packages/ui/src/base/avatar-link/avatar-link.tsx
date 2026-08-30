/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/avatar_link/avatar_link.vue
 */

import { forwardRef } from "react";
import { cva } from "class-variance-authority";
import GlLink, { type GlLinkProps } from "../link/link";

export type GlAvatarLinkProps = Omit<GlLinkProps, "variant">;

const avatarLinkVariants = cva("gl-avatar-link");

const GlAvatarLink = forwardRef<HTMLAnchorElement, GlAvatarLinkProps>(function GlAvatarLink({
  className,
  ...linkProps
}, forwardedRef) {
  return (
    <GlLink
      {...linkProps}
      ref={forwardedRef}
      className={avatarLinkVariants({ className })}
      variant="meta" />
  );
});

export default GlAvatarLink;
