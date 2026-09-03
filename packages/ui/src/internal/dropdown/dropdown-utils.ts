/**
 * Shared Base UI adapters for dropdown components.
 */

import type {
  GlDropdownCloseReason,
  GlDropdownOffset,
  GlDropdownPlacement,
} from "./dropdown-types";
import type { Menu as BaseMenu } from "@base-ui/react/menu";

export type ResolvedDropdownPlacement = {
  align: BaseMenu.Positioner.Props["align"];
  side: BaseMenu.Positioner.Props["side"];
};

export type ResolvedDropdownOffset = {
  alignOffset: BaseMenu.Positioner.Props["alignOffset"];
  sideOffset: BaseMenu.Positioner.Props["sideOffset"];
};

export function mapDropdownChangeReason(
  reason: BaseMenu.Root.ChangeEventReason,
): GlDropdownCloseReason {
  switch(reason) {
    case "trigger-focus":
    case "trigger-hover":
    case "trigger-press":
    case "list-navigation":
      return "trigger";
    case "outside-press":
    case "sibling-open":
      return "outside";
    case "escape-key":
      return "escape";
    case "item-press":
    case "close-press":
      return "item";
    case "focus-out":
      return "focus-out";
    default:
      return "imperative";
  }
}

export function shouldRestoreDropdownFocus(reason: GlDropdownCloseReason): boolean {
  return reason === "escape" || reason === "item" || reason === "trigger";
}

export function isDropdownItemVisible(element: HTMLElement | null): element is HTMLElement {
  if(!element?.isConnected || element.closest("[hidden]")) return false;

  const view = element.ownerDocument.defaultView;
  if(!view) return false;
  for(let current: HTMLElement | null = element; current; current = current.parentElement) {
    const styles = view.getComputedStyle(current);
    if(
      styles.display === "none"
      || (current === element && styles.display === "contents")
      || styles.visibility === "hidden"
      || styles.visibility === "collapse"
      || styles.contentVisibility === "hidden"
    ) return false;
  }

  return typeof element.checkVisibility === "function"
    ? element.checkVisibility()
    : true;
}

export function resolveDropdownPlacement(
  placement: GlDropdownPlacement,
): ResolvedDropdownPlacement {
  switch(placement) {
    case "right-start":
      return { align: "start", side: "right" };
    case "bottom-end":
    case "right":
      return { align: "end", side: "bottom" };
    case "bottom":
    case "center":
      return { align: "center", side: "bottom" };
    default:
      return { align: "start", side: "bottom" };
  }
}

export function resolveDropdownOffset(offset: GlDropdownOffset): ResolvedDropdownOffset {
  if(typeof offset === "number") {
    return { alignOffset: 0, sideOffset: offset };
  }

  const { alignmentAxis, crossAxis = 0, mainAxis = 0 } = offset;
  return {
    alignOffset: alignmentAxis === undefined
      ? ({ align }) => align === "end" ? -crossAxis : crossAxis
      : alignmentAxis,
    sideOffset: mainAxis,
  };
}
