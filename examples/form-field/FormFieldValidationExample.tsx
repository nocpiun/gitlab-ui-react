import {
  GlFormField,
  GlFormFieldDescription,
  GlFormFieldError,
  GlFormFieldGroup,
  GlFormFieldLabel,
  GlFormFieldLegend,
  GlFormFieldSet,
} from "gitlab-ui-react/form-field";
import { GlFormInput } from "gitlab-ui-react/form-input";
import { GlFormRadio } from "gitlab-ui-react/form-radio";
import { GlFormRadioGroup } from "gitlab-ui-react/form-radio-group";

export default function FormFieldValidationExample() {
  return (
    <GlFormFieldGroup className="max-w-lg">
      <GlFormField aria-labelledby="field-project-name-label">
        <GlFormFieldLabel
          htmlFor="field-project-name"
          id="field-project-name-label">
          Project name
        </GlFormFieldLabel>
        <GlFormInput
          defaultValue="OPanel"
          id="field-project-name"
          name="projectName" />
      </GlFormField>
      <GlFormFieldSet>
        <GlFormFieldLegend>Visibility</GlFormFieldLegend>
        <GlFormFieldDescription
          className="mb-4"
          id="field-visibility-description">
          Choose who can discover and view the project.
        </GlFormFieldDescription>
        <GlFormRadioGroup
          aria-label="Visibility"
          defaultValue="private"
          name="field-visibility">
          <GlFormRadio
            aria-describedby="field-visibility-description"
            value="private">
            Private
          </GlFormRadio>
          <GlFormRadio
            aria-describedby="field-visibility-description"
            value="internal">
            Internal
          </GlFormRadio>
          <GlFormRadio
            aria-describedby="field-visibility-description"
            value="public">
            Public
          </GlFormRadio>
        </GlFormRadioGroup>
      </GlFormFieldSet>
      <GlFormField aria-labelledby="field-project-path-label">
        <GlFormFieldLabel
          htmlFor="field-project-path"
          id="field-project-path-label">
          Project path
        </GlFormFieldLabel>
        <GlFormInput
          aria-describedby="field-project-path-error"
          id="field-project-path"
          name="projectPath"
          state={false} />
        <GlFormFieldError id="field-project-path-error">
          This path is already in use.
        </GlFormFieldError>
      </GlFormField>
    </GlFormFieldGroup>
  );
}
