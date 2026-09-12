#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PUBLISHABLE_PACKAGES,
  collectReleaseStates,
  conventionalParts,
  releaseCommitsForPackage,
  type Commit,
} from "./create-changeset.mts";

type PreState = {
  changesets?: string[];
  mode?: "exit" | "pre";
  tag?: string;
};

export type ManualChangeset = {
  packages: string[];
  summary: string;
};

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

const CHANGELOG_GROUPS: ReadonlyArray<{
  heading: string;
  scope?: string;
  type: string;
}> = [
  { heading: "Features", type: "feat" },
  { heading: "Bug Fixes", type: "fix" },
  { heading: "Performance", type: "perf" },
  { heading: "Reverts", type: "revert" },
  { heading: "Upstream Syncs", type: "chore", scope: "tokens" },
  { heading: "Dependency Updates", type: "chore", scope: "deps" },
];

function pnpmCommand(): string {
  return process.platform === "win32" ? "pnpm.cmd" : "pnpm";
}

function pnpmInvocation(args: string[]): { args: string[]; command: string } {
  const command = pnpmCommand();
  if(process.platform !== "win32") return { command, args };
  return {
    command: process.env.ComSpec ?? "cmd.exe",
    args: ["/d", "/s", "/c", command, ...args],
  };
}

function readPreState(root: string): PreState | null {
  const preStatePath = join(root, ".changeset", "pre.json");
  if(!existsSync(preStatePath)) return null;
  return JSON.parse(readFileSync(preStatePath, "utf8")) as PreState;
}

export function parseManualChangeset(markdown: string): ManualChangeset | null {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if(!match) return null;

  const packages = match[1]
    .split("\n")
    .map((line) => line.match(/^\s*["']?([^"']+?)["']?\s*:\s*(?:major|minor|patch)\s*$/)?.[1])
    .filter((name): name is string => Boolean(name));
  const summary = match[2].trim();
  if(packages.length === 0 || !summary) return null;
  return { packages, summary };
}

function changesetFiles(directory: string): string[] {
  if(!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => join(directory, entry.name));
}

function loadManualNotes(root: string, preState: PreState | null): Map<string, string[]> {
  const changesetDirectory = join(root, ".changeset");
  const consumed = new Set(preState?.changesets ?? []);
  const rootFiles = changesetFiles(changesetDirectory).filter((file) => {
    const filename = basename(file);
    if(filename === "README.md" || filename.startsWith("auto-")) return false;
    if(preState?.mode === "pre" && consumed.has(filename.slice(0, -3))) return false;
    return true;
  });
  const archivedFiles = preState?.mode === "exit"
    ? changesetFiles(join(changesetDirectory, "pre"))
    : [];
  const notes = new Map<string, string[]>();

  for(const file of [...rootFiles, ...archivedFiles]) {
    const parsed = parseManualChangeset(readFileSync(file, "utf8"));
    if(!parsed) continue;
    for(const packageName of parsed.packages) {
      const packageNotes = notes.get(packageName) ?? [];
      if(!packageNotes.includes(parsed.summary)) packageNotes.push(parsed.summary);
      notes.set(packageName, packageNotes);
    }
  }
  return notes;
}

function itemLine(commit: Commit): string {
  const parts = conventionalParts(commit.subject, commit.body);
  if(!parts) return `- ${commit.subject}`;
  return parts.scope
    ? `- **${parts.scope}:** ${parts.description}`
    : `- ${parts.description}`;
}

export function contributorNames(commits: Commit[]): string[] {
  const contributors = new Map<string, string>();
  for(const commit of commits) {
    const noreplyMatch = commit.authorEmail.match(
      /^(?:\d+\+)?([^@]+)@users\.noreply\.github\.com$/i,
    );
    const name = noreplyMatch ? `@${noreplyMatch[1]}` : commit.authorName.trim();
    if(!name || /\[bot\]$|github-actions/i.test(name)) continue;
    const key = name.toLowerCase();
    if(!contributors.has(key)) contributors.set(key, name);
  }
  return [...contributors.values()].sort((left, right) =>
    left.toLowerCase().localeCompare(right.toLowerCase()),
  );
}

export function groupedChangelogBody(
  commits: Commit[],
  manualNotes: string[] = [],
): string {
  const sections: string[] = [];

  if(manualNotes.length > 0) {
    sections.push(`### Release Notes\n\n${manualNotes.join("\n\n")}`);
  }

  const breaking = commits.filter(
    (commit) => conventionalParts(commit.subject, commit.body)?.breaking,
  );
  if(breaking.length > 0) {
    sections.push(`### Breaking Changes\n\n${breaking.map(itemLine).join("\n")}`);
  }

  for(const group of CHANGELOG_GROUPS) {
    const matching = commits.filter((commit) => {
      const parts = conventionalParts(commit.subject, commit.body);
      return (
        parts?.type === group.type &&
        (!group.scope || parts.scope === group.scope) &&
        !parts.breaking
      );
    });
    if(matching.length > 0) {
      sections.push(`### ${group.heading}\n\n${matching.map(itemLine).join("\n")}`);
    }
  }

  if(sections.length === 0) {
    sections.push(
      "### Version Synchronization\n\n- Version synchronized with the GitLab UI React package set.",
    );
  }

  const contributors = contributorNames(commits);
  if(contributors.length > 0) {
    sections.push(
      `### Contributors\n\n${contributors.map((name) => `- ${name}`).join("\n")}`,
    );
  }

  return sections.join("\n\n");
}

export function rewriteReleaseSection(
  changelog: string,
  version: string,
  body: string,
): string {
  const lines = changelog.split("\n");
  const heading = `## ${version}`;
  const start = lines.findIndex((line) => line.trim() === heading);
  if(start === -1) return changelog;

  let end = lines.length;
  for(let index = start + 1; index < lines.length; index += 1) {
    if(/^##\s+\S/.test(lines[index])) {
      end = index;
      break;
    }
  }

  const rebuilt = [
    ...lines.slice(0, start),
    heading,
    "",
    body,
    "",
    ...lines.slice(end),
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+$/, "");
  return `${rebuilt}\n`;
}

function readVersions(root: string): Record<string, string> {
  return Object.fromEntries(
    PUBLISHABLE_PACKAGES.map(({ directory, name }) => {
      const manifest = JSON.parse(
        readFileSync(join(root, directory, "package.json"), "utf8"),
      ) as { version: string };
      return [name, manifest.version];
    }),
  );
}

export function resetVersionForPrereleaseTag(
  version: string,
  targetTag: string,
): string {
  const match = version.match(/^(\d+\.\d+\.\d+)-([0-9A-Za-z-]+)\.(\d+)$/);
  if(!match || match[2] === targetTag) return version;
  return `${match[1]}-${match[2]}`;
}

function resetPrereleaseCounters(root: string, preState: PreState | null): void {
  if(preState?.mode !== "pre" || !preState.tag) return;

  for(const { directory, name } of PUBLISHABLE_PACKAGES) {
    const manifestPath = join(root, directory, "package.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      name: string;
      version: string;
    };
    const resetVersion = resetVersionForPrereleaseTag(manifest.version, preState.tag);
    if(resetVersion === manifest.version) continue;

    manifest.version = resetVersion;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(
      `[release] Reset ${name}'s prerelease counter before entering ${preState.tag}.`,
    );
  }
}

export function run(root = REPOSITORY_ROOT): void {
  const preState = readPreState(root);
  const releaseStates = collectReleaseStates(root, {
    stableRange: preState?.mode === "exit",
  });
  const manualNotes = loadManualNotes(root, preState);
  const before = readVersions(root);

  resetPrereleaseCounters(root, preState);
  console.log("[release] Running `changeset version`.");
  const version = pnpmInvocation(["exec", "changeset", "version"]);
  execFileSync(version.command, version.args, {
    cwd: root,
    stdio: "inherit",
  });

  const after = readVersions(root);
  for(const state of releaseStates) {
    const nextVersion = after[state.name];
    if(!nextVersion || nextVersion === before[state.name]) continue;

    const changelogPath = join(root, state.directory, "CHANGELOG.md");
    if(!existsSync(changelogPath)) {
      throw new Error(`${state.name} was versioned without creating a changelog.`);
    }

    const commits = releaseCommitsForPackage(state);
    const body = groupedChangelogBody(commits, manualNotes.get(state.name));
    const original = readFileSync(changelogPath, "utf8");
    const updated = rewriteReleaseSection(original, nextVersion, body);
    if(updated === original) {
      throw new Error(`Could not find ${nextVersion} in ${state.directory}/CHANGELOG.md.`);
    }
    writeFileSync(changelogPath, updated, "utf8");
    console.log(`[release] Rewrote ${state.directory}/CHANGELOG.md for ${nextVersion}.`);
  }
}

function isDirectRun(): boolean {
  const entry = process.argv[1];
  return Boolean(entry) && basename(entry) === basename(fileURLToPath(import.meta.url));
}

if(isDirectRun()) run();
