---
name: write-component-docs
description: Create or substantially update GitLab UI React component documentation under docs/components with live examples in the matching examples directory. Use when adding a component docs page, expanding its examples, or standardizing its documentation structure. Do not use for component implementation ports or Storybook-only changes.
metadata:
  internal: true
---

# Write component documentation

Create concise component pages that match the current Button documentation. Keep the page useful for both design decisions and React implementation without duplicating Storybook or TypeScript source.

## Establish the source of truth

- Read the repository `AGENTS.md`, preserve unrelated worktree changes, and use pnpm only.
- Read `docs/components/button.mdx` as the canonical page-format reference. If its current structure differs from examples in this skill, follow the current Button page.
- Inspect the target component's React source, public exports, stories, and tests before documenting props or behavior.
- Use the current Pajamas component page for design and accessibility guidance. Treat the local React implementation as the source of truth for the API actually available in this repository.
- Read `apps/website/src/components/docs-example.tsx` before changing how live examples are referenced or rendered.

## Page format

Write component documentation in English unless the user requests another language. Use `docs/components/<component>.mdx` and keep sections in this order:

1. YAML frontmatter with `title` and a one-sentence `description`.
2. `## Usage` with the package import followed by the smallest useful JSX invocation.
3. `## Default` with one short explanatory paragraph and a live `DocsExample`.
4. Additional top-level sections for meaningful variants, sizes, content options, or states. Order them from common to specialized. Each section should normally contain one short paragraph and one focused example.
5. `## Accessibility` with concise, component-specific requirements.
6. `## API` with a short scope note and a three-column table: `Prop`, `Description`, `Default`.
7. `## Related resources` linking, in order, to Pajamas guidance, Storybook, and the local component source on GitHub.

Do not add separate Import or Examples sections. Keep the import inside Usage and make each example topic a level-two section so it appears directly in the page table of contents.

For a compound component, the Usage import and JSX must include every public composition part so readers can see the complete supported structure. When two related components share one page but do not compose together, keep their Usage examples separate rather than forcing them into one tree.

Format Usage snippets for the documentation code viewport, not only for source-file width. Keep lines at or below 80 characters, wrap long imports and JSX prop lists, and expand nested compound parts onto separate indented lines instead of placing parent and child tags on one line. Break long JSX text at natural word boundaries when needed.

Use this `DocsExample` shape:

```mdx
<DocsExample
  filename="button/ButtonExample.tsx"
  title="Example button"
  storybookId="ui-base-button--default"/>
```

The filename is relative to `examples/`. The `storybookId` prop is optional. Set it only after verifying that Storybook contains a story which directly corresponds to the documentation example. If no exact story exists, omit the prop or pass `storybookId=""`; do not link to a merely similar story.

## API table

- Document the component-specific props a reader is likely to need. Do not reproduce every inherited DOM or Base UI prop.
- Give every public component on the page its own level-three API heading, formatted with inline code, for example `### \`GlModalContent\``. Do not combine several components under a generic heading such as "Compound parts" or "Cells".
- For compound APIs, include every public composition part. Add a prop table whenever a part has component-specific props beyond `children`; when it only accepts `children` and inherited element attributes, state that briefly below its heading instead of inventing a redundant table.
- Put allowed values and important type constraints in Description rather than adding a Type column.
- Derive defaults from the implementation, not from memory or upstream Vue defaults.
- Use `—` when a prop has no default.
- Mention inherited props in the introductory API sentence when relevant.

```md
| Prop | Description | Default |
| --- | --- | --- |
| `variant` | Sets the appearance to `default` or `confirm`. | `"default"` |
| `disabled` | Prevents activation while keeping the control focusable. | `false` |
```

## Live examples

Place examples in `examples/<component>/` and use PascalCase filenames ending in `Example.tsx`, such as `ButtonStatesExample.tsx`.

Keep every example as small as the behavior allows:

- Import the public component directly from `gitlab-ui-react`.
- Default-export a zero-prop function and render only the elements needed to demonstrate the concept.
- Prefer explicit JSX for a small fixed set of states. Do not introduce arrays, mapping, helper components, or layout constants merely to shorten a few repeated lines.
- Use unprefixed Tailwind utility classes for example layout, typically `flex`, `grid`, wrapping, alignment, gap, and width. Never use `gl-*` utility class names in example components; write `flex`, `gap-3`, or `max-w-md` instead of `gl-flex`, `gl-gap-3`, or `gl-max-w-md`. Do not use inline styles.
- Do not add local CSS, dependencies, explanatory comments, headings, or prose inside an example unless the behavior cannot be understood without them.
- Avoid state, effects, event handlers, and timers for static visual states. Add interaction only when it is the behavior being documented.
- Preserve semantic HTML and accessible names. Icon-only controls need an accessible label, and related ARIA state must match the visual state.
- Keep each example focused on one topic so its expanded source remains easy to copy.

When an example naturally needs sample identity or project data, reuse the matching repository convention instead of inventing new names. Keep each value in its stated role; for example, use `OPanel` as a project name rather than as a product or feature name. Do not force these entities into examples where they do not fit.

Reserve `OPanel` for UI values that explicitly represent a project name, such as a project field, breadcrumb item, or selector option. Never use `OPanel` in titles, descriptions, announcements, instructional sentences, or other body copy. Use Lorem ipsum for neutral passages that demonstrate text length or wrapping, and use generic component-appropriate sample text when the wording itself needs to be meaningful.

- Avatar image: `https://glui-story.nocp.space/img/avatar.jpg`
- User display name: `Norcleeh`
- User identifier: `NriotHrreion`; display it as `@NriotHrreion` where the interface uses handle notation.
- Organization: `Nocpiun`
- Project: `OPanel`

Only include the entities an example actually needs.

For longer body copy whose purpose is to demonstrate content length, wrapping, or layout—such as a card description—use standard Lorem ipsum text instead of inventing product or domain prose. Keep meaningful interface text such as labels, buttons, accessible names, and short instructional messages specific to the component rather than replacing it with Lorem ipsum; titles may use concise generic sample text but must not use `OPanel`.

Minimal example:

```tsx
import { GlButton } from "gitlab-ui-react";

export default function ButtonExample() {
  return <GlButton>Button</GlButton>;
}
```

Use a layout wrapper only when multiple elements require it:

```tsx
<div className="flex flex-wrap items-center gap-3">
  <GlButton>Default</GlButton>
  <GlButton variant="confirm">Confirm</GlButton>
</div>
```

## Integration and validation

- Add the page to `apps/website/src/components/docs-navigation.tsx` when it is new.
- Reuse the existing markdown and `DocsExample` presentation. Change shared website styles only when the established format cannot express the content correctly.
- Never run the root build or rebuild tokens for a documentation-only change.
- From the repository root, run `pnpm.cmd lint` and `pnpm.cmd --filter website build` on Windows; use the equivalent pnpm commands on other platforms.
- Run `git diff --check` and review the scoped diff. If layout or shared documentation styles changed, inspect the rendered page at desktop and narrow viewport widths.

Report the page and example files created or changed, the validation commands and results, and any pre-existing warnings that remain.
