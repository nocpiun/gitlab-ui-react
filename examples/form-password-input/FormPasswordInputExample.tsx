import { GlFormField, GlFormFieldLabel } from "gitlab-ui-react/form-field";
import { GlFormPasswordInput } from "gitlab-ui-react/form-password-input";

export default function FormPasswordInputExample() {
  return (
    <GlFormField className="max-w-md">
      <GlFormFieldLabel htmlFor="password">
        Password
      </GlFormFieldLabel>
      <GlFormPasswordInput
        autoComplete="current-password"
        defaultValue="example-password"
        id="password" />
    </GlFormField>
  );
}
