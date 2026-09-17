import {
  GlFormField,
  GlFormFieldDescription,
  GlFormFieldLabel,
} from "gitlab-ui-react/form-field";
import { GlFormInput } from "gitlab-ui-react/form-input";

export default function FormFieldExample() {
  return (
    <GlFormField aria-labelledby="field-username-label" className="max-w-lg">
      <GlFormFieldLabel htmlFor="field-username" id="field-username-label">
        Username
      </GlFormFieldLabel>
      <GlFormInput
        aria-describedby="field-username-description"
        defaultValue="NriotHrreion"
        id="field-username"
        name="username" />
      <GlFormFieldDescription id="field-username-description">
        Used in your profile URL.
      </GlFormFieldDescription>
    </GlFormField>
  );
}
