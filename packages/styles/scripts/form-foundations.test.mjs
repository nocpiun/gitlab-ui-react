import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import selectorParser from "postcss-selector-parser";
import { expect, test } from "vitest";
import { createPostcssPlugins } from "../postcss.config.mjs";

const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputPath = path.join(packageDirectory, "src/index.css");
const fixtureDirectory = path.join(packageDirectory, "scripts/fixtures");

async function compile() {
  const input = await readFile(inputPath, "utf8");
  const result = await postcss(
    createPostcssPlugins({
      sources: [{ base: fixtureDirectory, pattern: "*.html", negated: false }],
    }),
  ).process(input, { from: inputPath });
  return postcss.parse(result.css);
}

// Bootstrap generic classes that must never leak unscoped into the output.
const WATCHED_CLASSES = new Set([
  "custom-control",
  "custom-control-input",
  "custom-control-label",
  "custom-checkbox",
  "custom-radio",
  "custom-range",
  "custom-select",
  "form-control",
  "form-control-plaintext",
  "invalid-feedback",
]);
const MARKER_CLASSES = new Set([
  "gl-form-checkbox",
  "gl-form-radio",
  "gl-form-radio-group",
  "gl-form-input",
  "gl-form-date",
  "gl-form-select",
]);

function selectorClassNames(selector) {
  const classNames = new Set();
  selectorParser((root) => {
    root.walkClasses((node) => classNames.add(node.value));
  }).processSync(selector);
  return classNames;
}

function collectRules(root) {
  const rules = [];
  root.walkRules((rule) => rules.push(rule));
  return rules;
}

function normalizedDeclarations(rule) {
  return rule.nodes
    .filter((node) => node.type === "decl")
    .map((decl) => `${decl.prop}: ${decl.value.replace(/\s+/gu, " ")}`);
}

test("compiled output contains no @apply and no unexpected Bootstrap globals", async () => {
  const root = await compile();
  const css = root.toString();

  expect(css).not.toMatch(/@apply/u);
  // No full-Bootstrap constructs that were deliberately omitted.
  expect(css).not.toMatch(/\.form-check/u);
  expect(css).not.toMatch(/\.custom-file/u);
  expect(css).not.toMatch(/\.custom-switch/u);
  expect(css).not.toMatch(/\.input-group/u);
  expect(css).not.toMatch(/\.was-validated/u);
  expect(css).not.toMatch(/::-ms-/u);
}, 30000);

test("key compatibility selectors exist", async () => {
  const root = await compile();
  const selectors = collectRules(root).flatMap((rule) => rule.selectors);

  expect(selectors).toContain(".gl-form-checkbox .custom-control-label::before");
  expect(selectors).toContain(".gl-form-radio .custom-control-label::before");
  expect(selectors).toContain(".gl-form-input.form-control");
  expect(selectors).toContain(".gl-form-input.custom-range::-webkit-slider-thumb");
  expect(selectors).toContain(".gl-form-input.custom-range::-moz-range-track");
  expect(selectors).toContain(".gl-form-date .invalid-feedback");
  expect(selectors).toContain(".gl-form-select.custom-select");
}, 30000);

test("shared blocks are emitted exactly once", async () => {
  const root = await compile();
  const rules = collectRules(root);
  const allDeclarations = rules.flatMap((rule) => normalizedDeclarations(rule));

  // The `.custom-control` base (previously duplicated in checkbox and radio).
  expect(
    allDeclarations.filter((decl) => decl === "print-color-adjust: exact"),
  ).toHaveLength(1);
  // The indicator foreground base (previously duplicated per component).
  expect(
    allDeclarations.filter((decl) => decl === "background: 50% / 50% 50% no-repeat"),
  ).toHaveLength(1);
  // Each component-private mask image references the shared glyph custom
  // property, and each glyph SVG data URI is defined exactly once (in
  // glyph-icons.css).
  const css = root.toString();
  expect(css.match(/mask-image: url/gu)).toBeNull();
  expect(css.match(/--gl-icon-check: url/gu)).toHaveLength(1);
  expect(css.match(/--gl-icon-indeterminate: url/gu)).toHaveLength(1);
  expect(css.match(/--gl-icon-radio: url/gu)).toHaveLength(1);
  expect(css.match(/mask-image: var\(--gl-icon-check\)/gu)).toHaveLength(1);
  expect(css.match(/mask-image: var\(--gl-icon-indeterminate\)/gu)).toHaveLength(1);
  expect(css.match(/mask-image: var\(--gl-icon-radio\)/gu)).toHaveLength(1);
}, 30000);

test("foundation rules come before shared overrides and component-private CSS", async () => {
  const root = await compile();
  const rules = collectRules(root);

  const foundationControl = rules.find((rule) => rule.selector.includes(".gl-form-checkbox.custom-control")
    && normalizedDeclarations(rule).includes("print-color-adjust: exact"));
  const sharedControl = rules.find((rule) => rule.selector.includes(".gl-form-checkbox.custom-control")
    && normalizedDeclarations(rule).some((decl) => decl.startsWith("padding-left: var(--gl-spacing-scale-5)")));
  const privateMask = rules.find((rule) => rule.selector.includes("[type=\"checkbox\"]:checked"));
  const sharedIndicator = rules.find((rule) => rule.selector.includes(".custom-control-label::after")
    && normalizedDeclarations(rule).includes("background: 50% / 50% 50% no-repeat"));

  expect(foundationControl).toBeDefined();
  expect(sharedControl).toBeDefined();
  expect(privateMask).toBeDefined();
  expect(sharedIndicator).toBeDefined();
  expect(foundationControl.source.start.offset).toBeLessThan(sharedControl.source.start.offset);
  expect(sharedIndicator.source.start.offset).toBeLessThan(privateMask.source.start.offset);
}, 30000);

test("$input-transition and $custom-forms-transition are consistent and reduced-motion aware", async () => {
  const root = await compile();
  const rules = collectRules(root);

  // Upstream `$input-transition`, exactly once.
  const inputTransitions = rules.filter((rule) => normalizedDeclarations(rule).includes(
    "transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
  ));
  expect(inputTransitions).toHaveLength(1);
  expect(inputTransitions[0].selector).toBe(".gl-form-input.form-control");

  // No leftover per-state timing overrides on the input.
  const timingOverrides = rules.filter((rule) => rule.selector.includes("gl-form-input")
    && normalizedDeclarations(rule).some((decl) => decl.startsWith("transition-timing-function")));
  expect(timingOverrides).toHaveLength(0);

  // Reduced-motion overrides exist for the input and custom form controls.
  const reducedMotionSelectors = [];
  root.walkAtRules("media", (atRule) => {
    if(atRule.params.includes("prefers-reduced-motion")) {
      atRule.walkRules((rule) => reducedMotionSelectors.push(rule.selector));
    }
  });
  expect(
    reducedMotionSelectors.some((selector) => selector.includes(".gl-form-input.form-control")),
  ).toBe(true);
  expect(
    reducedMotionSelectors.some((selector) => selector.includes(".custom-control-label::before")),
  ).toBe(true);
  expect(
    reducedMotionSelectors.some((selector) => selector.includes(".custom-range")),
  ).toBe(true);
  expect(
    reducedMotionSelectors.some((selector) => selector.includes(".gl-form-select.custom-select")),
  ).toBe(true);
}, 30000);

test("generic Bootstrap selectors are scoped under gl-form markers", async () => {
  const root = await compile();

  for(const rule of collectRules(root)) {
    for(const selector of rule.selectors) {
      const classNames = selectorClassNames(selector);
      const watched = [...classNames].filter((name) => WATCHED_CLASSES.has(name));
      if(watched.length > 0) {
        const markers = [...classNames].filter((name) => MARKER_CLASSES.has(name));
        expect(
          markers,
          `selector "${selector}" uses ${watched.join(", ")} without a gl-form marker`,
        ).not.toHaveLength(0);
      }
    }
  }
}, 30000);
