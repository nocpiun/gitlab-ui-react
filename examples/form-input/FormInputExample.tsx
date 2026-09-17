import { GlFormField, GlFormFieldLabel } from "gitlab-ui-react/form-field";
import { GlFormInput } from "gitlab-ui-react/form-input";

export default function FormInputExample() {
  return (
    <GlFormField className="max-w-md">
      <GlFormFieldLabel htmlFor="username">
        Username
      </GlFormFieldLabel>
      <GlFormInput defaultValue="Norcleeh" id="username" />
    </GlFormField>
  );
}
