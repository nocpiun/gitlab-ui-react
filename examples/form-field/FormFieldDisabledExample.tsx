import { GlFormCheckbox } from "gitlab-ui-react/form-checkbox";
import {
  GlFormField,
  GlFormFieldGroup,
  GlFormFieldLabel,
  GlFormFieldLegend,
  GlFormFieldSet,
} from "gitlab-ui-react/form-field";
import { GlFormInput } from "gitlab-ui-react/form-input";

export default function FormFieldDisabledExample() {
  return (
    <GlFormFieldSet className="max-w-lg" disabled>
      <GlFormFieldLegend>Disabled preferences</GlFormFieldLegend>
      <GlFormFieldGroup>
        <GlFormField aria-labelledby="field-disabled-name-label">
          <GlFormFieldLabel
            htmlFor="field-disabled-name"
            id="field-disabled-name-label">
            Display name
          </GlFormFieldLabel>
          <GlFormInput
            defaultValue="Norcleeh"
            id="field-disabled-name"
            name="displayName" />
        </GlFormField>
        <GlFormField aria-label="Product updates">
          <GlFormCheckbox name="updates">Product updates</GlFormCheckbox>
        </GlFormField>
      </GlFormFieldGroup>
    </GlFormFieldSet>
  );
}
