import {
  GlFormField,
  GlFormFieldDescription,
  GlFormFieldGroup,
  GlFormFieldLabel,
} from "gitlab-ui-react/form-field";
import { GlFormInput } from "gitlab-ui-react/form-input";
import { GlFormSelect, GlFormSelectItem } from "gitlab-ui-react/form-select";

export default function FormFieldGroupExample() {
  return (
    <GlFormFieldGroup className="max-w-lg">
      <GlFormField aria-labelledby="field-profile-name-label">
        <GlFormFieldLabel
          htmlFor="field-profile-name"
          id="field-profile-name-label">
          Full name
        </GlFormFieldLabel>
        <GlFormInput id="field-profile-name" name="name" />
      </GlFormField>
      <GlFormField aria-labelledby="field-profile-username-label">
        <GlFormFieldLabel
          htmlFor="field-profile-username"
          id="field-profile-username-label">
          Username <span className="optional-label">(optional)</span>
          <span className="label-description">Used in your profile URL.</span>
        </GlFormFieldLabel>
        <GlFormInput
          aria-describedby="field-profile-username-description"
          id="field-profile-username"
          name="username" />
        <GlFormFieldDescription id="field-profile-username-description">
          You can change this later.
        </GlFormFieldDescription>
      </GlFormField>
      <GlFormField aria-labelledby="field-profile-role-label">
        <GlFormFieldLabel
          htmlFor="field-profile-role"
          id="field-profile-role-label">
          Role
        </GlFormFieldLabel>
        <GlFormSelect
          defaultValue="developer"
          id="field-profile-role"
          name="role">
          <GlFormSelectItem value="developer">Developer</GlFormSelectItem>
          <GlFormSelectItem value="maintainer">Maintainer</GlFormSelectItem>
        </GlFormSelect>
      </GlFormField>
    </GlFormFieldGroup>
  );
}
