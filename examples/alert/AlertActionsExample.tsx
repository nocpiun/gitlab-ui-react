import {
  GlAlert,
  GlAlertActions,
  GlAlertDescription,
} from "gitlab-ui-react/alert";
import { GlButton } from "gitlab-ui-react/button";

export default function AlertActionsExample() {
  return (
    <GlAlert dismissible={false} title="Pipeline could not start" variant="danger">
      <GlAlertDescription>
        Check the pipeline configuration, then try again.
      </GlAlertDescription>
      <GlAlertActions>
        <GlButton size="small" variant="confirm">
          Retry
        </GlButton>
        <GlButton category="secondary" size="small">
          View details
        </GlButton>
      </GlAlertActions>
    </GlAlert>
  );
}
