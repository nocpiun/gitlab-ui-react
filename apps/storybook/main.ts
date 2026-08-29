import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../../packages/ui/src/**/*.stories.{ts,tsx,mdx}"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
    "@storybook/addon-vitest",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {
      builder: {
        viteConfigPath: "apps/storybook/vite.config.ts",
      },
    },
  },
  core: {
    disableTelemetry: true,
  },
};

export default config;
