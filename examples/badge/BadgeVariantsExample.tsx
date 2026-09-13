import { GlBadge } from "gitlab-ui-react/badge";

export default function BadgeVariantsExample() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <GlBadge variant="neutral">Neutral</GlBadge>
      <GlBadge variant="info">Running</GlBadge>
      <GlBadge variant="success">Passed</GlBadge>
      <GlBadge variant="warning">Pending</GlBadge>
      <GlBadge variant="danger">Failed</GlBadge>
      <GlBadge variant="tier">Ultimate</GlBadge>
    </div>
  );
}
