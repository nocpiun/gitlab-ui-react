/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/broadcast_message/broadcast_message.vue
 *
 * Adaptations:
 * - Vue's default slot maps to `children`, and the `dismiss` event maps to
 *   `onDismiss`.
 * - The upstream i18n defaults resolve to English strings because this
 *   package has no i18n runtime.
 */

import {
  forwardRef,
  type HTMLAttributes,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import { cva } from "class-variance-authority";
import GlButton from "../button/button";
import GlIcon from "../icon/icon";

export type GlBroadcastMessageTheme =
  | "indigo"
  | "light-indigo"
  | "blue"
  | "light-blue"
  | "green"
  | "light-green"
  | "red"
  | "light-red"
  | "dark"
  | "light";

export type GlBroadcastMessageType = "banner" | "notification";

export type GlBroadcastMessageProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  /** The broadcast message's content. */
  children?: ReactNode;
  /** Controls the dismiss button's visibility for banner messages. */
  dismissible?: boolean;
  /** The dismiss button's accessible label. */
  dismissLabel?: string;
  /** The icon shown next to the message. */
  iconName?: string;
  /** Called when the dismiss button is clicked. */
  onDismiss?: MouseEventHandler<HTMLElement>;
  /** The banner color theme. Notification messages do not use this theme visually. */
  theme?: GlBroadcastMessageTheme;
  /** The message layout. Notifications always show a dismiss button. */
  type?: GlBroadcastMessageType;
};

const broadcastMessageVariants = cva("gl-broadcast-message", {
  variants: {
    theme: {
      indigo: "indigo",
      "light-indigo": "light-indigo",
      blue: "blue",
      "light-blue": "light-blue",
      green: "green",
      "light-green": "light-green",
      red: "red",
      "light-red": "light-red",
      dark: "dark",
      light: "light",
    },
    type: {
      banner: "banner",
      notification: "notification",
    },
  },
  defaultVariants: {
    theme: "indigo",
    type: "banner",
  },
});

const GlBroadcastMessage = forwardRef<HTMLDivElement, GlBroadcastMessageProps>(
  function GlBroadcastMessage({
    children,
    className,
    dismissible = true,
    dismissLabel = "Dismiss",
    iconName = "bullhorn",
    onDismiss,
    theme = "indigo",
    type = "banner",
    ...elementProps
  }, forwardedRef) {
    const showDismissButton = dismissible || type === "notification";

    return (
      <div
        {...elementProps}
        ref={forwardedRef}
        className={broadcastMessageVariants({ className, theme, type })}>
        <div className="gl-broadcast-message-content">
          <div className="gl-broadcast-message-icon">
            <GlIcon name={iconName} />
          </div>
          <div className="gl-broadcast-message-text">
            <h2 className="gl-sr-only">Admin message</h2>
            {children}
          </div>
        </div>

        {showDismissButton ? (
          <GlButton
            aria-label={dismissLabel}
            category="tertiary"
            className="gl-broadcast-message-dismiss"
            icon="close"
            onClick={onDismiss}
            size="small" />
        ) : null}
      </div>
    );
  },
);

export default GlBroadcastMessage;
