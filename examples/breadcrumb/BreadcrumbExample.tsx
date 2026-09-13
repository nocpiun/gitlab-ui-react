import {
  GlBreadcrumb,
  GlBreadcrumbItem,
} from "gitlab-ui-react/breadcrumb";

export default function BreadcrumbExample() {
  return (
    <GlBreadcrumb>
      <GlBreadcrumbItem href="#nocpiun">Nocpiun</GlBreadcrumbItem>
      <GlBreadcrumbItem href="#opanel">OPanel</GlBreadcrumbItem>
      <GlBreadcrumbItem href="#issues">Issues</GlBreadcrumbItem>
      <GlBreadcrumbItem href="#issue-123">#123</GlBreadcrumbItem>
    </GlBreadcrumb>
  );
}
