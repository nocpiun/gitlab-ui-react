/**
 * The classes that decide which set of token values applies to an element.
 *
 * Dark mode is applied either to the whole document, by putting `gl-dark` on the root, or to a
 * subtree, by putting `gl-dark-scope` on any ancestor. `gl-light-scope` flips a subtree back.
 *
 * These are the single source of truth: `scripts/build_tokens.mjs` builds the CSS selectors from
 * them, so the stylesheets and any JavaScript that has to reason about the colour mode cannot drift
 * apart. Changing a name here changes both.
 */
export const DARK_ROOT_CLASS = "gl-dark";
export const DARK_SCOPE_CLASS = "gl-dark-scope";
export const LIGHT_SCOPE_CLASS = "gl-light-scope";

export const LIGHT_SELECTOR = `:root, .${LIGHT_SCOPE_CLASS}`;
export const DARK_SELECTOR = `:root.${DARK_ROOT_CLASS}, .${DARK_SCOPE_CLASS}`;
