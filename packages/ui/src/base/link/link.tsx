/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/link/link.vue
 */

import {
  forwardRef,
  type HTMLAttributeAnchorTarget,
  type MouseEvent,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import { useRender } from "@base-ui/react/use-render";
import { cva } from "class-variance-authority";

export type GlLinkVariant =
  | "inline"
  | "meta"
  | "mention"
  | "mentionCurrent"
  | "unstyled";

type BaseLinkProps = Omit<
  useRender.ComponentProps<"a">,
  | "children"
  | "className"
  | "href"
  | "onClick"
  | "ref"
  | "rel"
  | "render"
  | "target"
  | "variant"
>;

export type GlLinkProps = BaseLinkProps & {
  /** Places the link in its active visual state. */
  active?: boolean;
  children?: ReactNode;
  className?: string;
  /** Prevents navigation, removes the link from the tab sequence, and suppresses clicks. */
  disabled?: boolean;
  /** Destination for a standard anchor. Defaults to `#`. */
  href?: string;
  /** Skips the default URL protocol allowlist. Use only with trusted URLs. */
  isUnsafeLink?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  rel?: string;
  /**
   * Base UI composition hook for router links. The supplied element must ultimately
   * render an anchor and accept the anchor props provided by GlLink.
   */
  render?: useRender.ComponentProps<"a">["render"];
  /** Shows the external-link arrow for eligible variants and external `_blank` URLs. */
  showExternalIcon?: boolean;
  target?: HTMLAttributeAnchorTarget;
  variant?: GlLinkVariant;
};

const linkVariants = cva(null, {
  variants: {
    active: {
      false: null,
      true: "active",
    },
    disabled: {
      false: null,
      true: "disabled",
    },
    external: {
      false: null,
      true: "gl-link-external",
    },
    variant: {
      default: "gl-link",
      inline: "gl-link gl-link-inline",
      meta: "gl-link gl-link-meta",
      mention: "gl-link gl-link-mention",
      mentionCurrent: "gl-link gl-link-mention-current",
      unstyled: null,
    },
  },
  defaultVariants: {
    active: false,
    disabled: false,
    external: false,
    variant: "default",
  },
});

const allowedProtocols = new Set(["ftp:", "http:", "https:", "mailto:"]);
// Upstream resolves this default through its i18n runtime; this package has no i18n runtime.
const externalLinkLabel = "(external link)";

function sanitizeHref(href: string, isUnsafeLink: boolean) {
  if(isUnsafeLink) return href;

  try {
    const url = new URL(href, "http://localhost");
    return allowedProtocols.has(url.protocol) ? href : "about:blank";
  } catch {
    return "about:blank";
  }
}

function secureRel(rel: string | undefined, target: HTMLAttributeAnchorTarget | undefined) {
  if(target !== "_blank") return rel;

  const values = new Set(rel?.trim().split(/\s+/).filter(Boolean));
  values.add("noopener");
  values.add("noreferrer");
  return [...values].join(" ");
}

function isExternalHref(href: string) {
  const currentUrl = typeof window === "undefined"
    ? new URL("http://localhost")
    : new URL(window.location.href);

  try {
    const destination = new URL(href, currentUrl);
    return Boolean(destination.hostname) && destination.hostname !== currentUrl.hostname;
  } catch {
    return false;
  }
}

function stopDisabledEvent(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  event.stopPropagation();
  event.nativeEvent.stopImmediatePropagation();
}

const GlLink = forwardRef<HTMLAnchorElement, GlLinkProps>(function GlLink({
  active = false,
  children,
  className,
  disabled = false,
  href,
  isUnsafeLink = false,
  onClick,
  rel,
  render,
  showExternalIcon = false,
  target,
  variant,
  ...elementProps
}, forwardedRef) {
  const normalizedVariant = variant ?? "default";
  const computedHref = href || "#";
  const safeHref = sanitizeHref(computedHref, isUnsafeLink);
  const isStyled = normalizedVariant !== "unstyled";
  const isExternal = Boolean(
    showExternalIcon
    && href
    && target === "_blank"
    && (
      normalizedVariant === "default"
      || normalizedVariant === "inline"
      || normalizedVariant === "meta"
    )
    && isExternalHref(href),
  );
  const classes = linkVariants({
    active: isStyled && active,
    className,
    disabled: isStyled && disabled,
    external: isStyled && isExternal,
    variant: normalizedVariant,
  });

  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    if(disabled) {
      stopDisabledEvent(event);
      return;
    }

    onClick?.(event);

    if(computedHref === "#" && (render === undefined || href !== undefined)) {
      event.preventDefault();
    }
  };

  return useRender({
    defaultTagName: "a",
    props: {
      ...elementProps,
      "aria-disabled": disabled ? true : elementProps["aria-disabled"],
      children,
      className: classes,
      "data-alt": externalLinkLabel,
      href: safeHref,
      onClick: handleClick,
      rel: secureRel(rel, target),
      tabIndex: disabled ? -1 : elementProps.tabIndex,
      target,
    },
    ref: forwardedRef,
    render,
  });
});

export default GlLink;
