import { useState } from "react";
import {
  GlListbox,
  GlListboxContent,
  GlListboxGroup,
  GlListboxItem,
  GlListboxTrigger,
  type GlListboxValue,
} from "gitlab-ui-react/listbox";

export default function DropdownMultipleExample() {
  const [value, setValue] = useState<GlListboxValue[]>(["frontend"]);

  return (
    <GlListbox multiple value={value} onValueChange={setValue}>
      <GlListboxTrigger>{value.length} teams selected</GlListboxTrigger>
      <GlListboxContent aria-label="Teams">
        <GlListboxGroup>
          <GlListboxItem value="frontend">Frontend</GlListboxItem>
          <GlListboxItem value="backend">Backend</GlListboxItem>
          <GlListboxItem value="security">Security</GlListboxItem>
        </GlListboxGroup>
      </GlListboxContent>
    </GlListbox>
  );
}
