# Releases

Releases are managed by Changesets and `.github/workflows/release.yml`. On each
successful push to `main`, CI derives a temporary changeset from the
Conventional Commits since the latest package tags. The Changesets action keeps
one rolling `chore: version packages` pull request up to date. Merging that pull
request publishes all three public packages, creates package tags, and creates
GitHub Releases.

The public packages form a fixed group and always share one version:

- `gitlab-ui-react`
- `@gitlab-ui-react/styles`
- `@gitlab-ui-react/tokens`

## Automatic versioning

| Commit | Automatic bump |
| --- | --- |
| `feat` | minor |
| `fix`, `perf`, `revert` | patch |
| `chore(tokens)` | patch, for published upstream token syncs |
| `chore(deps)` | patch, including repository-level dependency updates |
| `type!` or a `BREAKING CHANGE` footer | minor, shown as a breaking change |
| all other types | none |

Major versions are deliberately never inferred. Before merging a version pull
request that should be a major release, run `pnpm changeset`, select all three
packages with a `major` bump, commit the generated Markdown file, and merge it
to `main`. The rolling version pull request will update automatically.

## Prerelease lifecycle

Before entering prerelease mode, publish all pending `0.x` changes.

1. Enter alpha with `pnpm changeset pre enter alpha`, add a manual major
   changeset for all three packages, and commit both changes. The next version
   is `1.0.0-alpha.0`.
2. To enter beta, change the `tag` in `.changeset/pre.json` from `alpha` to
   `beta` and add a patch changeset for all three packages. The next version is
   `1.0.0-beta.0`. The version script resets Changesets' numeric prerelease
   counter when it detects the tag change.
3. To publish `1.0.0`, run `pnpm changeset pre exit` and commit the result.

Prereleases intentionally become npm's `latest` version. During alpha and beta,
ordinary installs therefore receive the newest prerelease.

Files named `.changeset/auto-*.md` are reserved for CI and must not be committed.
See [`RELEASING.md`](../RELEASING.md) for initial npm authentication and trusted
publisher setup.
