import { useState } from "react";
import { GlBroadcastMessage } from "gitlab-ui-react/broadcast-message";
import { GlButton } from "gitlab-ui-react/button";

export default function BroadcastMessageTypesExample() {
  const [notificationVisible, setNotificationVisible] = useState(true);

  return (
    <div className="grid gap-3">
      <GlBroadcastMessage dismissible={false} type="banner">
        This instance will be read-only during scheduled maintenance.
      </GlBroadcastMessage>
      {notificationVisible ? (
        <GlBroadcastMessage
          onDismiss={() => setNotificationVisible(false)}
          type="notification">
          A new version of OPanel is available.
        </GlBroadcastMessage>
      ) : (
        <GlButton onClick={() => setNotificationVisible(true)}>
          Show notification again
        </GlButton>
      )}
    </div>
  );
}
