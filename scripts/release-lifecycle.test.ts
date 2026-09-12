import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { resetVersionForPrereleaseTag } from "./version.mts";

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHANGESETS_BIN = join(
  REPOSITORY_ROOT,
  "node_modules",
  "@changesets",
  "cli",
  "bin.js",
);
const PACKAGE_NAMES = [
  "gitlab-ui-react",
  "@gitlab-ui-react/styles",
  "@gitlab-ui-react/tokens",
] as const;
const PACKAGE_DIRECTORIES = ["packages/ui", "packages/styles", "packages/tokens"] as const;
const temporaryDirectories: string[] = [];

afterEach(() => {
  for(const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

function createRepository(): string {
  const root = mkdtempSync(join(tmpdir(), "gitlab-ui-lifecycle-"));
  temporaryDirectories.push(root);
  mkdirSync(join(root, ".changeset"));

  writeFileSync(
    join(root, "package.json"),
    `${JSON.stringify({ name: "release-fixture", private: true }, null, 2)}\n`,
  );
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - \"packages/*\"\n");
  writeFileSync(
    join(root, ".changeset", "config.json"),
    `${JSON.stringify({
      $schema: "https://unpkg.com/@changesets/config@3.1.1/schema.json",
      changelog: "@changesets/cli/changelog",
      commit: false,
      fixed: [[...PACKAGE_NAMES]],
      linked: [],
      access: "public",
      baseBranch: "main",
      updateInternalDependencies: "patch",
      bumpVersionsWithWorkspaceProtocolOnly: true,
      ignore: [],
      privatePackages: { version: false, tag: false },
    }, null, 2)}\n`,
  );

  for(let index = 0; index < PACKAGE_NAMES.length; index += 1) {
    const directory = join(root, PACKAGE_DIRECTORIES[index]);
    mkdirSync(directory, { recursive: true });
    const dependencies = PACKAGE_NAMES[index] === "@gitlab-ui-react/styles"
      ? { "@gitlab-ui-react/tokens": "workspace:^" }
      : undefined;
    writeFileSync(
      join(directory, "package.json"),
      `${JSON.stringify({
        name: PACKAGE_NAMES[index],
        version: "0.0.0",
        ...(dependencies ? { dependencies } : {}),
      }, null, 2)}\n`,
    );
  }

  return root;
}

function writeChangeset(
  root: string,
  id: string,
  bump: "major" | "minor" | "patch",
  summary: string,
  packages: readonly string[] = PACKAGE_NAMES,
): void {
  const frontmatter = packages.map((name) => `"${name}": ${bump}`).join("\n");
  writeFileSync(
    join(root, ".changeset", `${id}.md`),
    `---\n${frontmatter}\n---\n\n${summary}\n`,
  );
}

function changeset(root: string, ...args: string[]): void {
  execFileSync(process.execPath, [CHANGESETS_BIN, ...args], {
    cwd: root,
    stdio: "pipe",
  });
}

function fixedVersion(root: string): string {
  const versions = PACKAGE_DIRECTORIES.map((directory) => {
    const manifest = JSON.parse(
      readFileSync(join(root, directory, "package.json"), "utf8"),
    ) as { version: string };
    return manifest.version;
  });
  expect(new Set(versions)).toHaveLength(1);
  return versions[0];
}

describe("fixed-package release lifecycle", () => {
  it("moves from the 0.x baseline through alpha, beta, and stable", () => {
    const root = createRepository();

    writeChangeset(root, "initial-release", "minor", "Initial public release.");
    changeset(root, "version");
    expect(fixedVersion(root)).toBe("0.1.0");

    writeChangeset(
      root,
      "ui-fix",
      "patch",
      "Fix the UI package.",
      ["gitlab-ui-react"],
    );
    changeset(root, "version");
    expect(fixedVersion(root)).toBe("0.1.1");

    changeset(root, "pre", "enter", "alpha");
    writeChangeset(root, "first-alpha", "major", "Prepare the first alpha.");
    changeset(root, "version");
    expect(fixedVersion(root)).toBe("1.0.0-alpha.0");

    const preStatePath = join(root, ".changeset", "pre.json");
    const preState = JSON.parse(readFileSync(preStatePath, "utf8")) as { tag: string };
    preState.tag = "beta";
    writeFileSync(preStatePath, `${JSON.stringify(preState, null, 2)}\n`);
    for(const directory of PACKAGE_DIRECTORIES) {
      const manifestPath = join(root, directory, "package.json");
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
        version: string;
      };
      manifest.version = resetVersionForPrereleaseTag(manifest.version, preState.tag);
      writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    }
    writeChangeset(root, "first-beta", "patch", "Prepare the first beta.");
    changeset(root, "version");
    expect(fixedVersion(root)).toBe("1.0.0-beta.0");

    changeset(root, "pre", "exit");
    changeset(root, "version");
    expect(fixedVersion(root)).toBe("1.0.0");
  }, 30_000);

  it("resets the numeric counter only when the prerelease tag changes", () => {
    expect(resetVersionForPrereleaseTag("1.0.0-alpha.4", "beta")).toBe(
      "1.0.0-alpha",
    );
    expect(resetVersionForPrereleaseTag("1.0.0-beta.4", "beta")).toBe(
      "1.0.0-beta.4",
    );
    expect(resetVersionForPrereleaseTag("0.4.0", "alpha")).toBe("0.4.0");
  });
});
