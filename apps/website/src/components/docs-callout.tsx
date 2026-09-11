import type { ReactNode } from "react";
import {
  GlAlert,
  GlAlertDescription,
  type GlAlertVariant,
} from "gitlab-ui-react";
import { type Locale } from "../i18n/config";
import { siteMessages, type CalloutKind } from "../i18n/messages";

export type DocsCalloutProps = {
  children?: ReactNode;
  kind: CalloutKind;
  locale: Locale;
  variant: GlAlertVariant;
};

export function DocsCallout({ children, kind, locale, variant }: DocsCalloutProps) {
  return (
    <GlAlert
      className="docs-callout"
      dismissible={false}
      headerLevel={3}
      politeness="off"
      title={siteMessages[locale].docs.callouts[kind]}
      variant={variant}>
      <GlAlertDescription>{children}</GlAlertDescription>
    </GlAlert>
  );
}
