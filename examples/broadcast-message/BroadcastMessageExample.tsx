import { GlBroadcastMessage } from "gitlab-ui-react/broadcast-message";

export default function BroadcastMessageExample() {
  return (
    <GlBroadcastMessage dismissible={false}>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    </GlBroadcastMessage>
  );
}
