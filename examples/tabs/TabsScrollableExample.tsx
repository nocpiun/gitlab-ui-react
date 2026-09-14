import { GlScrollableTabs, GlTab } from "gitlab-ui-react/tabs";

const tabs = Array.from({ length: 18 }, (_, index) => `Tab ${index + 1}`);

export default function TabsScrollableExample() {
  return (
    <div className="max-w-xl">
      <GlScrollableTabs>
        {tabs.map((title) => (
          <GlTab key={title} title={title}>
            <p>{title} content</p>
          </GlTab>
        ))}
      </GlScrollableTabs>
    </div>
  );
}
