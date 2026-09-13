import { GlBadge } from "gitlab-ui-react/badge";

export default function BadgeIconsExample() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <GlBadge icon="issue-open-m" variant="success">Open</GlBadge>
      <GlBadge icon="issue-close" variant="info">Closed</GlBadge>
      <GlBadge aria-label="Scheduled" icon="calendar" variant="neutral" />
    </div>
  );
}
