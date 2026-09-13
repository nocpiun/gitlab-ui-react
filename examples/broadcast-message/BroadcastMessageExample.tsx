import { GlBroadcastMessage } from "gitlab-ui-react/broadcast-message";

export default function BroadcastMessageExample() {
  return (
    <GlBroadcastMessage dismissible={false}>
      OPanel maintenance is scheduled for Sunday from 02:00 to 03:00 UTC.
    </GlBroadcastMessage>
  );
}
