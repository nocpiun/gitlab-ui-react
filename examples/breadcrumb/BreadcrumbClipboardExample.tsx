import {
  GlBreadcrumb,
  GlBreadcrumbItem,
} from "gitlab-ui-react/breadcrumb";

export default function BreadcrumbClipboardExample() {
  return (
    <GlBreadcrumb
      clipboardTooltipText="Copy project path"
      pathToCopy="Nocpiun/OPanel/Issues/#123"
      showClipboardButton>
      <GlBreadcrumbItem href="#nocpiun">Nocpiun</GlBreadcrumbItem>
      <GlBreadcrumbItem href="#opanel">OPanel</GlBreadcrumbItem>
      <GlBreadcrumbItem href="#issues">Issues</GlBreadcrumbItem>
      <GlBreadcrumbItem href="#issue-123">#123</GlBreadcrumbItem>
    </GlBreadcrumb>
  );
}
