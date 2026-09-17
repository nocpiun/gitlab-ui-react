import {
  GlFormFieldLegend,
  GlFormFieldSet,
} from "gitlab-ui-react/form-field";
import { GlFormRadio } from "gitlab-ui-react/form-radio";
import { GlFormRadioGroup } from "gitlab-ui-react/form-radio-group";

export default function FormRadioExample() {
  return (
    <GlFormFieldSet>
      <GlFormFieldLegend id="visibility-options">
        Visibility
      </GlFormFieldLegend>
      <GlFormRadioGroup
        aria-label="Visibility"
        defaultValue="private"
        name="visibility">
        <GlFormRadio value="private">Private</GlFormRadio>
        <GlFormRadio value="internal">Internal</GlFormRadio>
        <GlFormRadio value="public">Public</GlFormRadio>
      </GlFormRadioGroup>
    </GlFormFieldSet>
  );
}
