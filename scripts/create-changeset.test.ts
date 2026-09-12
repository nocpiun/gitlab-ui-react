import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  affectedPackageNames,
  automaticBump,
  compareVersions,
  decideGeneration,
  latestPackageTagFromTags,
  renderChangeset,
  run,
  writeReleaseSnapshot,
} from "./create-changeset.mts";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for(const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

function commit(root: string, message: string): void {
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync(
    "git",
    ["-c", "commit.gpgSign=false", "commit", "-m", message],
    { cwd: root },
  );
}

function head(root: string): string {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
}

describe("automatic release classification", () => {
  it.each([
    ["feat(ui): add a component", "", "minor"],
    ["fix(ui): correct focus", "", "patch"],
    ["perf(styles): reduce output", "", "patch"],
    ["revert: remove the regression", "", "patch"],
    ["chore(tokens): sync upstream design tokens", "", "patch"],
    ["chore(deps): update package dependencies", "", "patch"],
    ["feat(ui)!: replace the API", "", "minor"],
    ["fix(ui): replace the API", "BREAKING CHANGE: old props were removed", "minor"],
    ["chore(tooling): update development tooling", "", null],
    ["refactor(ui): rename internals", "", null],
    ["docs: update the guide", "", null],
    ["not conventional", "", null],
  ])("maps %s to %s", (subject, body, expected) => {
    expect(automaticBump(subject, body)).toBe(expected);
  });

  it("maps changed paths to public packages instead of commit scopes", () => {
    expect(
      affectedPackageNames([
        "packages/ui/src/base/button/button.tsx",
        "packages/styles/src/components/button.css",
        "docs/en/index.mdx",
      ]),
    ).toEqual(["gitlab-ui-react", "@gitlab-ui-react/styles"]);
  });
});

describe("release tag state", () => {
  it("orders stable and prerelease versions", () => {
    expect(compareVersions("1.0.0-alpha.9", "1.0.0-alpha.10")).toBe(-1);
    expect(compareVersions("1.0.0-alpha.10", "1.0.0-beta.0")).toBe(-1);
    expect(compareVersions("1.0.0-beta.2", "1.0.0")).toBe(-1);
  });

  it("selects package-specific tags and can ignore prereleases", () => {
    const tags = [
      "gitlab-ui-react@0.3.0",
      "gitlab-ui-react@1.0.0-alpha.0",
      "gitlab-ui-react@1.0.0-alpha.2",
      "@gitlab-ui-react/styles@9.0.0",
    ];
    expect(latestPackageTagFromTags(tags, "gitlab-ui-react")).toEqual({
      tag: "gitlab-ui-react@1.0.0-alpha.2",
      version: "1.0.0-alpha.2",
    });
    expect(latestPackageTagFromTags(tags, "gitlab-ui-react", true)).toEqual({
      tag: "gitlab-ui-react@0.3.0",
      version: "0.3.0",
    });
  });

  it("distinguishes initial versioning from a pending first publish", () => {
    expect(decideGeneration("0.0.0", null).action).toBe("generate");
    expect(decideGeneration("0.1.0", null).action).toBe("pending");
    expect(decideGeneration("0.2.0", "0.1.0").action).toBe("pending");
    expect(decideGeneration("0.1.0", "0.1.0").action).toBe("generate");
    expect(decideGeneration("0.1.0", "0.2.0").action).toBe("error");
  });
});

describe("automatic changeset generation", () => {
  it("renders deterministic frontmatter and commit summaries", () => {
    expect(
      renderChangeset(
        {
          "gitlab-ui-react": "minor",
          "@gitlab-ui-react/styles": "patch",
        },
        ["feat(ui): add a component", "fix(styles): correct focus"],
      ),
    ).toBe(`---
"@gitlab-ui-react/styles": patch
"gitlab-ui-react": minor
---

- feat(ui): add a component
- fix(styles): correct focus
`);
  });

  it("generates the first release, waits for publish, and updates one rolling intent", () => {
    const root = mkdtempSync(join(tmpdir(), "gitlab-ui-release-"));
    temporaryDirectories.push(root);
    mkdirSync(join(root, ".changeset"));

    const packages = [
      ["packages/ui", "gitlab-ui-react"],
      ["packages/styles", "@gitlab-ui-react/styles"],
      ["packages/tokens", "@gitlab-ui-react/tokens"],
    ] as const;
    for(const [directory, name] of packages) {
      mkdirSync(join(root, directory), { recursive: true });
      writeFileSync(
        join(root, directory, "package.json"),
        `${JSON.stringify({ name, version: "0.0.0" }, null, 2)}\n`,
      );
    }

    execFileSync("git", ["init"], { cwd: root });
    execFileSync("git", ["config", "user.email", "release-test@example.com"], { cwd: root });
    execFileSync("git", ["config", "user.name", "Release Test"], { cwd: root });
    commit(root, "feat(packages): create public packages");
    const initialSnapshot = head(root);

    const initial = run(root);
    expect(initial.bumps).toEqual({
      "gitlab-ui-react": "minor",
      "@gitlab-ui-react/styles": "minor",
      "@gitlab-ui-react/tokens": "minor",
    });
    expect(readFileSync(initial.written!, "utf8")).toContain(
      "feat(packages): create public packages",
    );
    unlinkSync(initial.written!);

    for(const [directory, name] of packages) {
      writeFileSync(
        join(root, directory, "package.json"),
        `${JSON.stringify({ name, version: "0.1.0" }, null, 2)}\n`,
      );
    }
    writeReleaseSnapshot({ coveredThrough: initialSnapshot, version: "0.1.0" }, root);
    commit(root, "chore: version packages");

    expect(run(root)).toEqual({ bumps: {}, written: null });

    for(const [, name] of packages) {
      execFileSync(
        "git",
        ["-c", "tag.gpgSign=false", "tag", `${name}@0.1.0`],
        { cwd: root },
      );
    }

    writeFileSync(join(root, "packages/ui/button.ts"), "export const button = true;\n");
    commit(root, "fix(button): correct focus");
    const firstUpdate = run(root);
    expect(firstUpdate.bumps).toEqual({ "gitlab-ui-react": "patch" });

    writeFileSync(join(root, "packages/styles/button.css"), ".button {}\n");
    commit(root, "feat(styles): add button styles");
    const secondUpdate = run(root);
    expect(secondUpdate.bumps).toEqual({
      "gitlab-ui-react": "patch",
      "@gitlab-ui-react/styles": "minor",
    });
    const rollingChangeset = readFileSync(secondUpdate.written!, "utf8");
    expect(rollingChangeset).toContain("fix(button): correct focus");
    expect(rollingChangeset).toContain("feat(styles): add button styles");
    const secondSnapshot = head(root);
    unlinkSync(secondUpdate.written!);

    for(const [directory, name] of packages) {
      writeFileSync(
        join(root, directory, "package.json"),
        `${JSON.stringify({ name, version: "0.2.0" }, null, 2)}\n`,
      );
    }
    writeReleaseSnapshot({ coveredThrough: secondSnapshot, version: "0.2.0" }, root);
    commit(root, "chore: version packages");
    expect(run(root)).toEqual({ bumps: {}, written: null });

    for(const [, name] of packages) {
      execFileSync(
        "git",
        ["-c", "tag.gpgSign=false", "tag", `${name}@0.2.0`],
        { cwd: root },
      );
    }
    writeFileSync(join(root, "README.md"), "Documentation only.\n");
    commit(root, "docs: update the readme");
    expect(run(root)).toEqual({ bumps: {}, written: null });

    writeFileSync(join(root, "packages/tokens/synced.tokens.json"), "{}\n");
    commit(root, "chore(tokens): sync upstream design tokens");
    const tokenSync = run(root);
    expect(tokenSync.bumps).toEqual({ "@gitlab-ui-react/tokens": "patch" });
    expect(readFileSync(tokenSync.written!, "utf8")).toContain(
      "chore(tokens): sync upstream design tokens",
    );
    const tokenSnapshot = head(root);
    unlinkSync(tokenSync.written!);

    for(const [directory, name] of packages) {
      writeFileSync(
        join(root, directory, "package.json"),
        `${JSON.stringify({ name, version: "0.2.1" }, null, 2)}\n`,
      );
    }
    writeReleaseSnapshot({ coveredThrough: tokenSnapshot, version: "0.2.1" }, root);
    commit(root, "chore: version packages");
    expect(run(root)).toEqual({ bumps: {}, written: null });
    for(const [, name] of packages) {
      execFileSync(
        "git",
        ["-c", "tag.gpgSign=false", "tag", `${name}@0.2.1`],
        { cwd: root },
      );
    }

    writeFileSync(
      join(root, "package.json"),
      "{\"devDependencies\":{\"vite\":\"latest\"}}\n",
    );
    writeFileSync(join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
    commit(root, "chore(deps): update development dependencies");
    const dependencyUpdate = run(root);
    expect(dependencyUpdate.bumps).toEqual({
      "gitlab-ui-react": "patch",
      "@gitlab-ui-react/styles": "patch",
      "@gitlab-ui-react/tokens": "patch",
    });
  }, 30_000);
});
