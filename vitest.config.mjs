import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, mergeConfig } from "vitest/config";
import storybookViteConfig from "./apps/storybook/vite.config.ts";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
  storybookViteConfig,
  defineConfig({
    test: {
      projects: [
        {
          test: {
            name: "unit",
            environment: "node",
            include: [
              "packages/**/*.{test,spec}.{js,jsx,mjs,cjs,ts,tsx,mts,cts}",
              "apps/**/*.{test,spec}.{js,jsx,mjs,cjs,ts,tsx,mts,cts}",
              "oxlint-plugins/**/*.{test,spec}.{js,jsx,mjs,cjs,ts,tsx,mts,cts}",
            ],
          },
        },
        {
          extends: true,
          plugins: [
            storybookTest({
              configDir: path.join(dirname, "apps/storybook"),
              storybookScript: "pnpm storybook --no-open",
              tags: {
                include: ["test"],
                exclude: [],
                skip: [],
              },
            }),
          ],
          test: {
            name: "storybook",
            root: path.join(dirname, "apps"),
            browser: {
              enabled: true,
              headless: true,
              provider: playwright({}),
              instances: [{ browser: "chromium" }],
            },
          },
        },
      ],
    },
  }),
);
