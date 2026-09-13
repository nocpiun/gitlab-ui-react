import { GlBroadcastMessage } from "gitlab-ui-react/broadcast-message";

export default function BroadcastMessageThemesExample() {
  return (
    <div className="grid gap-3">
      <GlBroadcastMessage dismissible={false} theme="indigo">Indigo theme</GlBroadcastMessage>
      <GlBroadcastMessage dismissible={false} theme="blue">Blue theme</GlBroadcastMessage>
      <GlBroadcastMessage dismissible={false} theme="green">Green theme</GlBroadcastMessage>
      <GlBroadcastMessage dismissible={false} theme="red">Red theme</GlBroadcastMessage>
    </div>
  );
}
