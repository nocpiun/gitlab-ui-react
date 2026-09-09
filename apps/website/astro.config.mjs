import { fileURLToPath } from "node:url";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

const examplesDirectory = fileURLToPath(new URL("../../examples", import.meta.url));
const iconsSpriteUrl = `${fileURLToPath(
  new URL("../../packages/ui/node_modules/@gitlab/svgs/dist/icons.svg", import.meta.url),
)}?url`;
const uiEntry = fileURLToPath(new URL("../../packages/ui/src/index.ts", import.meta.url));

export default defineConfig({
  output: "static",
  integrations: [react(), mdx()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@examples": examplesDirectory,
        "@gitlab/svgs/dist/icons.svg": iconsSpriteUrl,
        "gitlab-ui-react": uiEntry,
      },
    },
  },
});
