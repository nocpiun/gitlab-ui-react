import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import {
  readReleaseSnapshot,
  run as createAutomaticChangeset,
  writeReleaseSnapshot,
} from "./create-changeset.mts";
import { run as versionPackages } from "./version.mts";

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHANGESETS_BIN = join(
  REPOSITORY_ROOT,
  "node_modules",
  "@changesets",
  "cli",
  "bin.js",
);
const PACKAGES = [
  ["packages/ui", "gitlab-ui-react"],
  ["packages/styles", "@gitlab-ui-react/styles"],
  ["packages/tokens", "@gitlab-ui-react/tokens"],
] as const;
const temporaryDirectories: string[] = [];

afterEach(() => {
  for(const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

function git(root: string, ...args: string[]): string {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
  }).trim();
}

function commit(root: string, message: string): string {
  git(root, "add", ".");
  git(root, "-c", "commit.gpgSign=false", "commit", "-m", message);
  return git(root, "rev-parse", "HEAD");
}

function createRepository(): string {
  const root = mkdtempSync(join(tmpdir(), "gitlab-ui-snapshot-"));
  temporaryDirectories.push(root);
  mkdirSync(join(root, ".changeset"));

  writeFileSync(
    join(root, "package.json"),
    `${JSON.stringify({ name: "release-snapshot-fixture", private: true }, null, 2)}\n`,
  );
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - \"packages/*\"\n");
  writeFileSync(
    join(root, ".changeset", "config.json"),
    `${JSON.stringify({
      changelog: "@changesets/cli/changelog",
      commit: false,
      fixed: [PACKAGES.map(([, name]) => name)],
      linked: [],
      access: "public",
      baseBranch: "main",
      updateInternalDependencies: "patch",
      bumpVersionsWithWorkspaceProtocolOnly: true,
      ignore: [],
      privatePackages: { version: false, tag: false },
    }, null, 2)}\n`,
  );

  for(const [directory, name] of PACKAGES) {
    mkdirSync(join(root, directory), { recursive: true });
    const dependencies = name === "@gitlab-ui-react/styles"
      ? { "@gitlab-ui-react/tokens": "workspace:^" }
      : undefined;
    writeFileSync(
      join(root, directory, "package.json"),
      `${JSON.stringify({
        name,
        version: "0.1.0",
        ...(dependencies ? { dependencies } : {}),
      }, null, 2)}\n`,
    );
  }

  git(root, "init", "--initial-branch=main");
  git(root, "config", "user.email", "release-test@example.com");
  git(root, "config", "user.name", "Release Test");
  commit(root, "chore: create release fixture");
  for(const [, name] of PACKAGES) {
    git(root, "-c", "tag.gpgSign=false", "tag", `${name}@0.1.0`);
  }
  return root;
}

function fixedVersion(root: string): string {
  const versions = PACKAGES.map(([directory]) => {
    const manifest = JSON.parse(
      readFileSync(join(root, directory, "package.json"), "utf8"),
    ) as { version: string };
    return manifest.version;
  });
  expect(new Set(versions)).toHaveLength(1);
  return versions[0];
}

function runChangesetVersion(root: string): void {
  execFileSync(process.execPath, [CHANGESETS_BIN, "version"], {
    cwd: root,
    stdio: "pipe",
  });
}

function runChangeset(root: string, ...args: string[]): void {
  execFileSync(process.execPath, [CHANGESETS_BIN, ...args], {
    cwd: root,
    stdio: "pipe",
  });
}

function tagFixedVersion(root: string, version: string): void {
  for(const [, name] of PACKAGES) {
    git(root, "-c", "tag.gpgSign=false", "tag", `${name}@${version}`);
  }
}

function writeManualChangeset(
  root: string,
  id: string,
  bump: "major" | "minor" | "patch",
  summary: string,
): void {
  const frontmatter = PACKAGES.map(([, name]) => `"${name}": ${bump}`).join("\n");
  writeFileSync(
    join(root, ".changeset", `${id}.md`),
    `---\n${frontmatter}\n---\n\n${summary}\n`,
  );
}

describe("pending release snapshots", () => {
  it("rolls release-worthy commits after a stale snapshot into a new version", () => {
    const root = createRepository();

    writeFileSync(join(root, "packages/ui/focus.ts"), "export const focus = true;\n");
    const fixSha = commit(root, "fix(ui): correct focus behavior");
    expect(createAutomaticChangeset(root).bumps).toEqual({
      "gitlab-ui-react": "patch",
    });
    writeManualChangeset(
      root,
      "manual-note",
      "patch",
      "Preserve this maintainer-authored release note.",
    );

    versionPackages(root, { runChangesetVersion: () => runChangesetVersion(root) });
    expect(fixedVersion(root)).toBe("0.1.1");
    expect(readReleaseSnapshot(root)).toMatchObject({
      coveredThrough: fixSha,
      version: "0.1.1",
    });
    commit(root, "chore: version packages");

    const snapshot = readReleaseSnapshot(root)!;
    unlinkSync(join(root, ".changeset", "release-state.json"));
    expect(() => createAutomaticChangeset(root)).toThrow(/release-state\.json is required/);
    writeReleaseSnapshot(snapshot, root);

    writeReleaseSnapshot({ ...snapshot, version: "9.9.9" }, root);
    expect(() => createAutomaticChangeset(root)).toThrow(/describes version 9\.9\.9/);
    writeReleaseSnapshot({ ...snapshot, coveredThrough: "f".repeat(40) }, root);
    expect(() => createAutomaticChangeset(root)).toThrow(/is not an ancestor of HEAD/);
    writeFileSync(join(root, ".changeset", "release-state.json"), "not json\n");
    expect(() => createAutomaticChangeset(root)).toThrow(/Could not parse/);
    writeReleaseSnapshot(snapshot, root);

    writeFileSync(join(root, "README.md"), "Documentation only.\n");
    commit(root, "docs: update the readme");
    expect(createAutomaticChangeset(root)).toEqual({ bumps: {}, written: null });

    writeFileSync(join(root, "packages/ui/validation.ts"), "export const validation = true;\n");
    const featureSha = commit(root, "feat(form): add validation support");
    const replacement = createAutomaticChangeset(root);
    expect(replacement.bumps).toEqual({ "gitlab-ui-react": "minor" });
    expect(readFileSync(replacement.written!, "utf8")).toContain(
      "feat(form): add validation support",
    );

    versionPackages(root, { runChangesetVersion: () => runChangesetVersion(root) });
    expect(fixedVersion(root)).toBe("0.2.0");
    expect(readReleaseSnapshot(root)).toMatchObject({
      coveredThrough: featureSha,
      version: "0.2.0",
    });

    const changelog = readFileSync(join(root, "packages/ui/CHANGELOG.md"), "utf8");
    expect(changelog).toContain("## 0.2.0");
    expect(changelog).toContain("### Features");
    expect(changelog).toContain("add validation support");
    expect(changelog).toContain("### Bug Fixes");
    expect(changelog).toContain("correct focus behavior");
    expect(changelog).toContain("Preserve this maintainer-authored release note.");
    expect(changelog).not.toContain("## 0.1.1");
  }, 30_000);

  it.each(["alpha", "beta"])(
    "preserves commits while rolling an unpublished %s snapshot",
    (channel) => {
      const root = createRepository();
      runChangeset(root, "pre", "enter", channel);
      writeManualChangeset(root, `first-${channel}`, "major", `Prepare ${channel}.`);
      commit(root, `chore(release): enter ${channel}`);

      versionPackages(root, { runChangesetVersion: () => runChangesetVersion(root) });
      const firstPrerelease = `1.0.0-${channel}.0`;
      expect(fixedVersion(root)).toBe(firstPrerelease);
      commit(root, `chore: version packages (${channel})`);
      tagFixedVersion(root, firstPrerelease);

      writeFileSync(join(root, "packages/ui/prerelease-fix.ts"), "export const fix = true;\n");
      commit(root, "fix(ui): correct prerelease behavior");
      expect(createAutomaticChangeset(root).bumps).toEqual({
        "gitlab-ui-react": "patch",
      });
      versionPackages(root, { runChangesetVersion: () => runChangesetVersion(root) });
      const pendingPrerelease = `1.0.0-${channel}.1`;
      expect(fixedVersion(root)).toBe(pendingPrerelease);
      commit(root, `chore: version packages (${channel})`);

      writeFileSync(
        join(root, "packages/ui/prerelease-feature.ts"),
        "export const feature = true;\n",
      );
      const featureSha = commit(root, "feat(ui): add prerelease feature");
      expect(createAutomaticChangeset(root).bumps).toEqual({
        "gitlab-ui-react": "minor",
      });
      versionPackages(root, { runChangesetVersion: () => runChangesetVersion(root) });

      const replacementPrerelease = `1.0.0-${channel}.2`;
      expect(fixedVersion(root)).toBe(replacementPrerelease);
      expect(readReleaseSnapshot(root)).toMatchObject({
        coveredThrough: featureSha,
        version: replacementPrerelease,
      });
      const changelog = readFileSync(join(root, "packages/ui/CHANGELOG.md"), "utf8");
      expect(changelog).toContain(`## ${replacementPrerelease}`);
      expect(changelog).toContain("correct prerelease behavior");
      expect(changelog).toContain("add prerelease feature");
      expect(changelog).not.toContain(`## ${pendingPrerelease}`);
      expect(changelog).toContain(`## ${firstPrerelease}`);
    },
    30_000,
  );
});
