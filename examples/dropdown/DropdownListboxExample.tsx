import { useState } from "react";
import {
  GlListbox,
  GlListboxContent,
  GlListboxGroup,
  GlListboxItem,
  GlListboxTrigger,
  type GlListboxValue,
} from "gitlab-ui-react/listbox";

const labels: Record<string, string> = {
  backend: "Backend",
  frontend: "Frontend",
  security: "Security",
};

export default function DropdownListboxExample() {
  const [value, setValue] = useState<GlListboxValue>("frontend");

  return (
    <GlListbox value={value} onValueChange={setValue}>
      <GlListboxTrigger>{value === null ? "Select a team" : labels[String(value)]}</GlListboxTrigger>
      <GlListboxContent aria-label="Team">
        <GlListboxGroup>
          <GlListboxItem value="frontend">Frontend</GlListboxItem>
          <GlListboxItem value="backend">Backend</GlListboxItem>
          <GlListboxItem value="security">Security</GlListboxItem>
        </GlListboxGroup>
      </GlListboxContent>
    </GlListbox>
  );
}
