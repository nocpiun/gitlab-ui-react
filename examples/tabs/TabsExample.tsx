import { GlTab, GlTabs } from "gitlab-ui-react/tabs";

export default function TabsExample() {
  return (
    <GlTabs>
      <GlTab title="Overview">
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
      </GlTab>
      <GlTab title="Issues">
        <p>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      </GlTab>
      <GlTab title="Members">
        <p>Norcleeh and @NriotHrreion are members of this project.</p>
      </GlTab>
    </GlTabs>
  );
}
