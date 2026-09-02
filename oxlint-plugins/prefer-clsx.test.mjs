import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const pluginDir = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(pluginDir, "fixtures");
const oxlintBin = path.join(path.dirname(pluginDir), "node_modules", "oxlint", "bin", "oxlint");
const configPath = path.join(path.dirname(pluginDir), ".oxlintrc.json");
const ruleCode = "gitlab-ui-react(prefer-clsx)";

// Expected flagged lines per fixture file; keep in sync with the fixture
// sources under oxlint-plugins/fixtures.
const expectations = {
  "jsx-attribute.tsx": [1, 2, 3],
  "object-property.ts": [1],
  "class-name-variable.ts": [1, 2],
  "indirect-variable.tsx": [2, 7],
  "non-class-usage.ts": [],
};

let workDir;
let flaggedByFile;

beforeAll(() => {
  workDir = mkdtempSync(path.join(tmpdir(), "prefer-clsx-"));
  for(const name of readdirSync(fixturesDir)) {
    copyFileSync(path.join(fixturesDir, name), path.join(workDir, name));
  }

  let output;
  try {
    output = execFileSync(
      process.execPath,
      [oxlintBin, "--config", configPath, "--format", "json", workDir],
      { encoding: "utf8" },
    );
  } catch(error) {
    // oxlint exits non-zero when any rule (including unrelated ones in the
    // shared config) reports an error; the JSON report is still on stdout.
    output = error.stdout;
  }
  if(!output) throw new Error("oxlint produced no JSON output");

  const { diagnostics } = JSON.parse(output);

  flaggedByFile = new Map();
  for(const diagnostic of diagnostics) {
    if(diagnostic.code !== ruleCode) continue;
    const name = path.basename(diagnostic.filename);
    const lines = flaggedByFile.get(name) ?? [];
    lines.push(...diagnostic.labels.map((label) => label.span.line));
    flaggedByFile.set(name, lines);
  }
});

afterAll(() => {
  rmSync(workDir, { recursive: true, force: true });
});

function flaggedLines(file) {
  return (flaggedByFile.get(file) ?? []).sort((a, b) => a - b);
}

describe("oxlint rule gitlab-ui-react/prefer-clsx", () => {
  it("flags className JSX attributes, with any join separator", () => {
    expect(flaggedLines("jsx-attribute.tsx")).toEqual(expectations["jsx-attribute.tsx"]);
  });

  it("flags className object properties (cva-style configs)", () => {
    expect(flaggedLines("object-property.ts")).toEqual(expectations["object-property.ts"]);
  });

  it("flags variables named *className, including arrow function bodies", () => {
    expect(flaggedLines("class-name-variable.ts")).toEqual(expectations["class-name-variable.ts"]);
  });

  it("follows plain variables and aliases into className attributes", () => {
    expect(flaggedLines("indirect-variable.tsx")).toEqual(expectations["indirect-variable.tsx"]);
  });

  it("ignores joins that are not class name merging", () => {
    expect(flaggedLines("non-class-usage.ts")).toEqual(expectations["non-class-usage.ts"]);
  });
});
