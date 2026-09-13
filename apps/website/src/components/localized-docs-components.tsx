import type { ComponentProps } from "react";
import { DocsCallout } from "./docs-callout";
import { type Locale } from "../i18n/config";

export function localizedDocsComponents(locale: Locale) {
  function LocalizedDocsCallout(props: Omit<ComponentProps<typeof DocsCallout>, "locale">) {
    return <DocsCallout {...props} locale={locale} />;
  }

  return {
    DocsCallout: LocalizedDocsCallout,
  };
}
