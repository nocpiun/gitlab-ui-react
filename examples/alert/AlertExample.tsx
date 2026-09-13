import { useState } from "react";
import { GlAlert, GlAlertDescription } from "gitlab-ui-react/alert";
import { GlButton } from "gitlab-ui-react/button";

export default function AlertExample() {
  const [visible, setVisible] = useState(true);

  if(!visible) {
    return <GlButton onClick={() => setVisible(true)}>Show alert</GlButton>;
  }

  return (
    <GlAlert onDismiss={() => setVisible(false)}>
      <GlAlertDescription>
        The project settings were updated.
      </GlAlertDescription>
    </GlAlert>
  );
}
