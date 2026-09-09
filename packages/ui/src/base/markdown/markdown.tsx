/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/markdown/markdown.vue
 */

import { forwardRef, type HTMLAttributes } from "react";
import { cva } from "class-variance-authority";

export type GlMarkdownProps = HTMLAttributes<HTMLDivElement> & {
  /** Renders the markdown content using the compact type scale. */
  compact?: boolean;
};

const markdownVariants = cva("gl-markdown", {
  variants: {
    compact: {
      false: null,
      true: "gl-compact-markdown",
    },
  },
  defaultVariants: {
    compact: false,
  },
});

const GlMarkdown = forwardRef<HTMLDivElement, GlMarkdownProps>(function GlMarkdown({
  className,
  compact = false,
  ...elementProps
}, forwardedRef) {
  return (
    <div
      {...elementProps}
      ref={forwardedRef}
      className={markdownVariants({ className, compact })} />
  );
});

export default GlMarkdown;
