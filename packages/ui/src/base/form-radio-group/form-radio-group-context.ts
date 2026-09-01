/**
 * Group state shared by GlFormRadioGroup with its child radios (upstream's
 * `getRadioGroup` provide/inject). Owned by the form-radio-group directory so
 * the group never depends on the child component's module; both GlFormRadio
 * and GlFormRadioGroup import from here. Internal to the form-radio pair.
 */

import { createContext } from "react";

export interface GlFormRadioGroupContextValue {
  /** The group's current value (the shared model). */
  checked: unknown;
  /** Whether the whole group is disabled. */
  disabled: boolean;
  /** The group's name; always set (user-provided or generated). */
  name: string;
  /** Whether the group requires a selection. */
  required: boolean;
  /** The group's validation state: `true` valid, `false` invalid, `null` none. */
  state: boolean | null;
  /** Selects a value: updates the shared model and emits the group's events. */
  select: (value: unknown) => void;
}

export const GlFormRadioGroupContext = createContext<GlFormRadioGroupContextValue | null>(null);
