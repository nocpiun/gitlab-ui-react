/// <reference types="astro/client" />

declare module "@gitlab-ui-react/styles";

declare module "@gitlab-ui-react/tokens/dist/tailwind/tokens.cjs" {
  import type { Config } from "tailwindcss";

  const theme: Config["theme"];

  export = theme;
}
