import { useState } from "react";
import {
  GlAlert,
  GlAlertDescription,
} from "gitlab-ui-react/alert";
import { GlButton } from "gitlab-ui-react/button";

export default function AlertExample() {
  const [visible, setVisible] = useState(true);

  if(!visible) {
    return <GlButton onClick={() => setVisible(true)}>Show alert again</GlButton>;
  }

  return (
    <GlAlert onDismiss={() => setVisible(false)}>
      <GlAlertDescription>
        Your preferences were updated and will apply to new projects.
      </GlAlertDescription>
    </GlAlert>
  );
}
