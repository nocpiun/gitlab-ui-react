/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/alert/alert.vue
 *
 * Adaptations:
 * - Vue slots map to `children` (body) and the `actions` render prop.
 * - The `primary-action`/`secondary-action`/`dismiss` events map to the
 *   `onPrimaryAction`/`onSecondaryAction`/`onDismiss` callbacks.
 * - The exposed `focus()` method maps to the forwarded div ref; the
 *   `gl-focus` class is applied only when the alert itself is focused
 *   programmatically (e.g. `ref.current.focus()`), mirroring the upstream
 *   `focus()` method. Pointer-initiated focus and focus landing on a child
 *   control do not add the class.
 * - The i18n default for the dismiss label resolves to the upstream
 *   default "Dismiss"; this package has no i18n runtime.
 */

import {
  forwardRef,
  useRef,
  useState,
  type FocusEventHandler,
  type HTMLAttributes,
  type MouseEventHandler,
  type PointerEventHandler,
  type ReactNode,
} from "react";
import { cva } from "class-variance-authority";
import GlButton from "../button/button";
import GlIcon from "../icon/icon";

export type GlAlertVariant = "danger" | "info" | "success" | "tip" | "warning";
export type GlAlertPoliteness = "assertive" | "off" | "polite";
export type GlAlertHeaderLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type GlAlertProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> & {
  /** Content rendered inside the actions area, replacing the action buttons. */
  actions?: ReactNode;
  /** The alert message to display. */
  children?: ReactNode;
  /** Controls the dismiss button's visibility. */
  dismissible?: boolean;
  /** The close button's label, used for the button's `aria-label` attribute. */
  dismissLabel?: string;
  /** The header level used for the title (h1–h6). Set an appropriate value for the context where the alert is used. */
  headerLevel?: GlAlertHeaderLevel;
  /** Emitted when the dismiss button is clicked. */
  onDismiss?: MouseEventHandler<HTMLElement>;
  /** Emitted when the primary action button is clicked. */
  onPrimaryAction?: MouseEventHandler<HTMLElement>;
  /** Emitted when the secondary action button is clicked. */
  onSecondaryAction?: MouseEventHandler<HTMLElement>;
  /** The `aria-live` attribute on the alert. Only use `"assertive"` if the alert requires immediate user action. */
  politeness?: GlAlertPoliteness;
  /** If provided, renders the primary button as a link. */
  primaryButtonLink?: string;
  /** If provided, renders a primary action button. */
  primaryButtonText?: string;
  /** If provided, renders the secondary button as a link. */
  secondaryButtonLink?: string;
  /** If provided, renders a secondary action button. */
  secondaryButtonText?: string;
  /** When true, the alert stays fixed at the top of its container. */
  sticky?: boolean;
  /** The title text to display in the alert header. */
  title?: string;
  /** The variant of the alert. */
  variant?: GlAlertVariant;
};

const alertVariantIconMap = {
  danger: "error",
  info: "information-o",
  success: "check-circle",
  tip: "bulb",
  warning: "warning",
} as const satisfies Record<GlAlertVariant, string>;

const alertVariants = cva("gl-alert", {
  variants: {
    variant: {
      danger: "gl-alert-danger",
      info: "gl-alert-info",
      success: "gl-alert-success",
      tip: "gl-alert-tip",
      warning: "gl-alert-warning",
    },
    sticky: {
      false: null,
      true: "gl-alert-sticky",
    },
    dismissible: {
      false: "gl-alert-not-dismissible",
      true: null,
    },
    hasTitle: {
      false: null,
      true: "gl-alert-has-title",
    },
    hasProgrammaticFocus: {
      false: null,
      true: "gl-focus",
    },
  },
});

const headingTags = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
} as const;

const isAlertRole = (variant: GlAlertVariant) => variant === "danger"
  || variant === "success"
  || variant === "warning";

const GlAlert = forwardRef<HTMLDivElement, GlAlertProps>(function GlAlert({
  actions,
  children,
  className,
  dismissible = true,
  dismissLabel = "Dismiss",
  headerLevel = 2,
  onBlur,
  onDismiss,
  onFocus,
  onPointerDown,
  onPrimaryAction,
  onSecondaryAction,
  politeness = "polite",
  primaryButtonLink,
  primaryButtonText,
  secondaryButtonLink,
  secondaryButtonText,
  sticky = false,
  title,
  variant = "info",
  ...elementProps
}, forwardedRef) {
  const [hasProgrammaticFocus, setHasProgrammaticFocus] = useState(false);
  const pointerInteractionRef = useRef(false);

  const hasTitle = Boolean(title);
  const shouldRenderActions = Boolean(actions || primaryButtonText || secondaryButtonText);
  const TitleTag = headingTags[headerLevel];

  const handlePointerDown: PointerEventHandler<HTMLDivElement> = (event) => {
    pointerInteractionRef.current = true;
    onPointerDown?.(event);
  };

  // React's onFocus/onBlur bubble, so focus landing on a child control (e.g.
  // the dismiss button) reaches this handler too; only the alert element's
  // own, non-pointer focus mirrors the upstream `focus()` method.
  const handleFocus: FocusEventHandler<HTMLDivElement> = (event) => {
    const isPointerFocus = pointerInteractionRef.current;
    pointerInteractionRef.current = false;

    if(event.target === event.currentTarget && !isPointerFocus) {
      setHasProgrammaticFocus(true);
    }

    onFocus?.(event);
  };

  const handleBlur: FocusEventHandler<HTMLDivElement> = (event) => {
    if(event.target === event.currentTarget) {
      setHasProgrammaticFocus(false);
    }

    onBlur?.(event);
  };

  return (
    <div
      {...elementProps}
      ref={forwardedRef}
      aria-live={politeness}
      className={alertVariants({
        className,
        dismissible,
        hasProgrammaticFocus,
        hasTitle,
        sticky,
        variant,
      })}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onPointerDown={handlePointerDown}
      role={isAlertRole(variant) ? "alert" : "status"}
      tabIndex={-1}>
      <div className="gl-alert-icon-container">
        <GlIcon className="gl-alert-icon" name={alertVariantIconMap[variant]} />
      </div>
      <div className="gl-alert-content">
        {hasTitle ? <TitleTag className="gl-alert-title">{title}</TitleTag> : null}

        <div className="gl-alert-body">{children}</div>

        {shouldRenderActions ? (
          <div className="gl-alert-actions">
            {actions ?? (
              <>
                {primaryButtonText ? (
                  <GlButton
                    category="primary"
                    className="gl-alert-action"
                    href={primaryButtonLink || undefined}
                    onClick={onPrimaryAction}
                    variant="confirm">
                    {primaryButtonText}
                  </GlButton>
                ) : null}
                {secondaryButtonText ? (
                  <GlButton
                    category="secondary"
                    className="gl-alert-action"
                    href={secondaryButtonLink || undefined}
                    onClick={onSecondaryAction}
                    variant="default">
                    {secondaryButtonText}
                  </GlButton>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </div>

      {dismissible ? (
        <GlButton
          aria-label={dismissLabel}
          category="tertiary"
          className="gl-dismiss-btn"
          icon="close"
          onClick={onDismiss}
          size="small" />
      ) : null}
    </div>
  );
});

export default GlAlert;
