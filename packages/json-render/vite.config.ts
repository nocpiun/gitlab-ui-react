import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const sourceDirectory = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  build: {
    minify: true,
    lib: {
      entry: {
        catalog: path.join(sourceDirectory, "catalog.ts"),
        index: path.join(sourceDirectory, "index.ts"),
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) => `${entryName}.${format === "es" ? "js" : "cjs"}`,
    },
    rolldownOptions: {
      external: [
        /^@json-render\/(?:core|react)(?:\/.*)?$/,
        /^gitlab-ui-react(?:\/.*)?$/,
        "react",
        "react/jsx-runtime",
        "zod",
      ],
      output: {
        minify: true,
      },
    },
  },
});
