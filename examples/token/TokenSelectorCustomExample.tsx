import { GlFormField, GlFormFieldLabel } from "gitlab-ui-react/form-field";
import { GlTokenSelector } from "gitlab-ui-react/token-selector";

export default function TokenSelectorCustomExample() {
  return (
    <GlFormField className="max-w-lg">
      <GlFormFieldLabel htmlFor="custom-topics">Custom topics</GlFormFieldLabel>
      <GlTokenSelector
        allowUserDefinedTokens
        id="custom-topics"
        items={[]}
        placeholder="Enter a topic"
        renderToken={(item) => <span>{item.name}</span>}
        renderUserDefinedToken={(inputValue) => <span>Add “{inputValue}”</span>} />
    </GlFormField>
  );
}
