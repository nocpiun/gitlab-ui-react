import { GlFormRadio } from "gitlab-ui-react/form-radio";
import { GlFormRadioGroup } from "gitlab-ui-react/form-radio-group";

export default function FormRadioExample() {
  return (
    <fieldset>
      <legend id="visibility-options" className="mb-4 font-bold">
        Visibility
      </legend>
      <GlFormRadioGroup
        aria-labelledby="visibility-options"
        defaultValue="private"
        name="visibility">
        <GlFormRadio value="private">Private</GlFormRadio>
        <GlFormRadio value="internal">Internal</GlFormRadio>
        <GlFormRadio value="public">Public</GlFormRadio>
      </GlFormRadioGroup>
    </fieldset>
  );
}
