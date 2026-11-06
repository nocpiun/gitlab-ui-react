import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import { beforeAll, expect, it } from "vitest";
import { createPostcssPlugins } from "../postcss.config.mjs";

const inputPath = fileURLToPath(new URL("../src/index.css", import.meta.url));
const tokenDirectory = fileURLToPath(new URL("../../tokens/dist/css/", import.meta.url));
let root;

beforeAll(async () => {
  const input = await readFile(inputPath, "utf8");
  const result = await postcss(createPostcssPlugins()).process(input, { from: inputPath });
  root = postcss.parse(result.css);
}, 30000);

it.each([
  ["default", "default"],
  ["info", "info"],
  ["primary", "info"],
  ["success", "success"],
  ["warning", "warning"],
  ["danger", "danger"],
])("publishes the %s progress variant using the %s token", (variant, token) => {
  const backgrounds = [];

  root.walkRules((rule) => {
    if(rule.selectors.includes(`.gl-progress-bar-${variant}`)) {
      rule.walkDecls("background-color", (declaration) => backgrounds.push(declaration.value));
    }
  });

  expect(backgrounds).toEqual([`var(--gl-progress-bar-indicator-color-${token})`]);
});

it.each([
  ["tokens.css", "--gl-color-neutral-900"],
  ["tokens.dark.css", "--gl-color-neutral-50"],
])("keeps neutral and info colors distinct in %s", async (filename, neutralColor) => {
  const tokens = postcss.parse(await readFile(path.join(tokenDirectory, filename), "utf8"));
  const colors = new Map();

  tokens.walkDecls(/^--gl-progress-bar-indicator-color-/, (declaration) => {
    colors.set(declaration.prop, declaration.value);
  });

  expect(colors.get("--gl-progress-bar-indicator-color-default")).toBe(`var(${neutralColor})`);
  expect(colors.get("--gl-progress-bar-indicator-color-info")).toBe("var(--gl-status-info-icon-color)");
});
