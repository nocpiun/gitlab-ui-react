/**
 * Shared public contracts for dropdown components built on Base UI Menu.
 */

import type { HTMLAttributes } from "react";

export type GlDropdownCloseReason =
  | "trigger"
  | "outside"
  | "escape"
  | "item"
  | "focus-out"
  | "imperative";

export type GlDropdownOpenChangeDetails = {
  /** The native event that caused the state change. */
  event: Event;
  /** A stable reason that does not expose Base UI's internal reason strings. */
  reason: GlDropdownCloseReason;
};

export type GlDropdownBeforeCloseDetails = GlDropdownOpenChangeDetails & {
  readonly defaultPrevented: boolean;
  /** Prevents this close operation. */
  preventDefault(): void;
};

export type GlDropdownHandle = {
  /** Opens the popup and associates it with this dropdown's trigger. */
  open(): void;
  /** Closes the popup without moving focus. */
  close(): void;
  /** Closes the popup and restores focus to the trigger. */
  closeAndFocus(): void;
  /** Checks both the inline root and a possibly portalled popup. */
  containsElement(element: Element | null): boolean;
};

export type GlDropdownPlacement =
  | "right-start"
  | "bottom-start"
  | "bottom-end"
  | "bottom"
  /** @deprecated Use `bottom-start`. */
  | "left"
  /** @deprecated Use `bottom`. */
  | "center"
  /** @deprecated Use `bottom-end`. */
  | "right";

export type GlDropdownOffset = number | {
  alignmentAxis?: number;
  crossAxis?: number;
  mainAxis?: number;
};

export type GlDropdownPositioningStrategy = "absolute" | "fixed";

export type GlDropdownHeaderProps = HTMLAttributes<HTMLDivElement>;
export type GlDropdownFooterProps = HTMLAttributes<HTMLDivElement>;
