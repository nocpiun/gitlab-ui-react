import type { Preview } from "@storybook/react-vite";
import { withThemeByClassName } from "@storybook/addon-themes";
import "../../packages/styles/src/index.css";
import "./preview.css";

const preview: Preview = {
  decorators: [
    withThemeByClassName({
      themes: {
        light: "",
        dark: "gl-dark",
      },
      defaultTheme: "light",
    }),
  ],
  parameters: {
    a11y: {
      // Base UI's focus guards are deliberately focusable sentinels hidden from
      // assistive technology. Axe cannot infer their focus-management behavior.
      context: { exclude: ["[data-base-ui-focus-guard]"] },
      test: "error",
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  tags: ["autodocs"],
};

export default preview;
