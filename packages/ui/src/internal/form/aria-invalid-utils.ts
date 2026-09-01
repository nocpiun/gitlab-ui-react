/**
 * Shared `aria-invalid` normalization for form components (currently
 * GlFormInput, GlFormRadioGroup and GlFormCheckboxGroup). Internal; not part
 * of the public API.
 */

export type NormalizedAriaInvalid = "true" | "false" | "grammar" | "spelling" | undefined;

/**
 * Normalizes the `ariaInvalid` prop into the `aria-invalid` attribute value:
 * `true`/`"true"`/`""` map to `"true"`; when the prop is unset, a `state` of
 * `false` dictates `"true"` instead; any other non-empty string passes
 * through.
 */
export function normalizeAriaInvalid(
  ariaInvalid: boolean | string | undefined,
  state: boolean | null,
): NormalizedAriaInvalid {
  if(ariaInvalid === true || ariaInvalid === "true" || ariaInvalid === "") {
    return "true";
  }
  if(state === false) {
    return "true";
  }
  if(typeof ariaInvalid === "string" && ariaInvalid) {
    return ariaInvalid as "false" | "grammar" | "spelling";
  }
  return undefined;
}
