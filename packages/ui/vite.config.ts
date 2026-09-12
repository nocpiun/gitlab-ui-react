import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const componentsDirectory = fileURLToPath(new URL("./src/base", import.meta.url));
const componentEntries = Object.fromEntries(
  readdirSync(componentsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name, "en"))
    .map((entry) => [entry.name, path.join(componentsDirectory, entry.name, "index.ts")]),
);

export default defineConfig({
  build: {
    minify: true,
    lib: {
      entry: componentEntries,
      formats: ["es", "cjs"],
      fileName: (format, entryName) => `${entryName}/index.${format === "es" ? "js" : "cjs"}`,
    },
    rolldownOptions: {
      output: {
        minify: true,
      },
      external: [
        /^@base-ui\/react(?:\/.*)?$/,
        "class-variance-authority",
        "dompurify",
        "react",
        "react-dom",
        "react/jsx-runtime",
        "emoji-regex",
      ],
    },
  },
});
