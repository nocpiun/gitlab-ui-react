import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es", "cjs"],
      fileName: (format) => format === "es" ? "index.js" : "index.cjs",
    },
    rollupOptions: {
      external: [
        "class-variance-authority",
        "react",
        "react-dom",
        "react/jsx-runtime",
        /^@gitlab\/svgs(?:\/.*)?$/,
      ],
    },
  },
});
