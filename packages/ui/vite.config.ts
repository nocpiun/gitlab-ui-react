import { defineConfig } from "vite";

export default defineConfig({
  build: {
    minify: true,
    lib: {
      entry: "src/index.ts",
      formats: ["es", "cjs"],
      fileName: (format) => format === "es" ? "index.js" : "index.cjs",
    },
    rolldownOptions: {
      output: {
        minify: true,
      },
      external: [
        /^@base-ui\/react(?:\/.*)?$/,
        "class-variance-authority",
        "react",
        "react-dom",
        "react/jsx-runtime",
        /^@gitlab\/svgs(?:\/.*)?$/,
      ],
    },
  },
});
