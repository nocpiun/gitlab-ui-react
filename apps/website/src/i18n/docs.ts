import type { CollectionEntry } from "astro:content";
import {
  docPath,
  localizedDocId,
  locales,
  normalizeDocId,
  type Locale,
} from "./config";

type DocsEntry = CollectionEntry<"docs">;

export function docsEntriesForLocale(entries: DocsEntry[], locale: Locale) {
  return entries.filter((entry) => (
    entry.id === locale || entry.id.startsWith(locale + "/")
  ));
}

export function docsAlternatePaths(entries: DocsEntry[], id: string) {
  return Object.fromEntries(
    locales.flatMap((locale) => (
      entries.some((entry) => entry.id === localizedDocId(locale, id))
        ? [[locale, docPath(locale, id)]]
        : []
    )),
  ) as Partial<Record<Locale, string>>;
}

export function docsStaticPaths(entries: DocsEntry[], locale: Locale) {
  return docsEntriesForLocale(entries, locale).map((entry) => {
    const id = normalizeDocId(entry.id);

    return {
      params: {
        slug: id === "index" ? undefined : id,
      },
      props: {
        alternatePaths: docsAlternatePaths(entries, id),
        currentId: id,
        entry,
      },
    };
  });
}
