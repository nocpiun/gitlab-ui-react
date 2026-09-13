import { GlBadge } from "gitlab-ui-react/badge";

export default function BadgeLinkExample() {
  return (
    <GlBadge href="#pipeline" icon="status_success" variant="success">
      Pipeline passed
    </GlBadge>
  );
}
