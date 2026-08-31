#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const PROJECT = "gitlab-org/gitlab-services/design.gitlab.com";
const ENCODED_PROJECT = encodeURIComponent(PROJECT);
const UPSTREAM_SOURCE_ROOT = "packages/gitlab-ui/src";
const LOCAL_SNAPSHOT_ROOT = "node_modules/@gitlab/ui/src";
const SOURCE_FILE = /\.(?:vue|scss|css|js|ts|jsx|tsx)$/i;

const HELP = `Compare a component's current GitLab upstream files with the local @gitlab/ui snapshot.

Usage:
  node upstream-baseline.mjs <component-name> [options]

The component name may use this repository's kebab-case or upstream's snake_case.
The script normalizes both forms automatically.

Options:
  --root <path>          Repository root (default: current directory)
  --ref <name>           Upstream Git ref (default: main)
  --upstream-dir <path> Upstream component directory
  --docs <path>          Documentation path (default: contents/components/<name>.md)
  --skip-docs            Do not retrieve component documentation
  --help                 Show this help

Set GLAB_PATH to override glab executable discovery.
`;

function fail(message, detail) {
  console.error(`Error: ${message}`);
  if(detail) console.error(detail.trim());
  process.exit(1);
}

function parseArgs(argv) {
  const result = { root: process.cwd(), ref: "main", skipDocs: false };

  for(let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if(argument === "--help" || argument === "-h") {
      result.help = true;
    } else if(argument === "--skip-docs") {
      result.skipDocs = true;
    } else if(["--root", "--ref", "--upstream-dir", "--docs"].includes(argument)) {
      const value = argv[index + 1];
      if(!value || value.startsWith("--")) fail(`${argument} requires a value`);
      result[argument.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
      index += 1;
    } else if(argument.startsWith("--")) {
      fail(`unknown option ${argument}`);
    } else if(!result.name) {
      result.name = argument;
    } else {
      fail(`unexpected argument ${argument}`);
    }
  }

  return result;
}

function assertRelativeApiPath(value, optionName) {
  if(
    path.posix.isAbsolute(value) ||
    value.startsWith("../") ||
    value.includes("/../") ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    fail(`${optionName} must be a single-line relative path without parent traversal`);
  }
}

function resolveGlab() {
  const candidates = [
    process.env.GLAB_PATH,
    process.platform === "win32" && process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, "Programs", "glab", "glab.exe")
      : undefined,
    process.platform === "win32" ? "glab.exe" : "glab",
    "glab",
  ].filter(Boolean);

  for(const candidate of [...new Set(candidates)]) {
    if(path.isAbsolute(candidate) && !existsSync(candidate)) continue;
    const probe = spawnSync(candidate, ["version"], { encoding: "utf8", windowsHide: true });
    if(!probe.error && probe.status === 0) return candidate;
  }

  fail("glab was not found; install/configure it or set GLAB_PATH");
}

function run(executable, args, options = {}) {
  const result = spawnSync(executable, args, {
    cwd: options.cwd,
    encoding: options.encoding ?? "utf8",
    windowsHide: true,
    maxBuffer: 20 * 1024 * 1024,
  });

  if(result.error) {
    if(options.allowFailure) return result;
    fail(`could not run ${executable}`, result.error.message);
  }
  if(result.status !== 0 && !options.allowFailure) {
    fail(`${executable} exited with status ${result.status}`, result.stderr || result.stdout);
  }
  return result;
}

function api(glab, endpoint, options = {}) {
  return run(glab, ["api", "--hostname", "gitlab.com", endpoint], options);
}

function fileEndpoint(filePath, ref) {
  return `projects/${ENCODED_PROJECT}/repository/files/${encodeURIComponent(filePath)}/raw?ref=${encodeURIComponent(ref)}`;
}

const options = parseArgs(process.argv.slice(2));
if(options.help) {
  process.stdout.write(HELP);
  process.exit(0);
}

if(!options.name) fail("a component name is required; use --help for usage");
const isKebabCase = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(options.name);
const isSnakeCase = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(options.name);
if(!isKebabCase && !isSnakeCase) {
  fail("component name must be lowercase kebab-case or snake_case");
}

const localName = options.name.replaceAll("_", "-");
const upstreamName = options.name.replaceAll("-", "_");

const root = path.resolve(options.root);
if(!existsSync(path.join(root, "packages/ui/src/index.ts"))) {
  fail(`${root} is not a gitlab-ui-react repository root`);
}

const upstreamDir =
  options.upstreamDir ??
  `${UPSTREAM_SOURCE_ROOT}/components/base/${upstreamName.startsWith("form_") ? `form/${upstreamName}` : upstreamName}`;
const docsPath = options.docs ?? `contents/components/${localName}.md`;
assertRelativeApiPath(upstreamDir, "--upstream-dir");
if(!options.skipDocs) assertRelativeApiPath(docsPath, "--docs");

const glab = resolveGlab();
const treeEndpoint = `projects/${ENCODED_PROJECT}/repository/tree?path=${encodeURIComponent(upstreamDir)}&ref=${encodeURIComponent(options.ref)}&recursive=true&per_page=100`;
const treeResult = api(glab, treeEndpoint);

let tree;
try {
  tree = JSON.parse(treeResult.stdout);
} catch {
  fail("GitLab returned invalid JSON for the upstream tree");
}

if(!Array.isArray(tree) || tree.length === 0) {
  fail(`no upstream files found at ${upstreamDir} (${options.ref})`);
}
if(tree.length === 100) {
  fail("upstream tree reached the 100-file safety limit; narrow --upstream-dir");
}

const upstreamFiles = tree
  .filter((entry) => entry.type === "blob" && SOURCE_FILE.test(entry.path))
  .filter((entry) => !/\.figma\.[^.]+$/i.test(entry.path))
  .sort((left, right) => left.path.localeCompare(right.path, "en"));
if(upstreamFiles.length === 0) fail(`no source files found at ${upstreamDir}`);

const artifactDir = mkdtempSync(path.join(tmpdir(), `gitlab-ui-port-${localName}-`));
const report = {
  component: localName,
  upstreamComponent: upstreamName,
  project: PROJECT,
  ref: options.ref,
  upstreamDir,
  artifactDir,
  exactLocal: [],
  fetched: [],
  documentation: { status: options.skipDocs ? "skipped" : "missing" },
};

for(const entry of upstreamFiles) {
  const sourceRelative = path.posix.relative(UPSTREAM_SOURCE_ROOT, entry.path);
  const localPath = path.join(root, LOCAL_SNAPSHOT_ROOT, ...sourceRelative.split("/"));
  let localHash;

  if(existsSync(localPath)) {
    const hashResult = run("git", ["hash-object", localPath], { cwd: root });
    localHash = hashResult.stdout.trim();
  }

  if(localHash === entry.id) {
    report.exactLocal.push({
      upstream: entry.path,
      local: path.relative(root, localPath).replaceAll("\\", "/"),
      blob: entry.id,
    });
    continue;
  }

  const raw = api(glab, fileEndpoint(entry.path, options.ref));
  const componentRelative = path.posix.relative(upstreamDir, entry.path);
  const outputPath = path.join(artifactDir, "upstream", ...componentRelative.split("/"));
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, raw.stdout, "utf8");
  report.fetched.push({
    upstream: entry.path,
    output: outputPath,
    reason: existsSync(localPath) ? "local snapshot differs" : "not in local snapshot",
    blob: entry.id,
  });
}

if(!options.skipDocs) {
  const docs = api(glab, fileEndpoint(docsPath, options.ref), { allowFailure: true });
  if(docs.status === 0) {
    const outputPath = path.join(artifactDir, "documentation.md");
    writeFileSync(outputPath, docs.stdout, "utf8");
    report.documentation = { status: "fetched", upstream: docsPath, output: outputPath };
  } else {
    report.documentation = { status: "missing", upstream: docsPath };
  }
}

const reportPath = path.join(artifactDir, "baseline.json");
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`Upstream baseline: ${localName} -> ${upstreamName} @ ${options.ref}`);
console.log(`  artifacts: ${artifactDir}`);
console.log(`  exact local (${report.exactLocal.length}):`);
for(const item of report.exactLocal) console.log(`    ${item.local}`);
console.log(`  fetched (${report.fetched.length}):`);
for(const item of report.fetched) console.log(`    ${item.output} (${item.reason})`);
console.log(
  `  docs: ${report.documentation.status}${report.documentation.output ? ` -> ${report.documentation.output}` : ""}`,
);
console.log(`  report: ${reportPath}`);
