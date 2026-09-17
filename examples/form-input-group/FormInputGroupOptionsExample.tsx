import { useState } from "react";
import { GlFormInput } from "gitlab-ui-react/form-input";
import {
  GlFormInputGroup,
  GlFormInputGroupAddon,
} from "gitlab-ui-react/form-input-group";
import {
  GlListbox,
  GlListboxContent,
  GlListboxItem,
  GlListboxTrigger,
  type GlListboxValue,
} from "gitlab-ui-react/listbox";

export default function FormInputGroupOptionsExample() {
  const [value, setValue] = useState<GlListboxValue>("https://embed.example");

  return (
    <div className="max-w-md">
      <label
        className="mb-2 block font-bold"
        htmlFor="grouped-selected-url"
        id="grouped-selected-url-label">
        Selected URL
      </label>
      <GlFormInputGroup aria-labelledby="grouped-selected-url-label">
        <GlFormInputGroupAddon position="prepend">
          <GlListbox value={value} onValueChange={setValue}>
            <GlListboxTrigger>
              {value === "https://embed.example" ? "Embed" : "Share"}
            </GlListboxTrigger>
            <GlListboxContent aria-label="URL type">
              <GlListboxItem value="https://embed.example">Embed</GlListboxItem>
              <GlListboxItem value="https://share.example">Share</GlListboxItem>
            </GlListboxContent>
          </GlListbox>
        </GlFormInputGroupAddon>
        <GlFormInput
          id="grouped-selected-url"
          onClick={(event) => event.currentTarget.select()}
          readOnly
          value={value ?? ""} />
      </GlFormInputGroup>
    </div>
  );
}
