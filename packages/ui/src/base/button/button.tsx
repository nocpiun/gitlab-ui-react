/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/button/button.vue
 */

import {
  Children,
  forwardRef,
  type AnchorHTMLAttributes,
  type CSSProperties,
  type HTMLAttributeAnchorTarget,
  type KeyboardEventHandler,
  type MouseEvent,
  type MouseEventHandler,
  type ReactNode,
  type Ref,
} from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { cva } from "class-variance-authority";
import GlIcon from "../icon/icon";
import GlLoadingIcon from "../loading-icon/loading-icon";

export type GlButtonCategory = "primary" | "secondary" | "tertiary";
export type GlButtonVariant = "default" | "confirm" | "danger" | "link" | "reset";
export type GlButtonSize = "small" | "medium";
export type GlButtonType = "button" | "submit" | "reset";

type BaseButtonProps = Omit<
  BaseButton.Props,
  | "children"
  | "className"
  | "disabled"
  | "focusableWhenDisabled"
  | "nativeButton"
  | "onClick"
  | "onClickCapture"
  | "onKeyDown"
  | "render"
  | "style"
  | "type"
>;

export type GlButtonProps = BaseButtonProps & {
  /** Places the button in its active visual state. */
  active?: boolean;
  /** Expands the button to the width of its parent. */
  block?: boolean;
  /** CSS classes applied to the element wrapping the button text. */
  buttonTextClasses?: string;
  /** Visual hierarchy of the action. */
  category?: GlButtonCategory;
  children?: ReactNode;
  className?: string;
  /** Numeric count displayed after the button text. Negative counts are hidden. */
  count?: number | null;
  /** Screen-reader context appended to a visible count. */
  countSrText?: string;
  /** Keeps the control focusable while preventing activation. */
  disabled?: boolean;
  /** Content rendered before the text, corresponding to GitLab UI's emoji slot. */
  emoji?: ReactNode;
  /** Renders an anchor styled as a button. Use `render` for router-link composition. */
  href?: string;
  /** Name of an icon from `@gitlab/svgs`. */
  icon?: string;
  /** Skips the default URL protocol allowlist. Use only with trusted URLs. */
  isUnsafeLink?: boolean;
  /** Renders a non-interactive `span` styled as a button. */
  label?: boolean;
  /** Displays a loading indicator and prevents activation of native buttons. */
  loading?: boolean;
  /** Set this to `false` when `render` replaces the button with a non-button element. */
  nativeButton?: BaseButton.Props["nativeButton"];
  onClick?: MouseEventHandler<HTMLElement>;
  onClickCapture?: MouseEventHandler<HTMLElement>;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
  /** Base UI composition hook. Ignored when `href` or `label` is set. */
  render?: BaseButton.Props["render"];
  rel?: string;
  /** Applies the visually selected state. Pair with `aria-pressed` for toggle buttons. */
  selected?: boolean;
  size?: GlButtonSize;
  style?: CSSProperties;
  target?: HTMLAttributeAnchorTarget;
  type?: GlButtonType;
  variant?: GlButtonVariant;
};

const buttonVariants = cva(["btn", "gl-button"], {
  variants: {
    active: {
      false: null,
      true: "active",
    },
    block: {
      false: null,
      true: "btn-block",
    },
    category: {
      primary: null,
      secondary: null,
      tertiary: null,
    },
    disabled: {
      false: null,
      true: "disabled",
    },
    ellipsis: {
      false: null,
      true: "button-ellipsis-horizontal",
    },
    iconOnly: {
      false: null,
      true: "btn-icon",
    },
    label: {
      false: null,
      true: "btn-label",
    },
    selected: {
      false: null,
      true: "selected",
    },
    size: {
      medium: "btn-md",
      small: "btn-sm",
    },
    variant: {
      confirm: "btn-confirm",
      danger: "btn-danger",
      default: "btn-default",
      link: "btn-link",
      reset: "btn-reset",
    },
  },
  compoundVariants: [
    { category: "secondary", className: "btn-default-secondary", variant: "default" },
    { category: "tertiary", className: "btn-default-tertiary", variant: "default" },
    { category: "secondary", className: "btn-confirm-secondary", variant: "confirm" },
    { category: "tertiary", className: "btn-confirm-tertiary", variant: "confirm" },
    { category: "secondary", className: "btn-danger-secondary", variant: "danger" },
    { category: "tertiary", className: "btn-danger-tertiary", variant: "danger" },
    { category: "secondary", className: "btn-link-secondary", variant: "link" },
    { category: "tertiary", className: "btn-link-tertiary", variant: "link" },
    { category: "secondary", className: "btn-reset-secondary", variant: "reset" },
    { category: "tertiary", className: "btn-reset-tertiary", variant: "reset" },
  ],
  defaultVariants: {
    active: false,
    block: false,
    category: "primary",
    disabled: false,
    ellipsis: false,
    iconOnly: false,
    label: false,
    selected: false,
    size: "medium",
    variant: "default",
  },
});

const buttonTextVariants = cva("gl-button-text");

const allowedProtocols = new Set(["ftp:", "http:", "https:", "mailto:"]);

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

function stopDisabledEvent(event: MouseEvent<HTMLElement>) {
  event.preventDefault();
  event.stopPropagation();
}

const GlButton = forwardRef<HTMLElement, GlButtonProps>(function GlButton({
  "aria-label": ariaLabel,
  active = false,
  block = false,
  buttonTextClasses,
  category = "primary",
  children,
  className,
  count = null,
  countSrText,
  disabled = false,
  emoji,
  href,
  icon,
  isUnsafeLink = false,
  label = false,
  loading = false,
  nativeButton = true,
  onClick,
  onClickCapture,
  onKeyDown,
  rel,
  render,
  selected = false,
  size = "medium",
  style,
  target,
  type = "button",
  variant = "default",
  ...elementProps
}, forwardedRef) {
  const hasCount = count !== null && count >= 0;
  const hasIcon = Boolean(icon);
  const hasIconOnly = hasIcon && Children.toArray(children).length === 0 && count === null;
  const isNativeButton = !label && href === undefined && nativeButton !== false;
  const isDisabledOrLoading = disabled || (isNativeButton && loading);
  const classes = buttonVariants({
    active,
    block: !label && block,
    category,
    className,
    disabled: isDisabledOrLoading,
    ellipsis: hasIconOnly && icon === "ellipsis_h",
    iconOnly: hasIconOnly,
    label,
    selected,
    size,
    variant,
  });

  const content = (
    <>
      {loading ? (
        <GlLoadingIcon inline className="gl-button-icon gl-button-loading-indicator" />
      ) : null}
      {hasIcon && !(hasIconOnly && loading)
        ? <GlIcon className="gl-button-icon" name={icon!} />
        : null}
      {emoji ? <span className="gl-button-emoji">{emoji}</span> : null}
      {!hasIconOnly ? (
        <span className={buttonTextVariants({ className: buttonTextClasses })}>
          {children}
          {hasCount ? (
            <span className="gl-button-count">
              {count}
              {countSrText ? <span className="gl-sr-only">{countSrText}</span> : null}
            </span>
          ) : null}
        </span>
      ) : null}
    </>
  );

  const handleClickCapture: MouseEventHandler<HTMLElement> = (event) => {
    if(isDisabledOrLoading) {
      stopDisabledEvent(event);
      return;
    }

    onClickCapture?.(event);
  };

  if(label) {
    return (
      <span
        {...elementProps}
        ref={forwardedRef as Ref<HTMLSpanElement>}
        aria-disabled={disabled || undefined}
        aria-label={ariaLabel}
        className={classes}
        style={style}>
        {content}
      </span>
    );
  }

  if(href !== undefined) {
    const safeHref = sanitizeHref(href, isUnsafeLink);
    const linkRel = secureRel(rel, target);
    const handleLinkClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
      if(disabled) {
        stopDisabledEvent(event);
        return;
      }

      onClick?.(event);
    };
    const handleLinkKeyDown: KeyboardEventHandler<HTMLAnchorElement> = (event) => {
      if(disabled) return;

      onKeyDown?.(event);
      if(!event.defaultPrevented && href === "#" && event.key === " ") {
        event.preventDefault();
        event.currentTarget.click();
      }
    };

    return (
      <a
        {...elementProps as AnchorHTMLAttributes<HTMLAnchorElement>}
        ref={forwardedRef as Ref<HTMLAnchorElement>}
        aria-disabled={disabled || undefined}
        aria-label={ariaLabel}
        className={classes}
        href={safeHref}
        onClick={handleLinkClick}
        onClickCapture={handleClickCapture as MouseEventHandler<HTMLAnchorElement>}
        onKeyDown={handleLinkKeyDown}
        rel={linkRel}
        role={href === "#" ? "button" : undefined}
        style={style}
        target={target}>
        {content}
      </a>
    );
  }

  return (
    <BaseButton
      {...elementProps}
      ref={forwardedRef}
      aria-label={ariaLabel}
      className={classes}
      disabled={isDisabledOrLoading}
      focusableWhenDisabled
      nativeButton={nativeButton}
      onClick={onClick}
      onClickCapture={handleClickCapture}
      onKeyDown={onKeyDown}
      render={render}
      style={style}
      type={type}>
      {content}
    </BaseButton>
  );
});

export default GlButton;
