/// <reference types="astro/client" />
/// <reference types="webmcp-types" />

interface ImportMetaEnv {
  readonly PUBLIC_WEBMCP_ORIGIN_TRIAL_TOKEN?: string;
}

declare module "@gitlab-ui-react/styles";

declare module "@gitlab-ui-react/tokens/dist/tailwind/tokens.cjs" {
  import type { Config } from "tailwindcss";

  const theme: Config["theme"];

  export = theme;
}
