import { defineConfig } from "vite";
import postcssConfig from "../../packages/styles/postcss.config.mjs";

export default defineConfig({
  css: {
    postcss: postcssConfig,
  },
});
