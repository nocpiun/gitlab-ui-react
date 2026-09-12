/**
 * Shared Base UI adapters for overlay lifecycle callbacks.
 */

import type {
  GlOverlayOpenChangeDetails,
  GlOverlayOpenChangeReason,
} from "./overlay-types.js";

type BaseOpenChangeDetails = {
  event: Event;
  reason: string;
};

export function mapOverlayOpenChangeReason(reason: string): GlOverlayOpenChangeReason {
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
    case "close-watcher":
      return "escape";
    case "item-press":
    case "link-press":
      return "item";
    case "close-press":
      return "close";
    case "focus-out":
      return "focus-out";
    case "disabled":
      return "disabled";
    default:
      return "imperative";
  }
}

export function mapOverlayOpenChangeDetails(
  details: BaseOpenChangeDetails,
): GlOverlayOpenChangeDetails {
  return {
    event: details.event,
    reason: mapOverlayOpenChangeReason(details.reason),
  };
}
