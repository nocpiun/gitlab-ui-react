import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import selectorParser from "postcss-selector-parser";
import { expect, test } from "vitest";
import { createPostcssPlugins } from "../postcss.config.mjs";
import { toTailwindCandidate } from "./legacy-prefix.mjs";

const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputPath = path.join(packageDirectory, "src/index.css");
const fixtureDirectory = path.join(packageDirectory, "scripts/fixtures");

test("converts upstream gl-* candidates without changing variant order", () => {
  expect(toTailwindCandidate("gl-bg-default")).toBe("bg-default");
  expect(toTailwindCandidate("hover:gl-text-link")).toBe("hover:text-link");
  expect(toTailwindCandidate("md:hover:-gl-m-2")).toBe("md:hover:-m-2");
  expect(toTailwindCandidate("[&:nth-child(2)]:gl-text-link")).toBe(
    "[&:nth-child(2)]:text-link",
  );
  expect(toTailwindCandidate("dark")).toBeNull();
});

test("compiles @apply and restores upstream gl-* selectors", async () => {
  const input = await readFile(inputPath, "utf8");
  const result = await postcss(
    createPostcssPlugins({
      sources: [{ base: fixtureDirectory, pattern: "*.html", negated: false }],
    }),
  ).process(input, { from: inputPath });

  expect(result.css).not.toMatch(/@apply/u);
  expect(result.css).toMatch(/body\s*\{[^}]*background-color:/su);
  expect(result.css).toMatch(/\.gl-bg-default\s*\{/u);
  expect(result.css).toMatch(/\.hover\\:gl-text-link:hover\s*\{/u);
  expect(result.css).toMatch(/\.dark\\:gl-bg-default:where\(\.dark \*\)/u);
  expect(result.css).toMatch(/\.gl-border\s*\{/u);
  expect(result.css).toMatch(
    /\.group-hover\\:gl-bg-default:is\(:where\(\.gl-group\):hover \*\)/u,
  );
  expect(result.css).not.toMatch(/:where\(\.gl-dark \*\)/u);
}, 30000);

test("hoists plugin keyframes and expands nested media rules", async () => {
  const input = await readFile(inputPath, "utf8");
  const result = await postcss(
    createPostcssPlugins({ candidates: ["animate-skeleton-loader"] }),
  ).process(input, { from: inputPath });
  const root = postcss.parse(result.css);
  const skeletonRule = root.nodes.find(
    (node) => node.type === "rule" && node.selector === ".gl-animate-skeleton-loader",
  );
  const keyframes = root.nodes.find(
    (node) => node.type === "atrule"
      && node.name === "keyframes"
      && node.params === "gl-keyframes-skeleton-loader",
  );

  expect(skeletonRule).toBeDefined();
  expect(skeletonRule.nodes.some((node) => node.type === "atrule")).toBe(false);
  expect(skeletonRule.nodes.some(
    (node) => node.type === "atrule" && node.name === "keyframes",
  )).toBe(false);
  expect(keyframes).toBeDefined();
  const reducedMotionRules = root.nodes
    .filter(
      (node) => node.type === "atrule"
        && node.name === "media"
        && node.params.includes("prefers-reduced-motion"),
    )
    .flatMap((node) => node.nodes ?? []);
  expect(reducedMotionRules.some(
    (node) => node.type === "rule" && node.selector === ".gl-animate-skeleton-loader",
  )).toBe(true);
  expect(result.css).toContain(
    "\n@keyframes gl-keyframes-skeleton-loader {\n  0% {",
  );
}, 30000);

test("expands the Sass-like nesting forms used by upstream styles", async () => {
  const inputPath = path.join(fixtureDirectory, "nesting-forms.css");
  const input = await readFile(inputPath, "utf8");
  const result = await postcss(createPostcssPlugins()).process(input, { from: inputPath });
  const root = postcss.parse(result.css);
  expect(result.css).not.toMatch(/@apply/u);
  const selectorsForDeclaration = (property, value, container = root) => {
    const selectors = [];
    container.walkRules((rule) => {
      if(rule.nodes.some(
        (node) => node.type === "decl" && node.prop === property && node.value === value,
      )) selectors.push(...rule.selectors);
    });
    return selectors.sort();
  };
  const findAtRule = (name) => root.nodes.find(
    (node) => node.type === "atrule" && node.name === name,
  );

  expect(selectorsForDeclaration("color", "blue")).toEqual([
    ".nesting-alternate.selected",
    ".nesting-alternate:hover",
    ".nesting-fixture.selected",
    ".nesting-fixture:hover",
  ]);
  expect(selectorsForDeclaration("color", "green")).toEqual([
    ".nesting-alternate-suffix",
    ".nesting-fixture-suffix",
  ]);
  expect(selectorsForDeclaration("display", "inline")).toEqual([
    ".nesting-alternate .descendant",
    ".nesting-fixture .descendant",
  ]);
  expect(selectorsForDeclaration("display", "block")).toEqual([
    ".nesting-alternate + .adjacent",
    ".nesting-alternate > .child",
    ".nesting-alternate ~ .sibling",
    ".nesting-fixture + .adjacent",
    ".nesting-fixture > .child",
    ".nesting-fixture ~ .sibling",
  ]);
  expect(selectorsForDeclaration("color", "red")).toEqual([
    ".ancestor .nesting-alternate",
    ".ancestor .nesting-fixture",
  ]);

  const media = findAtRule("media");
  const supports = findAtRule("supports");
  const container = findAtRule("container");
  expect(media?.params).toBe("(width >= 40rem)");
  expect(supports?.params).toBe("(display: grid)");
  expect(container?.params).toBe("(width >= 20rem)");
  expect(selectorsForDeclaration("color", "purple", media)).toEqual([
    ".nesting-alternate",
    ".nesting-fixture",
  ]);
  expect(selectorsForDeclaration("display", "grid", supports)).toEqual([
    ".nesting-alternate",
    ".nesting-fixture",
  ]);
  expect(selectorsForDeclaration("inline-size", "100%", container)).toEqual([
    ".nesting-alternate",
    ".nesting-fixture",
  ]);
});

test("expands suffix nesting in imported stylesheets before Tailwind parses it", async () => {
  const from = path.join(packageDirectory, "scripts/nesting-entry.css");
  const result = await postcss(createPostcssPlugins()).process(
    "@import \"./fixtures/nesting.css\";",
    { from },
  );

  expect(result.css).toContain(".imported-nesting-fixture-suffix {");
  expect(result.css).not.toContain(":is(.imported-nesting-fixture)-suffix");
});

test("published stylesheet contains only expanded rules", async () => {
  const input = await readFile(inputPath, "utf8");
  const result = await postcss(createPostcssPlugins()).process(input, { from: inputPath });
  const root = postcss.parse(result.css);
  const nestedRules = [];
  const nestedAtRules = [];
  const nestingSelectors = [];

  root.walkRules((rule) => {
    if(rule.parent?.type === "rule") nestedRules.push(rule.selector);
    selectorParser((selectorRoot) => {
      selectorRoot.walkNesting(() => nestingSelectors.push(rule.selector));
    }).processSync(rule.selector);
  });
  root.walkAtRules((atRule) => {
    if(atRule.parent?.type === "rule") nestedAtRules.push(`@${atRule.name} ${atRule.params}`);
  });

  expect(result.css).not.toMatch(/@apply/u);
  expect(result.css).toContain(".gl-alert-danger {");
  expect(result.css).not.toContain(":is(.gl-alert)-danger");
  expect(nestedRules).toEqual([]);
  expect(nestedAtRules).toEqual([]);
  expect(nestingSelectors).toEqual([]);
}, 30000);
