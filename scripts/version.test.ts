import type { Commit } from "./create-changeset.mts";
import { describe, expect, it } from "vitest";

import {
  contributorNames,
  groupedChangelogBody,
  parseManualChangeset,
  removeReleaseSection,
  rewriteReleaseSection,
} from "./version.mts";

function commit(overrides: Partial<Commit>): Commit {
  return {
    authorEmail: "123+octocat@users.noreply.github.com",
    authorName: "The Octocat",
    body: "",
    files: ["packages/ui/index.ts"],
    sha: "abc123",
    subject: "fix(ui): correct focus (#1)",
    ...overrides,
  };
}

describe("release changelogs", () => {
  it("separates breaking changes while keeping them out of the automatic major bump", () => {
    const body = groupedChangelogBody([
      commit({ subject: "feat(button)!: replace the composition API (#3)" }),
      commit({ sha: "def456", subject: "feat(form): add a selector (#2)" }),
      commit({ sha: "ghi789" }),
      commit({
        sha: "jkl012",
        subject: "chore(tokens): sync upstream design tokens (#4)",
      }),
      commit({
        sha: "mno345",
        subject: "chore(deps): update package dependencies (#5)",
      }),
    ]);

    expect(body).toContain("### Breaking Changes");
    expect(body).toContain("**button:** replace the composition API (#3)");
    expect(body).toContain("### Features");
    expect(body).toContain("### Bug Fixes");
    expect(body).toContain("### Upstream Syncs");
    expect(body).toContain("**tokens:** sync upstream design tokens (#4)");
    expect(body).toContain("### Dependency Updates");
    expect(body).toContain("**deps:** update package dependencies (#5)");
    expect(body).toContain("### Contributors\n\n- @octocat");
  });

  it("uses an explicit synchronization note for packages without direct commits", () => {
    expect(groupedChangelogBody([])).toContain("### Version Synchronization");
  });

  it("preserves manual major release notes", () => {
    const parsed = parseManualChangeset(`---
"gitlab-ui-react": major
"@gitlab-ui-react/styles": major
"@gitlab-ui-react/tokens": major
---

Prepare the first alpha release.
`);
    expect(parsed).toEqual({
      packages: [
        "gitlab-ui-react",
        "@gitlab-ui-react/styles",
        "@gitlab-ui-react/tokens",
      ],
      summary: "Prepare the first alpha release.",
    });
  });

  it("rewrites only the newest release section", () => {
    const changelog = `# gitlab-ui-react

## 0.2.0

### Minor Changes

- generated

## 0.1.0

- previous
`;
    const rewritten = rewriteReleaseSection(
      changelog,
      "0.2.0",
      "### Features\n\n- new component",
    );
    expect(rewritten).toContain("## 0.2.0\n\n### Features\n\n- new component");
    expect(rewritten).toContain("## 0.1.0\n\n- previous");
    expect(rewritten).not.toContain("### Minor Changes");
  });

  it("removes a release section that was never published", () => {
    const changelog = `# gitlab-ui-react

## 0.2.0

- current

## 0.1.1

- superseded

## 0.1.0

- published
`;
    const updated = removeReleaseSection(changelog, "0.1.1");

    expect(updated).toContain("## 0.2.0\n\n- current");
    expect(updated).toContain("## 0.1.0\n\n- published");
    expect(updated).not.toContain("## 0.1.1");
    expect(updated).not.toContain("superseded");
  });
});

describe("contributors", () => {
  it("deduplicates people and ignores bots", () => {
    expect(
      contributorNames([
        commit({}),
        commit({ sha: "2", authorEmail: "octocat@users.noreply.github.com" }),
        commit({
          sha: "3",
          authorEmail: "person@example.com",
          authorName: "Human Contributor",
        }),
        commit({
          sha: "4",
          authorEmail: "bot@example.com",
          authorName: "github-actions[bot]",
        }),
      ]),
    ).toEqual(["@octocat", "Human Contributor"]);
  });
});
