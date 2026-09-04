import postcssNested from "postcss-nested";

import gitlabTailwind from "./scripts/postcss-gitlab-tailwind.mjs";

/** @internal */
export function createPostcssPlugins(tailwindOptions) {
  return [gitlabTailwind(tailwindOptions), postcssNested()];
}

export default {
  plugins: createPostcssPlugins(),
};
