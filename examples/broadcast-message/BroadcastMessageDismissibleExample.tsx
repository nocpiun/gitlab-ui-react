import { useState } from "react";
import { GlBroadcastMessage } from "gitlab-ui-react/broadcast-message";
import { GlButton } from "gitlab-ui-react/button";

export default function BroadcastMessageDismissibleExample() {
  const [visible, setVisible] = useState(true);

  if(!visible) {
    return <GlButton onClick={() => setVisible(true)}>Show message again</GlButton>;
  }

  return (
    <GlBroadcastMessage onDismiss={() => setVisible(false)}>
      OPanel maintenance is scheduled for Sunday from 02:00 to 03:00 UTC.
    </GlBroadcastMessage>
  );
}
