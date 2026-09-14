import { GlTab, GlTabs } from "gitlab-ui-react/tabs";

export default function TabsCountsExample() {
  return (
    <GlTabs>
      <GlTab tabCount={42} tabCountSrText="42 issues" title="All">
        <p>All issues</p>
      </GlTab>
      <GlTab tabCount={15} tabCountSrText="15 open issues" title="Open">
        <p>Open issues</p>
      </GlTab>
      <GlTab disabled title="Closed">
        <p>Closed issues</p>
      </GlTab>
    </GlTabs>
  );
}
