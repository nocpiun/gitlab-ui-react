import { useState } from "react";
import { GlFormField, GlFormFieldLabel } from "gitlab-ui-react/form-field";
import {
  GlTokenSelector,
  type GlTokenSelectorItem,
} from "gitlab-ui-react/token-selector";

const availableItems: GlTokenSelectorItem[] = [
  { id: "norcleeh", name: "Norcleeh" },
  { id: "nriothrreion", name: "NriotHrreion" },
  { id: "nocpiun", name: "Nocpiun" },
];

export default function TokenSelectorExample() {
  const [query, setQuery] = useState("");
  const [value, setValue] = useState<GlTokenSelectorItem[]>([availableItems[0]]);
  const items = availableItems.filter((item) => (
    item.name?.toLocaleLowerCase().includes(query.toLocaleLowerCase())
  ));

  return (
    <GlFormField className="max-w-lg">
      <GlFormFieldLabel htmlFor="reviewers">Reviewers</GlFormFieldLabel>
      <GlTokenSelector
        allowClearAll
        id="reviewers"
        items={items}
        onInputValueChange={setQuery}
        onValueChange={setValue}
        placeholder="Search users"
        value={value} />
    </GlFormField>
  );
}
