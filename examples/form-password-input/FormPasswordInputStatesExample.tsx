import {
  GlFormField,
  GlFormFieldGroup,
  GlFormFieldLabel,
} from "gitlab-ui-react/form-field";
import { GlFormPasswordInput } from "gitlab-ui-react/form-password-input";

export default function FormPasswordInputStatesExample() {
  return (
    <GlFormFieldGroup className="max-w-md">
      <GlFormField>
        <GlFormFieldLabel htmlFor="read-only-token">
          Read-only access token
        </GlFormFieldLabel>
        <GlFormPasswordInput
          defaultValue="example-access-token"
          id="read-only-token"
          initialVisibility
          readOnly
          revealLabel="Reveal access token"
          hideLabel="Hide access token" />
      </GlFormField>
      <GlFormField>
        <GlFormFieldLabel htmlFor="disabled-password">
          Disabled password
        </GlFormFieldLabel>
        <GlFormPasswordInput
          defaultValue="example-password"
          disabled
          id="disabled-password" />
      </GlFormField>
    </GlFormFieldGroup>
  );
}
