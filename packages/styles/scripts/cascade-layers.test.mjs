import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import { expect, test } from "vitest";
import { createPostcssPlugins } from "../postcss.config.mjs";

const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputPath = path.join(packageDirectory, "src/index.css");

async function compile() {
  const input = await readFile(inputPath, "utf8");
  const result = await postcss(
    createPostcssPlugins({ candidates: ["gl-mb-0", "gl-py-6"] }),
  ).process(input, { from: inputPath });

  return postcss.parse(result.css);
}

function containingLayer(rule) {
  let parent = rule?.parent;

  while(parent && parent.type !== "root") {
    if(parent.type === "atrule" && parent.name === "layer") return parent.params;
    parent = parent.parent;
  }

  return null;
}

function findRule(root, selector, declaration) {
  let result;

  root.walkRules((rule) => {
    if(result || rule.selector !== selector) return;
    if(rule.nodes.some(
      (node) => node.type === "decl" && node.prop === declaration,
    )) result = rule;
  });

  return result;
}

test("publishes base, component, and utility rules in cascade order", async () => {
  const root = await compile();
  const layerOrder = root.nodes.find(
    (node) => node.type === "atrule"
      && node.name === "layer"
      && node.nodes === undefined
      && node.params.includes("theme"),
  );
  const paragraphRule = findRule(root, "p", "margin-bottom");
  const cardRule = findRule(root, ".gl-card", "padding");
  const marginUtility = findRule(root, ".gl-mb-0", "margin-bottom");
  const paddingUtility = findRule(root, ".gl-py-6", "padding-block");

  expect(layerOrder?.params).toBe("theme, base, components, utilities");
  expect(containingLayer(paragraphRule)).toBe("base");
  expect(containingLayer(cardRule)).toBe("components");
  expect(containingLayer(marginUtility)).toBe("utilities");
  expect(containingLayer(paddingUtility)).toBe("utilities");
}, 30000);
