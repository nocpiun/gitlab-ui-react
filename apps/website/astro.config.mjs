import { fileURLToPath } from "node:url";
import { satteri } from "@astrojs/markdown-satteri";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import pagefind from "astro-pagefind";
import { defineConfig } from "astro/config";
import { calloutsPlugin } from "./src/markdown/callouts.mjs";
import { codeBlocksPlugin } from "./src/markdown/code-blocks.mjs";

const examplesDirectory = fileURLToPath(new URL("../../examples", import.meta.url));
const uiEntry = fileURLToPath(new URL("../../packages/ui/src/index.ts", import.meta.url));

export default defineConfig({
  site: "https://glui.nocp.space",
  output: "static",
  i18n: {
    defaultLocale: "en",
    locales: ["en", "zh"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [react(), mdx(), pagefind()],
  markdown: {
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    },
    processor: satteri({
      mdastPlugins: [calloutsPlugin],
      hastPlugins: [codeBlocksPlugin],
    }),
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@examples": examplesDirectory,
        "gitlab-ui-react": uiEntry,
      },
    },
  },
});
