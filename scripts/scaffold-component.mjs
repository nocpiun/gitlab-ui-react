#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const HELP = `Scaffold the mechanical files and registrations for a component.

Usage:
  node scaffold-component.mjs <kebab-name> [options]

Options:
  --root <path>          Repository root (default: current directory)
  --symbol <name>       React export name (default: Gl + PascalCase name)
  --types <a,b,...>     Public type exports (default: <symbol>Props)
  --types none          Do not create or register public types
  --upstream-dir <path> Upstream component directory used in provenance comments
  --dry-run              Print changes without writing them
  --help                 Show this help
`;

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const result = { root: process.cwd(), dryRun: false };

  for(let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if(argument === "--help" || argument === "-h") {
      result.help = true;
    } else if(argument === "--dry-run") {
      result.dryRun = true;
    } else if(["--root", "--symbol", "--types", "--upstream-dir"].includes(argument)) {
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

function pascalCase(value) {
  return value
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
}

function detectEol(contents) {
  return contents.includes("\r\n") ? "\r\n" : "\n";
}

function ensureTrailingEol(contents, eol) {
  return contents.replace(/\r?\n?$/, eol);
}

function assertRepo(root) {
  for(const relativePath of ["packages/ui/src/index.ts", "packages/styles/src/components.css"]) {
    if(!existsSync(path.join(root, relativePath))) {
      fail(`${root} is not a gitlab-ui-react root; missing ${relativePath}`);
    }
  }
}

function insertSortedRegistration(contents, registration, sortKey, linePattern) {
  const bom = contents.startsWith("\uFEFF") ? "\uFEFF" : "";
  const body = bom ? contents.slice(1) : contents;
  const eol = detectEol(body);
  const normalized = ensureTrailingEol(body, eol);
  const matches = [...normalized.matchAll(linePattern)];
  const next = matches.find((match) => sortKey.localeCompare(match[1], "en") < 0);
  const offset = next?.index ?? normalized.length;
  return `${bom}${normalized.slice(0, offset)}${ensureTrailingEol(registration, eol)}${normalized.slice(offset)}`;
}

function writeNewFile(filePath, contents, state) {
  const relativePath = path.relative(state.root, filePath).replaceAll("\\", "/");
  if(existsSync(filePath)) {
    state.skipped.push(relativePath);
    return;
  }

  state.created.push(relativePath);
  if(!state.dryRun) {
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, contents, "utf8");
  }
}

function updateFile(filePath, transform, state) {
  const current = readFileSync(filePath, "utf8");
  const next = transform(current);
  const relativePath = path.relative(state.root, filePath).replaceAll("\\", "/");

  if(next === current) {
    state.skipped.push(relativePath);
    return;
  }

  state.updated.push(relativePath);
  if(!state.dryRun) writeFileSync(filePath, next, "utf8");
}

const options = parseArgs(process.argv.slice(2));
if(options.help) {
  process.stdout.write(HELP);
  process.exit(0);
}

if(!options.name) fail("a component name is required; use --help for usage");
if(!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(options.name)) {
  fail("component name must be lowercase kebab-case");
}

const root = path.resolve(options.root);
assertRepo(root);

const symbol = options.symbol ?? `Gl${pascalCase(options.name)}`;
if(!/^[A-Z][A-Za-z0-9]*$/.test(symbol)) fail("--symbol must be a PascalCase identifier");

const typeOption = options.types ?? `${symbol}Props`;
const types = typeOption === "none" ? [] : [...new Set(typeOption.split(",").map((item) => item.trim()))];
if(types.some((typeName) => !/^[A-Z][A-Za-z0-9]*$/.test(typeName))) {
  fail("--types must be a comma-separated list of exported TypeScript identifiers, or none");
}

const upstreamName = options.name.replaceAll("-", "_");
const upstreamDir =
  options.upstreamDir ?? `packages/gitlab-ui/src/components/base/${upstreamName}`;
if(path.isAbsolute(upstreamDir) || upstreamDir.includes("\n") || upstreamDir.includes("\r")) {
  fail("--upstream-dir must be a single-line relative path");
}

const modulePath = `./base/${options.name}/${options.name}`;
const componentDir = path.join(root, "packages/ui/src/base", options.name);
const propsType = types[0];
const typeDeclarations = types.length
  ? types
      .map((typeName, index) => index === 0
          ? `export type ${typeName} = Record<string, never>;`
          : `export type ${typeName} = never;`,
      )
      .join("\n")
  : "";
const parameterType = propsType ?? "Record<string, never>";

const provenance = (fileName) => `/**
 * Ported from GitLab UI:
 * ${upstreamDir}/${fileName}
 */`;

const files = new Map([
  [
    `${options.name}.tsx`,
    `${provenance(`${upstreamName}.vue`)}

// PORT_SCAFFOLD_TODO: replace the placeholder with the upstream-compatible implementation.
${typeDeclarations ? `${typeDeclarations}\n\n` : ""}export default function ${symbol}(_: ${parameterType}) {
  return null;
}
`,
  ],
  [
    `${options.name}.css`,
    `${provenance(`${upstreamName}.scss`)}

/* PORT_SCAFFOLD_TODO: replace with the ported component styles. */
`,
  ],
  [
    `${options.name}.test.tsx`,
    `import { describe, it } from "vitest";

// PORT_SCAFFOLD_TODO: replace with behavior-focused tests.
describe("${symbol}", () => {
  it.todo("ports the upstream behavior");
});
`,
  ],
  [
    `${options.name}.stories.tsx`,
    `import type { Meta } from "@storybook/react-vite";

import ${symbol} from "./${options.name}";

// PORT_SCAFFOLD_TODO: add representative state and interaction stories.
const meta = {
  component: ${symbol},
} satisfies Meta<typeof ${symbol}>;

export default meta;
`,
  ],
]);

const state = { root, dryRun: options.dryRun, created: [], updated: [], skipped: [] };
for(const [fileName, contents] of files) {
  writeNewFile(path.join(componentDir, fileName), contents, state);
}

const indexPath = path.join(root, "packages/ui/src/index.ts");
updateFile(
  indexPath,
  (contents) => {
    if(contents.includes(`from "${modulePath}"`)) return contents;
    if(new RegExp(`\\b${symbol}\\b`).test(contents)) {
      fail(`${symbol} is already exported from another module in packages/ui/src/index.ts`);
    }

    const eol = detectEol(contents);
    const typeBlock = types.length
      ? `${eol}export type {${eol}${types
          .slice()
          .sort((left, right) => left.localeCompare(right, "en"))
          .map((typeName) => `  ${typeName},`)
          .join(eol)}${eol}} from "${modulePath}";`
      : "";
    const registration = `export { default as ${symbol} } from "${modulePath}";${typeBlock}`;
    return insertSortedRegistration(
      contents,
      registration,
      symbol,
      /^export \{ default as ([A-Z][A-Za-z0-9]*) \} from .+;\r?$/gm,
    );
  },
  state,
);

const stylesPath = path.join(root, "packages/styles/src/components.css");
const cssImport = `@import "../../ui/src/base/${options.name}/${options.name}.css";`;
updateFile(
  stylesPath,
  (contents) => {
    if(contents.replace(/^\uFEFF/, "").split(/\r?\n/).includes(cssImport)) return contents;
    return insertSortedRegistration(
      contents,
      cssImport,
      options.name,
      /^@import "\.\.\/\.\.\/ui\/src\/base\/([^/]+)\/.+";\r?$/gm,
    );
  },
  state,
);

const prefix = options.dryRun ? "Dry run" : "Scaffold complete";
console.log(`${prefix}: ${options.name}`);
for(const [label, entries] of [
  ["create", state.created],
  ["update", state.updated],
  ["skip", state.skipped],
]) {
  if(entries.length) console.log(`  ${label}: ${entries.join(", ")}`);
}
