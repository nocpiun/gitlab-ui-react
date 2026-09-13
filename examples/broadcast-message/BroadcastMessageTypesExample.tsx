import { useState } from "react";
import { GlBroadcastMessage } from "gitlab-ui-react/broadcast-message";
import { GlButton } from "gitlab-ui-react/button";

export default function BroadcastMessageTypesExample() {
  const [notificationVisible, setNotificationVisible] = useState(true);

  return (
    <div className="grid gap-3">
      <GlBroadcastMessage dismissible={false} type="banner">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </GlBroadcastMessage>
      {notificationVisible ? (
        <GlBroadcastMessage
          onDismiss={() => setNotificationVisible(false)}
          type="notification">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </GlBroadcastMessage>
      ) : (
        <GlButton onClick={() => setNotificationVisible(true)}>
          Show notification again
        </GlButton>
      )}
    </div>
  );
}
