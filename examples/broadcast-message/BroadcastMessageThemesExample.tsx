import { GlBroadcastMessage } from "gitlab-ui-react/broadcast-message";

export default function BroadcastMessageThemesExample() {
  return (
    <div className="grid gap-3">
      <GlBroadcastMessage dismissible={false} theme="indigo">
        <strong>Indigo theme:</strong> Lorem ipsum dolor sit amet.
      </GlBroadcastMessage>
      <GlBroadcastMessage dismissible={false} theme="blue">
        <strong>Blue theme:</strong> Lorem ipsum dolor sit amet.
      </GlBroadcastMessage>
      <GlBroadcastMessage dismissible={false} theme="green">
        <strong>Green theme:</strong> Lorem ipsum dolor sit amet.
      </GlBroadcastMessage>
      <GlBroadcastMessage dismissible={false} theme="red">
        <strong>Red theme:</strong> Lorem ipsum dolor sit amet.
      </GlBroadcastMessage>
    </div>
  );
}
