#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, renameSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  INITIAL_UNPUBLISHED_VERSION,
  PUBLISHABLE_PACKAGES,
  assertFixedVersions,
} from "./create-changeset.mts";

type PackResult = {
  name?: string;
  version?: string;
  files?: Array<{ path?: string }>;
};

type PackageManifest = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  name?: string;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  version?: string;
};

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, "..");

function pnpmCommand(): string {
  return process.platform === "win32" ? "pnpm.cmd" : "pnpm";
}

function npmCommand(): string {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function commandInvocation(command: string, args: string[]): {
  args: string[];
  command: string;
} {
  if(process.platform !== "win32") return { command, args };
  return {
    command: process.env.ComSpec ?? "cmd.exe",
    args: ["/d", "/s", "/c", command, ...args],
  };
}

export function supportsTrustedPublishing(version: string): boolean {
  const [major = 0, minor = 0, patch = 0] = version
    .trim()
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
  if(major !== 11) return major > 11;
  if(minor !== 5) return minor > 5;
  return patch >= 1;
}

export function publishArguments(prerelease: boolean): string[] {
  const args = ["exec", "changeset", "publish"];
  if(prerelease) args.push("--tag", "latest");
  return args;
}

export function assertPublishableVersion(version: string): void {
  if(version === INITIAL_UNPUBLISHED_VERSION) {
    throw new Error("Refusing to publish the internal 0.0.0 release baseline.");
  }
}

export function withHiddenPrereleaseState<T>(root: string, operation: () => T): T {
  const preStatePath = join(root, ".changeset", "pre.json");
  if(!existsSync(preStatePath)) return operation();

  const backupPath = `${preStatePath}.publish-backup`;
  if(existsSync(backupPath)) {
    throw new Error(`Refusing to overwrite prerelease backup ${backupPath}.`);
  }

  renameSync(preStatePath, backupPath);
  try {
    return operation();
  } finally {
    renameSync(backupPath, preStatePath);
  }
}

export function validatePackFileList(packageName: string, files: string[]): void {
  const allowedRootFiles = new Set([
    "CHANGELOG.md",
    "LICENSE",
    "LICENSE.md",
    "README",
    "README.md",
    "package.json",
  ]);
  const unexpected = files.filter(
    (file) => !allowedRootFiles.has(file) && !file.startsWith("dist/"),
  );
  if(unexpected.length > 0) {
    throw new Error(`${packageName} contains unexpected files: ${unexpected.join(", ")}`);
  }

  const testArtifacts = files.filter((file) =>
    /(?:^|\/)(?:__tests__|tests?)(?:\/|$)|\.(?:spec|stories|test)\./i.test(file),
  );
  if(testArtifacts.length > 0) {
    throw new Error(
      `${packageName} contains test or story artifacts: ${testArtifacts.join(", ")}`,
    );
  }

  if(packageName === "@gitlab-ui-react/tokens") {
    if(!files.includes("dist/css/tokens.css")) {
      throw new Error("The tokens package is missing dist/css/tokens.css.");
    }
    return;
  }

  if(packageName === "@gitlab-ui-react/styles") {
    if(!files.includes("dist/gitlab-ui.css")) {
      throw new Error("The styles package is missing dist/gitlab-ui.css.");
    }
    return;
  }

  if(!files.some((file) => file.endsWith("/index.js"))) {
    throw new Error("The UI package does not contain ESM entry points.");
  }
  if(!files.some((file) => file.endsWith("/index.cjs"))) {
    throw new Error("The UI package does not contain CommonJS entry points.");
  }
  if(!files.some((file) => file.endsWith("/index.d.ts"))) {
    throw new Error("The UI package does not contain TypeScript declarations.");
  }
}

export function validateInternalDependencies(
  manifest: PackageManifest,
  fixedVersion: string,
): void {
  const internalNames = new Set(PUBLISHABLE_PACKAGES.map(({ name }) => name));
  const runtimeSections = [
    manifest.dependencies,
    manifest.optionalDependencies,
    manifest.peerDependencies,
  ];

  for(const dependencies of runtimeSections) {
    for(const [dependencyName, range] of Object.entries(dependencies ?? {})) {
      if(!internalNames.has(dependencyName)) continue;
      if(range !== "workspace:^") {
        throw new Error(
          `${manifest.name} must declare ${dependencyName} as workspace:^, received ${range}.`,
        );
      }
      console.log(
        `[release] ${manifest.name}: ${dependencyName} will pack as ^${fixedVersion}.`,
      );
    }
  }
}

function readFixedVersions(root: string): Record<string, string> {
  return Object.fromEntries(
    PUBLISHABLE_PACKAGES.map(({ directory, name }) => {
      const manifest = JSON.parse(
        readFileSync(join(root, directory, "package.json"), "utf8"),
      ) as { version: string };
      return [name, manifest.version];
    }),
  );
}

function verifyPackageContents(root: string, fixedVersion: string): void {
  for(const { directory, name } of PUBLISHABLE_PACKAGES) {
    const manifest = JSON.parse(
      readFileSync(join(root, directory, "package.json"), "utf8"),
    ) as PackageManifest;
    validateInternalDependencies(manifest, fixedVersion);

    const pack = commandInvocation(pnpmCommand(), ["pack", "--dry-run", "--json"]);
    const output = execFileSync(pack.command, pack.args, {
      cwd: join(root, directory),
      encoding: "utf8",
    });
    const result = JSON.parse(output) as PackResult;
    if(result.name !== name || result.version !== fixedVersion) {
      throw new Error(
        `${name} packed with unexpected identity ${result.name}@${result.version}.`,
      );
    }
    const files = (result.files ?? [])
      .map(({ path }) => path)
      .filter((path): path is string => Boolean(path));
    validatePackFileList(name, files);
    console.log(
      `[release] Verified pnpm pack for ${name}@${fixedVersion} (${files.length} files).`,
    );
  }
}

export function preparePackages(root = REPOSITORY_ROOT): void {
  const versions = readFixedVersions(root);
  const fixedVersion = assertFixedVersions(versions);

  const buildStyles = commandInvocation(pnpmCommand(), [
    "--filter",
    "@gitlab-ui-react/styles",
    "build",
  ]);
  execFileSync(buildStyles.command, buildStyles.args, {
    cwd: root,
    stdio: "inherit",
  });
  execFileSync(
    "git",
    ["diff", "--exit-code", "--", "packages/styles/dist"],
    { cwd: root, stdio: "inherit" },
  );
  const buildUi = commandInvocation(pnpmCommand(), [
    "--filter",
    "gitlab-ui-react",
    "build",
  ]);
  execFileSync(buildUi.command, buildUi.args, {
    cwd: root,
    stdio: "inherit",
  });
  verifyPackageContents(root, fixedVersion);
}

function isPrereleaseMode(root: string): boolean {
  const preStatePath = join(root, ".changeset", "pre.json");
  if(!existsSync(preStatePath)) return false;
  const preState = JSON.parse(readFileSync(preStatePath, "utf8")) as { mode?: string };
  return preState.mode === "pre";
}

export function run(root = REPOSITORY_ROOT, prepareOnly = false): void {
  const npmVersionCommand = commandInvocation(npmCommand(), ["--version"]);
  const npmVersion = execFileSync(npmVersionCommand.command, npmVersionCommand.args, {
    cwd: root,
    encoding: "utf8",
  }).trim();
  if(!supportsTrustedPublishing(npmVersion)) {
    throw new Error(`npm ${npmVersion} is too old; trusted publishing requires npm >= 11.5.1.`);
  }

  preparePackages(root);
  if(prepareOnly) return;

  const version = assertFixedVersions(readFixedVersions(root));
  assertPublishableVersion(version);

  const prerelease = isPrereleaseMode(root);
  withHiddenPrereleaseState(root, () => {
    const publish = commandInvocation(pnpmCommand(), publishArguments(prerelease));
    execFileSync(publish.command, publish.args, {
      cwd: root,
      stdio: "inherit",
    });
  });
}

function isDirectRun(): boolean {
  const entry = process.argv[1];
  return Boolean(entry) && basename(entry) === basename(fileURLToPath(import.meta.url));
}

if(isDirectRun()) run(REPOSITORY_ROOT, process.argv.includes("--prepare-only"));
