---
name: port-gitlab-ui-component
description: Port or substantially synchronize a GitLab UI/Pajamas component from Vue into this gitlab-ui-react monorepo. Use for components under packages/ui that require upstream behavior analysis, React/Base UI adaptation, colocated CSS, public exports, tests, stories, and scoped validation. Do not use for token-only synchronization or unrelated React components.
metadata:
   internal: true
---

# Port a GitLab UI component

Use the repository-root helpers in `scripts/` for repeatable discovery, scaffolding, and validation. They deliberately do not generate component behavior: derive that from current upstream source, tests, stories, and documentation.

## Non-negotiable constraints

- Read the repository `AGENTS.md` before acting and preserve unrelated worktree changes.
- Treat `gitlab-org/gitlab-services/design.gitlab.com`, under `packages/gitlab-ui`, as upstream. Do not use the archived `gitlab-org/gitlab-ui` repository as the current source.
- Preserve observable behavior, visual semantics, accessibility, and documented support. Adapt Vue concepts to idiomatic typed React; never add a Vue runtime or reproduce Vue internals.
- Use Base UI as the primitive when appropriate (except icons), `cva` for variants, colocated CSS, public exports, tests, and stories.
- Never run the root `pnpm build` or otherwise rebuild tokens. Only regenerate tracked styles output through the styles package build.
- Use `pnpm` only. On Windows, invoke `pnpm.cmd` when the PowerShell shim is blocked by execution policy.

## Fast workflow

### 1. Establish a compact baseline

Inspect `git status --short`, the relevant package manifests, nearby completed components, and any existing target files. Group independent read-only checks instead of opening files one by one.

Before invoking the upstream helper, load the repository's `glab` skill because the helper calls GitLab through `glab`. Then run:

```sh
node scripts/upstream-baseline.mjs <component-name>
```

The helper always targets `gitlab.com`, compares upstream blobs with the installed `@gitlab/ui` snapshot by Git object hash, and writes only missing or changed upstream material to a temporary directory. Read the exact local Vue/SCSS matches and the fetched tests, stories, or documentation named in its summary. Do not dump remote source bodies into the conversation. Use web browsing only if this baseline is unavailable, ambiguous, or lacks required design documentation.

Pass the local kebab-case component name. The helper automatically maps it to GitLab UI's snake_case directory and also accepts snake_case input for manual use.

Before coding, write a short compatibility checklist covering only the component's actual surface:

- public props, defaults, types, slots, events, refs, and rendered element;
- variants, states, security behavior, focus/keyboard behavior, ARIA, and edge cases;
- CSS dependencies, tokens, icons, transitive global styles, and package dependencies;
- tests and stories needed to prove the port.

Prefer upstream tests and stories as the checklist. Do not investigate framework internals until a concrete compatibility question requires it.

### 2. Scaffold mechanical files once

After deciding the React symbol and exported type names, run:

```sh
node scripts/scaffold-component.mjs <component-name> \
  --symbol GlComponentName \
  --types GlComponentNameProps,GlComponentNameVariant
```

The helper creates missing component files, registers the public exports, and imports the component CSS. It never overwrites existing files and is safe to rerun. Use `--dry-run` to inspect its plan. Use `--types none` when the component exposes no public types.

Read [references/react-porting.md](references/react-porting.md) before implementing. Use an outline tool only for large dependency files; directly read small target files.

### 3. Implement behavior before breadth

Build the smallest semantic core first, then styles, tests, and stories. Keep the implementation reviewable and avoid speculative abstractions. Add a concise upstream provenance comment to substantially ported source and style files.

If upstream behavior cannot be supported without a missing local primitive, either add the smallest reusable prerequisite within scope or preserve a clear typed API boundary and document the deliberate deferral. Never silently drop a supported state.

### 4. Verify in increasing cost order

Read [references/verification.md](references/verification.md), then run the focused helper:

```sh
node scripts/validate-component.mjs <component-name>
```

It runs target lint, focused tests, the UI build, the styles build when applicable, and the Storybook build when a story exists. It uses a temporary minimal Vitest configuration for the focused test so an unrelated root-config loader failure does not hide component regressions.

After the focused checks pass and no implementation files changed, run one repository-standard attempt without repeating the focused build:

```sh
node scripts/validate-component.mjs <component-name> --standard-only
```

Use `--full` instead when a single command should run both focused and standard checks. The standard pass records failures without trying to repair unrelated infrastructure. Use browser interaction only when static tests and the Storybook build cannot establish behavior or visual fidelity; consolidate required states into one matrix story and one inspection pass.

## Delivery

Review `git diff --check`, the scoped diff, public exports, styles registration and generated styles output, lockfile changes, and `git status --short`. Confirm `packages/tokens/dist` was untouched.

Report:

- the component API and behavior delivered;
- meaningful adaptations or deliberate deviations from upstream;
- commands run and their results, including unrelated standard-tool failures;
- generated artifacts or dependency/lockfile changes.
