/**
 * Shared public lifecycle contracts for components that display overlay content.
 */

export type GlOverlayOpenChangeReason =
  | "trigger"
  | "outside"
  | "escape"
  | "item"
  | "close"
  | "focus-out"
  | "imperative"
  | "disabled";

export type GlOverlayOpenChangeDetails<
  Reason extends GlOverlayOpenChangeReason = GlOverlayOpenChangeReason,
> = {
  /** The event associated with the requested state change. */
  event: Event;
  /** A stable reason that does not expose Base UI's internal reason strings. */
  reason: Reason;
};
