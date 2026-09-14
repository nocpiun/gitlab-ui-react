import { GlTokenSelector } from "gitlab-ui-react/token-selector";

export default function TokenSelectorCustomExample() {
  return (
    <div className="max-w-lg">
      <label htmlFor="custom-topics">Custom topics</label>
      <GlTokenSelector
        allowUserDefinedTokens
        id="custom-topics"
        items={[]}
        placeholder="Enter a topic"
        renderToken={(item) => <span>{item.name}</span>}
        renderUserDefinedToken={(inputValue) => <span>Add “{inputValue}”</span>} />
    </div>
  );
}
