import type { Locale } from "./i18n/config";

const docsSearchInstances = {
  en: "docs-search-en",
  zh: "docs-search-zh",
} as const satisfies Record<Locale, string>;

export type DocsSearchInstance = (typeof docsSearchInstances)[Locale];

export function docsSearchInstance(locale: Locale): DocsSearchInstance {
  return docsSearchInstances[locale];
}
