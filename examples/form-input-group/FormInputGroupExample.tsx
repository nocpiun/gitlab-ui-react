import { GlFormField, GlFormFieldLabel } from "gitlab-ui-react/form-field";
import { GlFormInput } from "gitlab-ui-react/form-input";
import {
  GlFormInputGroup,
  GlFormInputGroupAddon,
  GlInputGroupText,
} from "gitlab-ui-react/form-input-group";

export default function FormInputGroupExample() {
  return (
    <GlFormField className="max-w-md">
      <GlFormFieldLabel
        htmlFor="grouped-username"
        id="grouped-username-label">
        Username
      </GlFormFieldLabel>
      <GlFormInputGroup aria-labelledby="grouped-username-label">
        <GlFormInputGroupAddon position="prepend">
          <GlInputGroupText id="grouped-username-prefix">@</GlInputGroupText>
        </GlFormInputGroupAddon>
        <GlFormInput
          aria-describedby="grouped-username-prefix"
          defaultValue="NriotHrreion"
          id="grouped-username" />
      </GlFormInputGroup>
    </GlFormField>
  );
}
