import {
  GlFormField,
  GlFormFieldGroup,
  GlFormFieldLabel,
} from "gitlab-ui-react/form-field";
import { GlFormInput } from "gitlab-ui-react/form-input";

export default function FormInputTypesExample() {
  return (
    <GlFormFieldGroup className="max-w-md">
      <GlFormField>
        <GlFormFieldLabel htmlFor="email">Email</GlFormFieldLabel>
        <GlFormInput id="email" placeholder="name@example.com" type="email" />
      </GlFormField>
      <GlFormField>
        <GlFormFieldLabel htmlFor="maximum-results">
          Maximum results
        </GlFormFieldLabel>
        <GlFormInput
          defaultValue={20}
          id="maximum-results"
          min={1}
          number
          type="number" />
      </GlFormField>
    </GlFormFieldGroup>
  );
}
