import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import { loadModule } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import postcssNested from "postcss-nested";
import { compile } from "tailwindcss";

import {
  createCandidateMap,
  restoreLegacySelectors,
  rewriteLegacyApplyDirectives,
} from "./legacy-prefix.mjs";

const require = createRequire(import.meta.url);

function resolveStylesheet(id, base) {
  if(path.isAbsolute(id)) return id;
  if(id.startsWith(".")) return path.resolve(base, id);

  return require.resolve(id, { paths: [base] });
}

function compilerSources(compiler, base) {
  const sources = [...compiler.sources];

  if(compiler.root === null) {
    sources.unshift({ base, pattern: "**/*", negated: false });
  } else if(compiler.root !== "none") {
    sources.unshift({ ...compiler.root, negated: false });
  }

  return sources;
}

async function prepareStylesheet(postcss, content, from) {
  // Tailwind parses imported stylesheets before downstream PostCSS plugins run.
  // Expand source nesting here so Sass-style selectors such as `&-suffix`
  // survive that import step; the configured postcss-nested pass still handles
  // any nesting left in Tailwind's completed AST.
  const rewritten = rewriteLegacyApplyDirectives(content, from);
  const result = await postcss([postcssNested()]).process(rewritten, {
    from,
    map: false,
  });

  return result.css;
}

function removeOneIndentLevel(node) {
  for(const property of ["before", "after"]) {
    const rawValue = node.raws[property];
    if(typeof rawValue === "string") {
      node.raws[property] = rawValue.replace(/(\r?\n) {2}/gu, "$1");
    }
  }

  for(const child of node.nodes ?? []) removeOneIndentLevel(child);
}

function hoistKeyframesFromStyleRules(root) {
  const keyframesToHoist = [];

  root.walkAtRules((atRule) => {
    if(!atRule.name.endsWith("keyframes") || atRule.parent?.type !== "rule") return;

    atRule.remove();
    atRule.raws.before = "\n";
    atRule.raws.after = "\n";
    for(const child of atRule.nodes ?? []) removeOneIndentLevel(child);
    keyframesToHoist.push(atRule);
  });

  root.append(keyframesToHoist);
}

export default function gitlabTailwind({ candidates = [], sources: additionalSources = [] } = {}) {
  return {
    postcssPlugin: "gitlab-tailwind-v3-prefix-compatibility",
    async Once(root, { postcss, result }) {
      const from = result.opts.from ? path.resolve(result.opts.from) : undefined;
      const base = from ? path.dirname(from) : process.cwd();
      const dependencies = new Set();
      const input = rewriteLegacyApplyDirectives(root.toString(), from);

      const compiler = await compile(input, {
        base,
        from,
        async loadModule(id, moduleBase) {
          const loaded = await loadModule(id, moduleBase, (dependency) => {
            dependencies.add(path.resolve(dependency));
          });

          dependencies.add(path.resolve(loaded.path));
          return loaded;
        },
        async loadStylesheet(id, stylesheetBase) {
          const stylesheetPath = resolveStylesheet(id, stylesheetBase);
          const content = await readFile(stylesheetPath, "utf8");

          dependencies.add(stylesheetPath);

          return {
            path: stylesheetPath,
            base: path.dirname(stylesheetPath),
            content: await prepareStylesheet(postcss, content, stylesheetPath),
          };
        },
      });

      const sources = [...compilerSources(compiler, base), ...additionalSources];
      const scannedCandidates = sources.length > 0 ? new Scanner({ sources }).scan() : [];
      const candidateMap = createCandidateMap([...scannedCandidates, ...candidates]);
      const css = compiler.build([...candidateMap.keys()]);
      const compiledRoot = postcss.parse(css, { from });

      restoreLegacySelectors(compiledRoot, candidateMap);
      // Tailwind 4 preserves plugin-authored nested keyframes, but production
      // CSS minifiers expect keyframes at the stylesheet root.
      hoistKeyframesFromStyleRules(compiledRoot);

      root.removeAll();
      root.append(compiledRoot.nodes);

      for(const dependency of dependencies) {
        result.messages.push({
          type: "dependency",
          plugin: "gitlab-tailwind-v3-prefix-compatibility",
          file: dependency,
          parent: from,
        });
      }

      for(const source of sources) {
        result.messages.push({
          type: "dir-dependency",
          plugin: "gitlab-tailwind-v3-prefix-compatibility",
          dir: source.base,
          glob: source.pattern,
          parent: from,
        });
      }
    },
  };
}

gitlabTailwind.postcss = true;
