# Focused verification

Use the cheapest proof that can catch each likely regression, then escalate only where needed.

## Test design

- Unit tests should cover rendered semantics, defaults, variants, state attributes/classes, callbacks, ref forwarding, security rules, and edge values.
- Interaction tests must exercise keyboard/pointer behavior and composed `render` elements. DOM snapshots alone cannot prove navigation or event behavior.
- Build small state matrices rather than one story per trivial permutation. Include only supported combinations and one or two boundary cases.
- Storybook stories inherit `args` and `children`; clear inherited values explicitly when a story needs an empty-child or alternate-content case.
- React accepts hyphenated `data-*` attributes in JSX, but `data-testid` is not a declared key of `HTMLAttributes`. An object literal passed to a helper typed as `Partial<ComponentProps<typeof Component>>` therefore fails excess-property checking. For a generic attribute-passthrough assertion, use a declared HTML attribute such as `title`; when the data attribute itself is under test, render it directly on the component in JSX. Do not widen the production props solely to make the test helper accept `data-testid`.
- CSS-generated text may affect browser accessible names. Query by role with a regex or semantic prefix when that is intentional.
- A static Storybook build validates compilation, not `play` assertions. Run the Storybook test command or inspect the built story when interaction behavior matters.

## Validation helper

Focused validation:

```sh
node scripts/validate-component.mjs <component-name>
```

Optional flags:

- `--skip-styles` when the component genuinely has no CSS work;
- `--skip-storybook` when no usable story exists;
- `--standard-only` for repository-standard checks immediately after a successful focused run;
- `--full` to run focused and repository-standard checks in one command;
- `--root <path>` only for testing the helper against a fixture or alternate checkout.

The focused test intentionally uses a temporary minimal Vitest config. This is a fallback for failures that occur before test discovery, such as an ESM directory-import error in the repository config. It is not permission to ignore failures in the component test itself.

Make one standard-tool attempt before delivery. If the same unrelated loader or filesystem failure blocks it, record the exact command and cause; do not spend the porting task repairing unrelated infrastructure.

## Browser and visual checks

Use a browser only for behavior or rendering that static checks cannot establish, such as computed focus styling, dark-theme contrast, pseudo-element output, or real router interaction. Consolidate the relevant states in one matrix story, then inspect DOM/accessibility and computed styles in the same pass.

Do not start a visual pass until typechecking, focused tests, and the Storybook build pass.

## Final audit

- Review the whole scoped diff and run `git diff --check`.
- Confirm the module export and all public type exports.
- Confirm the CSS import and regenerated tracked styles artifacts.
- Confirm `packages/tokens/dist` has no diff.
- Check dependency placement, Vite externals, and lockfile changes when dependencies changed.
- Check `git status --short` so generated or temporary files are not accidentally delivered.
