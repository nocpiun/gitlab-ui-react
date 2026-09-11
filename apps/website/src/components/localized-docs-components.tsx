import type { ComponentProps } from "react";
import { DocsCallout } from "./docs-callout";
import { DocsExample } from "./docs-example";
import { type Locale } from "../i18n/config";

export function localizedDocsComponents(locale: Locale) {
  function LocalizedDocsCallout(props: Omit<ComponentProps<typeof DocsCallout>, "locale">) {
    return <DocsCallout {...props} locale={locale} />;
  }

  function LocalizedDocsExample(props: Omit<ComponentProps<typeof DocsExample>, "locale">) {
    return <DocsExample {...props} locale={locale} />;
  }

  return {
    DocsCallout: LocalizedDocsCallout,
    DocsExample: LocalizedDocsExample,
  };
}
