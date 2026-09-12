#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type Bump = "major" | "minor" | "patch";

export type PackageDefinition = {
  directory: string;
  name: string;
};

export type Commit = {
  authorEmail: string;
  authorName: string;
  body: string;
  files: string[];
  sha: string;
  subject: string;
};

export type ConventionalParts = {
  breaking: boolean;
  description: string;
  scope: string | null;
  type: string;
};

export type PackageReleaseState = PackageDefinition & {
  commits: Commit[];
  currentVersion: string;
  fromTag: string | null;
  latestTag: string | null;
};

export const INITIAL_UNPUBLISHED_VERSION = "0.0.0";

export const PUBLISHABLE_PACKAGES: PackageDefinition[] = [
  { directory: "packages/ui", name: "gitlab-ui-react" },
  { directory: "packages/styles", name: "@gitlab-ui-react/styles" },
  { directory: "packages/tokens", name: "@gitlab-ui-react/tokens" },
];

const AUTO_CHANGESET_PATTERN = /^auto-[a-zA-Z0-9._-]+\.md$/;
const RELEASE_BUMP_ORDER: Bump[] = ["major", "minor", "patch"];
const ROOT_DEPENDENCY_FILES = new Set([
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
]);
const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

function git(args: string[], cwd: string): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

export function conventionalParts(subject: string, body = ""): ConventionalParts | null {
  const match = subject.match(/^([a-zA-Z]+)(?:\(([^)]*)\))?(!)?:\s+(.+)$/);
  if(!match) return null;

  return {
    type: match[1].toLowerCase(),
    scope: match[2] || null,
    breaking:
      match[3] === "!" || /(^|\n)\s*BREAKING[ -]CHANGE\s*[:!]/i.test(body),
    description: match[4].trim(),
  };
}

/**
 * Breaking commits are intentionally capped at minor. A major release always
 * requires a human-authored Changeset so that 1.0 and later major versions are
 * an explicit maintainer decision.
 */
export function automaticBump(subject: string, body = ""): Bump | null {
  const parts = conventionalParts(subject, body);
  if(!parts) return null;
  if(parts.breaking) return "minor";

  // Keep ordinary maintenance chores release-neutral while publishing scoped
  // chores that change package output or dependency versions.
  if(parts.type === "chore" && ["deps", "tokens"].includes(parts.scope ?? "")) {
    return "patch";
  }

  switch(parts.type) {
    case "feat":
      return "minor";
    case "fix":
    case "perf":
    case "revert":
      return "patch";
    default:
      return null;
  }
}

export function maxBump(left: Bump | null, right: Bump | null): Bump | null {
  if(!left) return right;
  if(!right) return left;
  return RELEASE_BUMP_ORDER.indexOf(left) <= RELEASE_BUMP_ORDER.indexOf(right)
    ? left
    : right;
}

export function affectedPackageNames(
  files: string[],
  packages: PackageDefinition[] = PUBLISHABLE_PACKAGES,
): string[] {
  const normalizedFiles = files.map((file) => file.replace(/\\/g, "/"));
  return packages
    .filter(({ directory }) =>
      normalizedFiles.some(
        (file) => file === directory || file.startsWith(`${directory}/`),
      ),
    )
    .map(({ name }) => name);
}

type ParsedVersion = {
  core: [number, number, number];
  prerelease: string[];
};

function parseVersion(version: string): ParsedVersion {
  const withoutBuildMetadata = version.split("+", 1)[0];
  const [corePart, prereleasePart = ""] = withoutBuildMetadata.split("-", 2);
  const coreNumbers = corePart
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);

  return {
    core: [coreNumbers[0] ?? 0, coreNumbers[1] ?? 0, coreNumbers[2] ?? 0],
    prerelease: prereleasePart ? prereleasePart.split(".") : [],
  };
}

export function compareVersions(left: string, right: string): -1 | 0 | 1 {
  const parsedLeft = parseVersion(left);
  const parsedRight = parseVersion(right);

  for(let index = 0; index < 3; index += 1) {
    const leftPart = parsedLeft.core[index];
    const rightPart = parsedRight.core[index];
    if(leftPart !== rightPart) return leftPart > rightPart ? 1 : -1;
  }

  if(parsedLeft.prerelease.length === 0 || parsedRight.prerelease.length === 0) {
    if(parsedLeft.prerelease.length === parsedRight.prerelease.length) return 0;
    return parsedLeft.prerelease.length === 0 ? 1 : -1;
  }

  const length = Math.max(parsedLeft.prerelease.length, parsedRight.prerelease.length);
  for(let index = 0; index < length; index += 1) {
    const leftPart = parsedLeft.prerelease[index];
    const rightPart = parsedRight.prerelease[index];
    if(leftPart === undefined || rightPart === undefined) {
      return leftPart === undefined ? -1 : 1;
    }
    if(leftPart === rightPart) continue;

    const leftNumeric = /^\d+$/.test(leftPart);
    const rightNumeric = /^\d+$/.test(rightPart);
    if(leftNumeric && rightNumeric) {
      const leftNumber = Number.parseInt(leftPart, 10);
      const rightNumber = Number.parseInt(rightPart, 10);
      return leftNumber > rightNumber ? 1 : -1;
    }
    if(leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
    return leftPart > rightPart ? 1 : -1;
  }

  return 0;
}

export type PackageTag = {
  tag: string;
  version: string;
};

export function latestPackageTagFromTags(
  tags: string[],
  packageName: string,
  stableOnly = false,
): PackageTag | null {
  const prefix = `${packageName}@`;
  const packageTags = tags
    .filter((tag) => tag.startsWith(prefix))
    .map((tag) => ({ tag, version: tag.slice(prefix.length) }))
    .filter(({ version }) => !stableOnly || !version.includes("-"))
    .sort((left, right) => compareVersions(left.version, right.version));

  return packageTags.at(-1) ?? null;
}

export type GenerationDecision = {
  action: "error" | "generate" | "skip";
  reason: string;
};

export function decideGeneration(
  packageVersion: string,
  latestTagVersion: string | null,
): GenerationDecision {
  if(latestTagVersion === null) {
    if(packageVersion === INITIAL_UNPUBLISHED_VERSION) {
      return { action: "generate", reason: "unpublished package at the initial baseline" };
    }
    return {
      action: "skip",
      reason: `package version ${packageVersion} is awaiting its first publish`,
    };
  }

  const comparison = compareVersions(packageVersion, latestTagVersion);
  if(comparison > 0) {
    return {
      action: "skip",
      reason: `package version ${packageVersion} is ahead of tag ${latestTagVersion}`,
    };
  }
  if(comparison < 0) {
    return {
      action: "error",
      reason: `package version ${packageVersion} is behind tag ${latestTagVersion}`,
    };
  }
  return {
    action: "generate",
    reason: `package version ${packageVersion} matches tag ${latestTagVersion}`,
  };
}

export function renderChangeset(
  packageBumps: Record<string, Bump>,
  summaries: string[],
): string {
  const frontmatter = Object.entries(packageBumps)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, bump]) => `"${name}": ${bump}`)
    .join("\n");
  const body = summaries.map((summary) => `- ${summary}`).join("\n");
  return `---\n${frontmatter}\n---\n\n${body}\n`;
}

function readPackageVersion(root: string, definition: PackageDefinition): string {
  const manifest = JSON.parse(
    readFileSync(join(root, definition.directory, "package.json"), "utf8"),
  ) as { name?: string; version?: string };
  if(manifest.name !== definition.name || !manifest.version) {
    throw new Error(`Invalid package manifest at ${definition.directory}/package.json`);
  }
  return manifest.version;
}

export function assertFixedVersions(versions: Record<string, string>): string {
  const uniqueVersions = new Set(Object.values(versions));
  if(uniqueVersions.size !== 1) {
    throw new Error(
      `Fixed packages must share one version: ${JSON.stringify(versions)}`,
    );
  }
  return [...uniqueVersions][0];
}

function readCommit(root: string, sha: string): Commit {
  const metadata = git(
    ["show", "-s", "--format=%s%x00%b%x00%an%x00%ae", sha],
    root,
  ).split("\0");
  const filesOutput = git(
    ["diff-tree", "--root", "-m", "--no-commit-id", "--name-only", "-r", sha],
    root,
  );

  return {
    sha,
    subject: metadata[0] ?? "",
    body: metadata[1] ?? "",
    authorName: metadata[2] ?? "",
    authorEmail: metadata[3] ?? "",
    files: [...new Set(filesOutput.split("\n").filter(Boolean))],
  };
}

function commitsAfter(root: string, tag: string | null): Commit[] {
  const range = tag ? `${tag}..HEAD` : "HEAD";
  const output = git(["rev-list", "--reverse", range], root);
  if(!output) return [];
  return output.split("\n").filter(Boolean).map((sha) => readCommit(root, sha));
}

export function collectReleaseStates(
  root = REPOSITORY_ROOT,
  options: { stableRange?: boolean } = {},
): PackageReleaseState[] {
  const versions = Object.fromEntries(
    PUBLISHABLE_PACKAGES.map((definition) => [
      definition.name,
      readPackageVersion(root, definition),
    ]),
  );
  assertFixedVersions(versions);

  const tagOutput = git(["tag", "--list"], root);
  const tags = tagOutput ? tagOutput.split("\n").filter(Boolean) : [];
  const commitCache = new Map<string, Commit[]>();

  return PUBLISHABLE_PACKAGES.map((definition) => {
    const currentVersion = versions[definition.name];
    const latestTag = latestPackageTagFromTags(tags, definition.name);
    const decision = decideGeneration(currentVersion, latestTag?.version ?? null);
    if(decision.action === "error") {
      throw new Error(`${definition.name}: ${decision.reason}`);
    }

    const rangeTag = options.stableRange
      ? latestPackageTagFromTags(tags, definition.name, true)
      : latestTag;
    const cacheKey = rangeTag?.tag ?? "<all-history>";
    let commits: Commit[] = [];
    if(decision.action === "generate") {
      commits = commitCache.get(cacheKey) ?? commitsAfter(root, rangeTag?.tag ?? null);
      commitCache.set(cacheKey, commits);
    }

    console.log(`[release] ${definition.name}: ${decision.action} (${decision.reason})`);
    return {
      ...definition,
      currentVersion,
      latestTag: latestTag?.tag ?? null,
      fromTag: rangeTag?.tag ?? null,
      commits,
    };
  });
}

export function releaseCommitsForPackage(state: PackageReleaseState): Commit[] {
  return state.commits.filter(
    (commit) => {
      if(automaticBump(commit.subject, commit.body) === null) return false;

      const directlyAffected = affectedPackageNames(commit.files).includes(state.name);
      const parts = conventionalParts(commit.subject, commit.body);
      const rootDependencyUpdate =
        parts?.type === "chore" &&
        parts.scope === "deps" &&
        commit.files.some((file) => ROOT_DEPENDENCY_FILES.has(file.replace(/\\/g, "/")));

      return directlyAffected || rootDependencyUpdate;
    },
  );
}

function removeStaleAutoChangesets(changesetDirectory: string): void {
  if(!existsSync(changesetDirectory)) return;
  for(const entry of readdirSync(changesetDirectory, { withFileTypes: true })) {
    if(entry.isFile() && AUTO_CHANGESET_PATTERN.test(entry.name)) {
      unlinkSync(join(changesetDirectory, entry.name));
    }
  }
}

export function run(root = REPOSITORY_ROOT): {
  bumps: Record<string, Bump>;
  written: string | null;
} {
  const changesetDirectory = join(root, ".changeset");
  removeStaleAutoChangesets(changesetDirectory);

  const packageBumps: Record<string, Bump> = {};
  const summaries: string[] = [];
  const seenCommits = new Set<string>();

  for(const state of collectReleaseStates(root)) {
    for(const commit of releaseCommitsForPackage(state)) {
      packageBumps[state.name] = maxBump(
        packageBumps[state.name] ?? null,
        automaticBump(commit.subject, commit.body),
      )!;
      if(!seenCommits.has(commit.sha)) {
        seenCommits.add(commit.sha);
        summaries.push(commit.subject);
      }
    }
  }

  if(Object.keys(packageBumps).length === 0) {
    console.log("[release] No automatic changeset is required.");
    return { bumps: {}, written: null };
  }

  const head = git(["rev-parse", "--short=12", "HEAD"], root);
  const filePath = join(changesetDirectory, `auto-${head}.md`);
  const contents = renderChangeset(packageBumps, summaries);
  writeFileSync(filePath, contents, "utf8");
  console.log(`[release] Wrote ${relative(root, filePath)}:\n${contents}`);
  return { bumps: packageBumps, written: filePath };
}

function isDirectRun(): boolean {
  const entry = process.argv[1];
  return Boolean(entry) && basename(entry) === basename(fileURLToPath(import.meta.url));
}

if(isDirectRun()) run();
