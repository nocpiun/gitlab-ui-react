import { GlTab, GlTabs } from "gitlab-ui-react/tabs";

export default function TabsJustifiedExample() {
  return (
    <GlTabs justified>
      <GlTab title="Overview">Overview panel</GlTab>
      <GlTab title="Activity">Activity panel</GlTab>
      <GlTab title="Members">Members panel</GlTab>
    </GlTabs>
  );
}
