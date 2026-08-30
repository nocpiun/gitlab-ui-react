/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/components/base/tooltip/tooltip.vue
 *
 * The upstream `target` prop and the `v-gl-tooltip` directive are replaced by
 * Base UI's trigger composition: the single child element is the trigger.
 * The bootstrap-vue `triggers`, `fallbackPlacement`, `offset`, and
 * `variant` props are not ported; hover/focus triggers, collision flipping,
 * and a zero-gap arrow are the built-in behavior. The `show` v-model pair and
 * the imperative open/close/enable/disable root events map to the controlled
 * `open`/`onOpenChange` props.
 */

import { useId, useState, type ReactElement, type ReactNode } from "react";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { getGlTooltipDefaultContainer } from "./container";

export type GlTooltipPlacement = "top" | "right" | "bottom" | "left";

export type GlTooltipProps = {
  /**
   * Collision boundary used when flipping the tooltip. `"viewport"` matches the
   * upstream bootstrap-vue value; defaults to the clipping ancestors.
   */
  boundary?: "viewport" | "clipping-ancestors" | HTMLElement;
  /** A single trigger element; the tooltip opens when it is hovered or focused. */
  children: ReactElement;
  /** Extra class applied to the tooltip popup. */
  className?: string;
  /** How long to wait before closing the tooltip, in milliseconds. */
  closeDelay?: number;
  /**
   * Portal container for the tooltip: an element or a selector.
   * Defaults to the value set by `setGlTooltipDefaultContainer`, else `document.body`.
   */
  container?: HTMLElement | string | null;
  /** Whether the tooltip is initially open (uncontrolled). */
  defaultOpen?: boolean;
  /** How long to wait before opening the tooltip on hover, in milliseconds. */
  delay?: number;
  /** Whether the tooltip is disabled. */
  disabled?: boolean;
  /** ID of the tooltip element; referenced by the trigger's `aria-describedby` while open. */
  id?: string;
  /** Disables the fade transition. */
  noFade?: boolean;
  /** Prevents the tooltip content from being hovered without closing. */
  noninteractive?: boolean;
  /** Controlled open state. */
  open?: boolean;
  /** Event handler called when the tooltip is opened or closed. */
  onOpenChange?: (open: boolean) => void;
  /** Preferred side of the trigger; flips to another side when there is not enough space. */
  placement?: GlTooltipPlacement;
  /** Tooltip content. */
  title?: ReactNode;
};

const resolveContainer = (
  target: HTMLElement | string | null | undefined,
): HTMLElement | null | undefined => {
  if(typeof target === "string") {
    return typeof document === "undefined" ? null : document.querySelector<HTMLElement>(target);
  }
  return target;
};

export default function GlTooltip({
  boundary,
  children,
  className,
  closeDelay = 0,
  container,
  defaultOpen,
  delay = 500,
  disabled = false,
  id,
  noFade = false,
  noninteractive = false,
  open,
  onOpenChange,
  placement = "top",
  title,
}: GlTooltipProps) {
  const generatedId = useId();
  const tooltipId = id ?? `gl-tooltip-${generatedId}`;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = open ?? uncontrolledOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const popupClassName = (state: BaseTooltip.Popup.State) => [
    "tooltip gl-tooltip",
    `bs-tooltip-${state.side}`,
    noFade ? null : "fade",
    noninteractive ? "noninteractive" : null,
    className,
  ].filter(Boolean).join(" ");

  const portalContainer = resolveContainer(
    container === undefined ? getGlTooltipDefaultContainer() : container,
  );

  return (
    <BaseTooltip.Root
      defaultOpen={defaultOpen}
      disabled={disabled}
      disableHoverablePopup={noninteractive}
      onOpenChange={handleOpenChange}
      open={open}>
      <BaseTooltip.Trigger
        aria-describedby={isOpen ? tooltipId : undefined}
        closeDelay={closeDelay}
        closeOnClick={false}
        delay={delay}
        render={children} />
      <BaseTooltip.Portal container={portalContainer}>
        <BaseTooltip.Positioner
          className="gl-tooltip-positioner"
          collisionBoundary={boundary as BaseTooltip.Positioner.Props["collisionBoundary"]}
          collisionPadding={5}
          side={placement}>
          <BaseTooltip.Popup className={popupClassName} id={tooltipId} role="tooltip">
            <BaseTooltip.Arrow className="arrow" />
            <div className="tooltip-inner">{title}</div>
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
