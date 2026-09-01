/**
 * Ported from GitLab UI:
 * packages/gitlab-ui/src/utils/form_options_utils.js
 *
 * Normalizes the `options` arrays of form group components. Consumed by
 * GlFormRadioGroup and GlFormCheckboxGroup; the option shape intentionally
 * covers only the { value, text, html, disabled } semantics of those
 * components. Internal; not part of the public API.
 */

/** A raw option: a primitive, or an object with { value, text, html, disabled }. */
export type FormOption = string | number | {
  value?: unknown;
  text: string;
  html?: string;
  disabled?: boolean;
};

export type NormalizedFormOption = {
  value: unknown;
  text: string;
  html?: string;
  disabled: boolean;
};

/**
 * Normalizes an options array into a consistent format for rendering.
 * Primitives are converted to `{ value, text, disabled: false }`. For
 * objects, `value` defaults to `text` when omitted and `disabled` defaults
 * to `false`. A non-array input normalizes to an empty array.
 */
export function normalizeFormOptions(options: unknown): NormalizedFormOption[] {
  if(!Array.isArray(options)) {
    return [];
  }
  return options.map((option: FormOption) => {
    if(option !== null && typeof option === "object") {
      const { value, text, html, disabled } = option;
      return {
        value: value === undefined ? text : value,
        text: String(text),
        html,
        disabled: Boolean(disabled),
      };
    }
    return {
      value: option,
      text: String(option),
      disabled: false,
    };
  });
}
