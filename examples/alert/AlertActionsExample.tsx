import {
  GlAlert,
  GlAlertActions,
  GlAlertDescription,
} from "gitlab-ui-react/alert";
import { GlButton } from "gitlab-ui-react/button";

export default function AlertActionsExample() {
  return (
    <GlAlert dismissible={false} title="Deployment failed" variant="danger">
      <GlAlertDescription>
        Check the failed job before starting another deployment.
      </GlAlertDescription>
      <GlAlertActions>
        <GlButton variant="confirm">Retry deployment</GlButton>
        <GlButton category="secondary">View job log</GlButton>
      </GlAlertActions>
    </GlAlert>
  );
}
