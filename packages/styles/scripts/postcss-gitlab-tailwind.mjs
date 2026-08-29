import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import { loadModule } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
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
            content: rewriteLegacyApplyDirectives(content, stylesheetPath),
          };
        },
      });

      const sources = [...compilerSources(compiler, base), ...additionalSources];
      const scannedCandidates = sources.length > 0 ? new Scanner({ sources }).scan() : [];
      const candidateMap = createCandidateMap([...scannedCandidates, ...candidates]);
      const css = compiler.build([...candidateMap.keys()]);
      const compiledRoot = postcss.parse(css, { from });

      restoreLegacySelectors(compiledRoot, candidateMap);

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
