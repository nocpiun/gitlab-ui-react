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
const formInputCssPath = path.join(
  packageDirectory,
  "../ui/src/base/form-input/form-input.css",
);
const formInputGroupCssPath = path.join(
  packageDirectory,
  "../ui/src/base/form-input-group/form-input-group.css",
);

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
  "input-group",
  "input-group-append",
  "input-group-prepend",
  "input-group-text",
  "invalid-feedback",
]);
const MARKER_CLASSES = new Set([
  "gl-form-checkbox",
  "gl-form-radio",
  "gl-form-radio-group",
  "gl-form-input",
  "gl-form-input-group",
  "gl-form-input-group-addon",
  "gl-form-date",
  "gl-form-select",
  "gl-input-group-text",
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
  expect(selectors).toContain(".gl-form-input-group.input-group");
  expect(selectors.some((selector) => (
    selector.includes(".gl-form-input-group.input-group")
    && selector.includes(".custom-select")
  ))).toBe(true);
  expect(collectRules(root).some((rule) => (
    rule.selector.includes(".gl-input-group-text")
    && normalizedDeclarations(rule).includes("display: flex")
  ))).toBe(true);
  expect(selectors).toContain(".gl-form-date .invalid-feedback");
  expect(selectors).toContain(".gl-form-select.custom-select");
}, 30000);

test("input groups adapt their layout to the GlFormSelect wrapper", async () => {
  const root = await compile();
  const rules = collectRules(root);
  const layoutSelector = ".gl-form-input-group.input-group > .gl-form-select-wrapper";
  const focusSelector = `${layoutSelector}:focus-within`;
  const leftRadiusSelector = [
    ".gl-form-input-group.input-group",
    "> .gl-form-select-wrapper:not(:first-child)",
    "> .custom-select",
  ].join(" ");
  const rightRadiusSelector = [
    ".gl-form-input-group.input-group",
    "> .gl-form-select-wrapper:not(:last-child)",
    "> .custom-select",
  ].join(" ");
  const findRule = (selector) => rules.find((rule) => rule.selectors.includes(selector));
  const layoutRule = findRule(layoutSelector);
  const focusRule = findRule(focusSelector);
  const leftRadiusRule = findRule(leftRadiusSelector);
  const rightRadiusRule = findRule(rightRadiusSelector);

  expect(layoutRule).toBeDefined();
  expect(focusRule).toBeDefined();
  expect(leftRadiusRule).toBeDefined();
  expect(rightRadiusRule).toBeDefined();
  expect(normalizedDeclarations(layoutRule)).toEqual(expect.arrayContaining([
    "position: relative",
    "flex: 1 1 auto",
    "width: 1%",
    "min-width: 0",
  ]));
  expect(normalizedDeclarations(focusRule)).toContain("z-index: 3");
  expect(normalizedDeclarations(leftRadiusRule)).toEqual(expect.arrayContaining([
    "border-top-left-radius: 0",
    "border-bottom-left-radius: 0",
  ]));
  expect(normalizedDeclarations(rightRadiusRule)).toEqual(expect.arrayContaining([
    "border-top-right-radius: 0",
    "border-bottom-right-radius: 0",
  ]));
  expect(rules.some((rule) => (
    rule.selectors.includes(
      ".gl-form-input-group.input-group > .gl-form-select-wrapper + .form-control",
    )
    && normalizedDeclarations(rule).includes("margin-left: -1px")
  ))).toBe(true);
}, 30000);

test("grouped range integration remains owned by the form-input stylesheet", async () => {
  const [formInputCss, formInputGroupCss] = await Promise.all([
    readFile(formInputCssPath, "utf8"),
    readFile(formInputGroupCssPath, "utf8"),
  ]);

  expect(formInputCss).toContain(".gl-form-input-group.input-group");
  expect(formInputCss).toContain("> .gl-form-input.custom-range");
  expect(formInputGroupCss).not.toContain("> .gl-form-input.custom-range");
});

test("grouped ranges use the standard focus ring and forced-colors outline", async () => {
  const root = await compile();
  const selector = ".gl-form-input-group.input-group > .gl-form-input.custom-range:focus-visible";
  const standardFocusShadow = [
    "inset 0 0 0 1px var(--gl-control-border-color-focus)",
    "0 0 0 1px var(--gl-focus-ring-inner-color)",
    "0 0 0 3px var(--gl-focus-ring-outer-color)",
  ].join(", ");
  const focusRule = collectRules(root).find((rule) => rule.selector === selector);
  let forcedColorsRule;

  root.walkAtRules("media", (atRule) => {
    if(atRule.params.includes("forced-colors: active")) {
      atRule.walkRules((rule) => {
        if(rule.selector === selector) forcedColorsRule = rule;
      });
    }
  });

  expect(focusRule).toBeDefined();
  expect(forcedColorsRule).toBeDefined();
  expect(normalizedDeclarations(focusRule)).toEqual(expect.arrayContaining([
    "border-color: var(--gl-control-border-color-focus)",
    "outline: none",
    `box-shadow: ${standardFocusShadow}`,
  ]));
  expect(normalizedDeclarations(forcedColorsRule)).toContain("outline: 2px solid LinkText");
}, 30000);

test("grouped range validation colors its outer border and focused shadow", async () => {
  const root = await compile();
  const rules = collectRules(root);
  const expectedStates = [
    {
      borderColor: "#2f7549",
      focusShadow: "0 0 0 0.2rem rgba(47, 117, 73, 0.25)",
      state: "is-valid",
    },
    {
      borderColor: "#c02f12",
      focusShadow: "0 0 0 0.2rem rgba(192, 47, 18, 0.25)",
      state: "is-invalid",
    },
  ];

  for(const { borderColor, focusShadow, state } of expectedStates) {
    const selector = `.gl-form-input-group.input-group > .gl-form-input.custom-range.${state}`;
    const stateRule = rules.find((rule) => rule.selector === selector);
    const focusRule = rules.find((rule) => rule.selector === `${selector}:focus-visible`);

    expect(stateRule).toBeDefined();
    expect(focusRule).toBeDefined();
    expect(normalizedDeclarations(stateRule)).toContain(`border-color: ${borderColor}`);
    expect(normalizedDeclarations(focusRule)).toContain(`border-color: ${borderColor}`);
    expect(normalizedDeclarations(focusRule)).toContain(`box-shadow: ${focusShadow}`);
  }
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
  const inputGroupFoundation = rules.find((rule) => (
    rule.selector === ".gl-form-input-group.input-group"
    && normalizedDeclarations(rule).includes("display: flex")
  ));
  const inputGroupPrivate = rules.find((rule) => (
    rule.selector.includes(".gl-form-input-group.input-group")
    && rule.selector.includes(".gl-listbox")
  ));

  expect(foundationControl).toBeDefined();
  expect(sharedControl).toBeDefined();
  expect(privateMask).toBeDefined();
  expect(sharedIndicator).toBeDefined();
  expect(inputGroupFoundation).toBeDefined();
  expect(inputGroupPrivate).toBeDefined();
  expect(foundationControl.source.start.offset).toBeLessThan(sharedControl.source.start.offset);
  expect(sharedIndicator.source.start.offset).toBeLessThan(privateMask.source.start.offset);
  expect(inputGroupFoundation.source.start.offset).toBeLessThan(
    inputGroupPrivate.source.start.offset,
  );
}, 30000);

test("$input-transition and $custom-forms-transition are consistent and reduced-motion aware", async () => {
  const root = await compile();
  const rules = collectRules(root);

  // Upstream `$input-transition`, once for the standalone text control and
  // once for the grouped range control.
  const inputTransitions = rules.filter((rule) => normalizedDeclarations(rule).includes(
    "transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
  ));
  expect(inputTransitions).toHaveLength(2);
  expect(inputTransitions.map((rule) => rule.selector)).toEqual(expect.arrayContaining([
    ".gl-form-input.form-control",
    ".gl-form-input-group.input-group > .gl-form-input.custom-range",
  ]));

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
