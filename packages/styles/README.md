# `@gitlab-ui-react/styles`

The compiled stylesheet for [GitLab UI for React](https://glui.nocp.space). It combines Pajamas
design tokens, foundational styles, component styles, and the `gl-*` utility classes required by
the React component package.

## Installation

Install the component library and stylesheet together:

```sh
pnpm add gitlab-ui-react @gitlab-ui-react/styles
```

The styles package can also be installed by itself when you only need the design system CSS:

```sh
pnpm add @gitlab-ui-react/styles
```

## Usage

Import the stylesheet once from your application entry point, before your application-specific
styles:

```tsx
import "@gitlab-ui-react/styles";

import { GlButton } from "gitlab-ui-react/button";
import "./app.css";
```

The explicit CSS subpath is equivalent:

```ts
import "@gitlab-ui-react/styles/gitlab-ui.css";
```

You can also load the package from CSS when your build tool resolves package imports:

```css
@import "@gitlab-ui-react/styles";
```

The published file is precompiled, so consuming applications do not need Tailwind CSS or PostCSS
to use it.

## What is included

The bundle contains:

- Light and dark Pajamas design tokens from
  [`@gitlab-ui-react/tokens`](https://www.npmjs.com/package/@gitlab-ui-react/tokens).
- A browser reboot, body defaults, typography, icon helpers, and theme foundations.
- Shared form, dropdown, modal, popover, table, tab, breadcrumb, and Markdown styles.
- Styles for the components published by `gitlab-ui-react`.
- Precompiled `gl-*` utility classes used by those components.

The reboot and body rules are global and can affect existing application styles. Import your own
stylesheet after this package when you need application-level overrides.

Internally, the bundle declares the cascade layer order `theme`, `base`, `components`, and
`utilities`. Component defaults remain below utilities so utility classes can override them without
`!important`.

## Color modes

Light mode is the default. The bundle includes both color modes, so switching themes only requires
changing a class:

```ts
const root = document.documentElement;
const isDark = true;

root.classList.toggle("gl-dark", isDark);
root.style.colorScheme = isDark ? "dark" : "light";
```

For mixed-theme pages, use `gl-dark-scope` on a dark subtree and `gl-light-scope` on a light subtree:

```html
<section class="gl-dark-scope">Dark section</section>
<section class="gl-light-scope">Light section</section>
```

`gl-dark` only enables document-wide dark mode when it is placed on the root element.

## Using tokens without the full stylesheet

If you need design tokens but do not want the global reset, component CSS, or utility classes,
install [`@gitlab-ui-react/tokens`](https://www.npmjs.com/package/@gitlab-ui-react/tokens) and
import its CSS outputs directly.

## Repository development

Source styles live in `src`; `dist/gitlab-ui.css` is generated and tracked. Do not edit the compiled
file directly.

From the repository root, validate style changes with:

```sh
pnpm --filter @gitlab-ui-react/styles test
pnpm --filter @gitlab-ui-react/styles build
```

## Related resources

- [GitLab UI for React documentation](https://glui.nocp.space)
- [Pajamas Design System](https://design.gitlab.com)
- [Upstream design repository](https://gitlab.com/gitlab-org/gitlab-services/design.gitlab.com)

## License

[MIT](https://github.com/nocpiun/gitlab-ui-react/blob/main/LICENSE)
