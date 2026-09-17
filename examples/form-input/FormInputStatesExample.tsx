import {
  GlFormField,
  GlFormFieldError,
  GlFormFieldGroup,
  GlFormFieldLabel,
} from "gitlab-ui-react/form-field";
import { GlFormInput } from "gitlab-ui-react/form-input";

export default function FormInputStatesExample() {
  return (
    <GlFormFieldGroup className="max-w-md">
      <GlFormField>
        <GlFormFieldLabel htmlFor="readonly-value">
          Read-only value
        </GlFormFieldLabel>
        <GlFormInput
          defaultValue="Read-only value"
          id="readonly-value"
          readOnly />
      </GlFormField>
      <GlFormField>
        <GlFormFieldLabel htmlFor="plaintext-value">
          Plain text value
        </GlFormFieldLabel>
        <GlFormInput
          defaultValue="Plain text value"
          id="plaintext-value"
          plaintext />
      </GlFormField>
      <GlFormField>
        <GlFormFieldLabel htmlFor="invalid-value">
          Invalid value
        </GlFormFieldLabel>
        <GlFormInput
          aria-describedby="invalid-value-message"
          defaultValue="Invalid value"
          id="invalid-value"
          state={false} />
        <GlFormFieldError id="invalid-value-message">
          Enter a supported value.
        </GlFormFieldError>
      </GlFormField>
      <GlFormField>
        <GlFormFieldLabel htmlFor="disabled-value">
          Disabled value
        </GlFormFieldLabel>
        <GlFormInput
          defaultValue="Disabled value"
          disabled
          id="disabled-value" />
      </GlFormField>
    </GlFormFieldGroup>
  );
}
