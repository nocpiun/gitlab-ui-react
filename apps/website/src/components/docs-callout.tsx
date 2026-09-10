import type { ReactNode } from "react";
import {
  GlAlert,
  GlAlertDescription,
  type GlAlertVariant,
} from "gitlab-ui-react";

type DocsCalloutProps = {
  children?: ReactNode;
  title: string;
  variant: GlAlertVariant;
};

export function DocsCallout({ children, title, variant }: DocsCalloutProps) {
  return (
    <GlAlert
      className="docs-callout"
      dismissible={false}
      headerLevel={3}
      politeness="off"
      title={title}
      variant={variant}>
      <GlAlertDescription>{children}</GlAlertDescription>
    </GlAlert>
  );
}
