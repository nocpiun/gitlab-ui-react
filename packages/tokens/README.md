# `@gitlab-ui-react/tokens`

Design tokens for [GitLab UI for React](https://glui.nocp.space), generated from the
[Pajamas Design System](https://design.gitlab.com/product-foundations/design-tokens-directory).
The package provides the same token set in CSS, JavaScript, JSON, Sass, Tailwind, and Figma-friendly
formats.

> [!note]
> The token source files are synchronized directly from GitLab's upstream design repository and are
> distributed without changes to their definitions or values. This project only builds and packages
> the upstream tokens into formats that applications and design tools can consume.

## Installation

```sh
pnpm add @gitlab-ui-react/tokens
```

If you use the React component library, install
[`@gitlab-ui-react/styles`](https://www.npmjs.com/package/@gitlab-ui-react/styles) instead. Its
compiled stylesheet already includes the light and dark CSS tokens, and it installs this package as
a dependency.

## CSS

Import both stylesheets once in your application entry stylesheet:

```css
@import "@gitlab-ui-react/tokens/dist/css/tokens.css";
@import "@gitlab-ui-react/tokens/dist/css/tokens.dark.css";
```

Tokens are then available as custom properties:

```css
.product-card {
  color: var(--gl-text-color-default);
  background-color: var(--gl-background-color-default);
  border: 1px solid var(--gl-border-color-default);
  border-radius: var(--gl-border-radius-md);
  padding: var(--gl-spacing-scale-4);
}
```

Prefer semantic tokens such as `--gl-text-color-default` and contextual component tokens over raw
palette values. Semantic tokens preserve the intended meaning when themes change.

### Color modes

The light theme applies to `:root` by default. Import `tokens.dark.css` and use one of the following
classes to change the inherited token values:

- Add `gl-dark` to the document root to enable dark mode for the entire page.
- Add `gl-dark-scope` to an element to enable dark mode for one subtree.
- Add `gl-light-scope` to a subtree to switch it back to light mode.

```html
<html class="gl-dark">
  <body>
    <main>Dark theme</main>
    <aside class="gl-light-scope">Light theme inside a dark page</aside>
  </body>
</html>
```

## JavaScript

The ESM builds expose resolved token values as named constants. Use the dark build when you need a
fixed dark-mode value rather than a theme-aware CSS custom property.

```js
import {
  GL_BACKGROUND_COLOR_DEFAULT,
  GL_SPACING_SCALE_4,
} from "@gitlab-ui-react/tokens/dist/js/tokens.js";

import { GL_BACKGROUND_COLOR_DEFAULT as GL_DARK_BACKGROUND } from "@gitlab-ui-react/tokens/dist/js/tokens.dark.js";
```

## Package contents

| Format        | Files                                                                           | Intended use                                                     |
| ------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| CSS           | `dist/css/tokens.css`, `tokens.dark.css`                                        | Theme-aware CSS custom properties                                |
| JavaScript    | `dist/js/tokens.js`, `tokens.dark.js`                                           | Resolved ESM constants for application code and tooling          |
| JSON          | `dist/json/tokens.json`, `tokens.dark.json`                                     | Structured token data for custom tooling                         |
| Sass          | `dist/scss/_tokens.scss`, `_tokens.dark.scss`, `_tokens_custom_properties.scss` | Resolved Sass variables or Sass aliases to CSS custom properties |
| Tailwind      | `dist/tailwind/tokens.cjs`, `components.cjs`                                    | Theme values and typography components for Tailwind integrations |
| Figma         | `dist/figma/*.json`                                                             | Constants and light/dark mode variables for design tooling       |
| Documentation | `dist/docs/*.json`                                                              | Generated token metadata used by documentation tooling           |

All files in `dist` are generated and published with the package.

## Repository development

Token source files live in `src` and are mirrored from the current upstream GitLab design
repository without local modifications. Token changes must come from upstream; this repository only
maintains the build and distribution tooling. Do not edit generated files in `dist` directly. The
repository's upstream sync workflow owns routine token synchronization and regeneration; follow the
root contributor instructions when changing build tooling.

## Related resources

- [GitLab design token directory](https://design.gitlab.com/product-foundations/design-tokens-directory)
- [GitLab UI for React documentation](https://glui.nocp.space)
- [Upstream design repository](https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com)

## License

[MIT](https://github.com/nocpiun/gitlab-ui-react/blob/main/LICENSE)
