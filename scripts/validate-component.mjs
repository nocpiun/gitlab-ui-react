#!/usr/bin/env node

import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";

const HELP = `Run focused validation for a ported component, with optional repository-standard checks.

Usage:
  node validate-component.mjs <kebab-name> [options]

Options:
  --root <path>       Repository root (default: current directory)
  --full              Also run standard lint, unit, styles, and Storybook tests
  --standard-only     Run only repository-standard checks after a focused pass
  --skip-styles       Skip the styles build and styles tests
  --skip-storybook    Skip the Storybook static build and tests
  --help              Show this help

Set PNPM_PATH to override pnpm executable discovery.
`;

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const result = {
    root: process.cwd(),
    full: false,
    standardOnly: false,
    skipStyles: false,
    skipStorybook: false,
  };

  for(let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if(argument === "--help" || argument === "-h") {
      result.help = true;
    } else if(argument === "--full") {
      result.full = true;
    } else if(argument === "--standard-only") {
      result.standardOnly = true;
    } else if(argument === "--skip-styles") {
      result.skipStyles = true;
    } else if(argument === "--skip-storybook") {
      result.skipStorybook = true;
    } else if(argument === "--root") {
      const value = argv[index + 1];
      if(!value || value.startsWith("--")) fail("--root requires a value");
      result.root = value;
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

function displayCommand(executable, args) {
  return [executable, ...args]
    .map((part) => (/\s/.test(part) ? JSON.stringify(part) : part))
    .join(" ");
}

function resolvePnpm() {
  const override = process.env.PNPM_PATH;
  if(override && /\.[cm]?js$/i.test(override)) {
    return { executable: process.execPath, prefix: [path.resolve(override)] };
  }
  if(override && process.platform !== "win32") {
    return { executable: override, prefix: [] };
  }
  if(override && !/\.cmd$/i.test(override)) {
    return { executable: override, prefix: [] };
  }

  if(process.platform !== "win32") return { executable: "pnpm", prefix: [] };

  let shimPath = override ? path.resolve(override) : undefined;
  if(!shimPath) {
    const located = spawnSync("where.exe", ["pnpm.cmd"], {
      encoding: "utf8",
      windowsHide: true,
    });
    shimPath = located.status === 0 ? located.stdout.split(/\r?\n/).find(Boolean)?.trim() : undefined;
  }

  if(!shimPath) fail("pnpm.cmd was not found; set PNPM_PATH");
  const shimDir = path.dirname(shimPath);
  const javascriptEntrypoints = [
    path.join(shimDir, "node_modules/corepack/dist/pnpm.js"),
    path.join(shimDir, "node_modules/pnpm/bin/pnpm.cjs"),
  ];
  const javascriptEntrypoint = javascriptEntrypoints.find(existsSync);
  if(!javascriptEntrypoint) {
    fail(`could not resolve the JavaScript entrypoint behind ${shimPath}; set PNPM_PATH`);
  }

  return { executable: process.execPath, prefix: [javascriptEntrypoint] };
}

function outputTail(value, limit = 12_000) {
  const normalized = (value || "").trim();
  if(normalized.length <= limit) return normalized;
  return `[output truncated to final ${limit} characters]\n${normalized.slice(-limit)}`;
}

function runStep(label, executable, args, context) {
  const started = performance.now();
  const result = spawnSync(executable, args, {
    cwd: context.root,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 40 * 1024 * 1024,
  });
  const seconds = ((performance.now() - started) / 1000).toFixed(1);

  if(!result.error && result.status === 0) {
    console.log(`✓ ${label} (${seconds}s)`);
    return true;
  }

  console.error(`✗ ${label} (${seconds}s)`);
  console.error(`  ${displayCommand(executable, args)}`);
  const detail = outputTail(
    [result.stdout, result.stderr, result.error?.message].filter(Boolean).join("\n"),
  );
  if(detail) console.error(detail);
  context.failures.push(label);
  return false;
}

function assertNoScaffoldMarkers(componentDir) {
  const marked = readdirSync(componentDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(componentDir, entry.name))
    .filter((filePath) => readFileSync(filePath, "utf8").includes("PORT_SCAFFOLD_TODO"));

  if(marked.length) {
    fail(
      `replace scaffold placeholders before validation:\n${marked
        .map((filePath) => `  ${filePath}`)
        .join("\n")}`,
    );
  }
}

function assertRegistration(filePath, expected, label) {
  if(!readFileSync(filePath, "utf8").includes(expected)) {
    fail(`${label} is missing from ${filePath}`);
  }
}

function removeOwnedTempDir(tempDir) {
  const resolvedTempRoot = path.resolve(tmpdir());
  const resolvedTarget = path.resolve(tempDir);
  const relative = path.relative(resolvedTempRoot, resolvedTarget);
  if(!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`refusing to remove unexpected temporary path: ${resolvedTarget}`);
  }
  rmSync(resolvedTarget, { recursive: true, force: true });
}

const options = parseArgs(process.argv.slice(2));
if(options.help) {
  process.stdout.write(HELP);
  process.exit(0);
}

if(!options.name) fail("a component name is required; use --help for usage");
if(options.full && options.standardOnly) fail("use either --full or --standard-only, not both");
if(!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(options.name)) {
  fail("component name must be lowercase kebab-case");
}

const root = path.resolve(options.root);
const componentDir = path.join(root, "packages/ui/src/base", options.name);
const testPath = path.join(componentDir, `${options.name}.test.tsx`);
const cssPath = path.join(componentDir, `${options.name}.css`);
const storyPath = path.join(componentDir, `${options.name}.stories.tsx`);
const indexPath = path.join(root, "packages/ui/src/index.ts");
const stylesEntryPath = path.join(root, "packages/styles/src/components.css");

if(!existsSync(componentDir) || !statSync(componentDir).isDirectory()) {
  fail(`component directory does not exist: ${componentDir}`);
}
if(!existsSync(testPath)) fail(`focused test does not exist: ${testPath}`);
if(!existsSync(indexPath) || !existsSync(stylesEntryPath)) {
  fail(`${root} is not a gitlab-ui-react repository root`);
}

assertNoScaffoldMarkers(componentDir);
assertRegistration(indexPath, `./base/${options.name}/${options.name}`, "component export");

const hasStyles = existsSync(cssPath) && !options.skipStyles;
if(hasStyles) {
  assertRegistration(
    stylesEntryPath,
    `../../ui/src/base/${options.name}/${options.name}.css`,
    "component CSS import",
  );
}

const hasStory =
  existsSync(storyPath) && statSync(storyPath).size > 0 && !options.skipStorybook;
const pnpm = resolvePnpm();
const pnpmStep = (label, args) => [label, pnpm.executable, [...pnpm.prefix, ...args]];
const tempDir = mkdtempSync(path.join(tmpdir(), `gitlab-ui-validate-${options.name}-`));
const focusedConfig = path.join(tempDir, "vitest.focused.mjs");
const includes = [
  path.relative(root, testPath).replaceAll("\\", "/"),
  ...(hasStyles ? ["packages/styles/scripts/legacy-prefix.test.mjs"] : []),
];

writeFileSync(
  focusedConfig,
  `export default ${JSON.stringify(
    {
      root,
      test: {
        environment: "node",
        include: includes,
      },
    },
    null,
    2,
  )};\n`,
  "utf8",
);

const context = { root, failures: [] };
const targetRelative = path.relative(root, componentDir).replaceAll("\\", "/");
const quickSteps = [
  pnpmStep("target lint", ["exec", "oxlint", targetRelative, "packages/ui/src/index.ts"]),
  pnpmStep("focused tests", ["exec", "vitest", "run", "--config", focusedConfig]),
  pnpmStep("UI package build", ["--filter", "gitlab-ui-react", "build"]),
  ...(hasStyles
    ? [pnpmStep("styles package build", ["--filter", "@gitlab-ui-react/styles", "build"])]
    : []),
  ...(hasStory ? [pnpmStep("Storybook static build", ["storybook:build"])] : []),
  ["diff whitespace check", "git", ["diff", "--check"]],
  [
    "tokens output unchanged",
    "git",
    ["status", "--short", "--untracked-files=all", "--", "packages/tokens/dist"],
    { requireEmptyOutput: true },
  ],
];

try {
  if(!options.standardOnly) {
    for(const [label, executable, args, stepOptions] of quickSteps) {
      if(stepOptions?.requireEmptyOutput) {
        const started = performance.now();
        const result = spawnSync(executable, args, {
          cwd: root,
          encoding: "utf8",
          windowsHide: true,
        });
        const seconds = ((performance.now() - started) / 1000).toFixed(1);
        if(!result.error && result.status === 0 && !result.stdout.trim()) {
          console.log(`✓ ${label} (${seconds}s)`);
          continue;
        }
        console.error(`✗ ${label} (${seconds}s)`);
        console.error(outputTail(result.stdout || result.stderr || result.error?.message));
        context.failures.push(label);
        break;
      }

      if(!runStep(label, executable, args, context)) break;
    }
  }

  if(context.failures.length === 0 && (options.full || options.standardOnly)) {
    console.log("Repository-standard checks:");
    const standardSteps = [
      pnpmStep("standard lint", ["lint"]),
      pnpmStep("standard unit tests", ["test:unit"]),
      ...(hasStyles
        ? [pnpmStep("standard styles tests", ["--filter", "@gitlab-ui-react/styles", "test"])]
        : []),
      ...(hasStory ? [pnpmStep("standard Storybook tests", ["test:storybook"])] : []),
    ];

    for(const [label, executable, args] of standardSteps) {
      runStep(label, executable, args, context);
    }
  }
} finally {
  removeOwnedTempDir(tempDir);
}

if(context.failures.length) {
  console.error(`Validation failed: ${context.failures.join(", ")}`);
  process.exit(1);
}

const validationScope = options.full
  ? "focused + standard"
  : options.standardOnly
    ? "standard"
    : "focused";
console.log(`Validation passed: ${options.name} (${validationScope})`);
