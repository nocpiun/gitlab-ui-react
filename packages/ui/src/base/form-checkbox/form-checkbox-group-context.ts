/**
 * Group state shared by GlFormCheckboxGroup with its child checkboxes
 * (upstream's `getCheckboxGroup` provide/inject). Both GlFormCheckbox and
 * GlFormCheckboxGroup import from here. Internal to the form-checkbox pair.
 */

import { createContext } from "react";

export interface GlFormCheckboxGroupContextValue {
  /**
   * Group-level `aria-describedby`, applied to every grouped checkbox whose
   * own attribute is unset (upstream's PASS_DOWN_ATTRS, extended to slotted
   * children).
   */
  ariaDescribedby?: string;
  /** Group-level `aria-labelledby`, applied like `ariaDescribedby`. */
  ariaLabelledby?: string;
  /** The group's current value (the shared model array). */
  checked: unknown[];
  /** Whether the whole group is disabled. */
  disabled: boolean;
  /** The group's name; always set (user-provided or generated). */
  name: string;
  /** Whether the group requires a selection. */
  required: boolean;
  /** The group's validation state: `true` valid, `false` invalid, `null` none. */
  state: boolean | null;
  /** Updates the shared model and emits the group's input/change events. */
  updateChecked: (checked: unknown[]) => void;
}

export const GlFormCheckboxGroupContext = createContext<GlFormCheckboxGroupContextValue | null>(null);
