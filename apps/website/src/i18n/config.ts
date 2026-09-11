export const locales = ["en", "zh"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const languageTags: Record<Locale, string> = {
  en: "en",
  zh: "zh-CN",
};

export const localeLabels: Record<Locale, string> = {
  en: "English",
  zh: "简体中文",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}

export function localizedPath(locale: Locale, path = "/") {
  const normalizedPath = path.startsWith("/") ? path : "/" + path;

  if(locale === defaultLocale) return normalizedPath;
  return normalizedPath === "/" ? "/zh" : "/zh" + normalizedPath;
}

export function localeSwitchPath(
  locale: Locale,
  alternatePaths: Partial<Record<Locale, string>>,
) {
  const targetLocale = locale === defaultLocale ? "zh" : defaultLocale;
  return alternatePaths[targetLocale] ?? localizedPath(targetLocale);
}

export function localizedDocId(locale: Locale, id: string) {
  return id === "index" ? locale : locale + "/" + id;
}

export function normalizeDocId(id: string) {
  if(isLocale(id)) return "index";

  const [locale, ...segments] = id.split("/");

  if(!isLocale(locale) || segments.length === 0) {
    throw new Error("Invalid localized documentation id: " + id);
  }

  return segments.join("/");
}

export function localeFromDocId(id: string) {
  if(isLocale(id)) return id;

  const [locale] = id.split("/");

  if(!isLocale(locale)) {
    throw new Error("Invalid localized documentation id: " + id);
  }

  return locale;
}

export function docPath(locale: Locale, id: string) {
  return localizedPath(locale, id === "index" ? "/docs" : "/docs/" + id);
}

export function formatTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll("{" + key + "}", String(value)),
    template,
  );
}
