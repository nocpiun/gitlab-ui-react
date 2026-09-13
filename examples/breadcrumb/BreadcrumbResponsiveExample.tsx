import {
  GlBreadcrumb,
  GlBreadcrumbItem,
} from "gitlab-ui-react/breadcrumb";

export default function BreadcrumbResponsiveExample() {
  return (
    <div className="max-w-72">
      <GlBreadcrumb>
        <GlBreadcrumbItem href="#nocpiun">Nocpiun</GlBreadcrumbItem>
        <GlBreadcrumbItem href="#opanel">OPanel</GlBreadcrumbItem>
        <GlBreadcrumbItem href="#repository">Repository</GlBreadcrumbItem>
        <GlBreadcrumbItem href="#branches">Branches</GlBreadcrumbItem>
        <GlBreadcrumbItem href="#main">main</GlBreadcrumbItem>
      </GlBreadcrumb>
    </div>
  );
}
