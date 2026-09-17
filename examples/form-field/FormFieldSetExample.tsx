import {
  GlFormField,
  GlFormFieldDescription,
  GlFormFieldGroup,
  GlFormFieldLabel,
  GlFormFieldLegend,
  GlFormFieldSet,
} from "gitlab-ui-react/form-field";
import { GlFormInput } from "gitlab-ui-react/form-input";

export default function FormFieldSetExample() {
  return (
    <GlFormFieldSet
      aria-describedby="field-address-description"
      className="max-w-lg">
      <GlFormFieldLegend>Address information</GlFormFieldLegend>
      <GlFormFieldDescription
        className="mb-4"
        id="field-address-description">
        Used for billing and account recovery.
      </GlFormFieldDescription>
      <GlFormFieldGroup>
        <GlFormField aria-labelledby="field-street-label">
          <GlFormFieldLabel htmlFor="field-street" id="field-street-label">
            Street
          </GlFormFieldLabel>
          <GlFormInput id="field-street" name="street" />
        </GlFormField>
        <GlFormField aria-labelledby="field-city-label">
          <GlFormFieldLabel htmlFor="field-city" id="field-city-label">
            City
          </GlFormFieldLabel>
          <GlFormInput id="field-city" name="city" />
        </GlFormField>
        <GlFormField aria-labelledby="field-postal-code-label">
          <GlFormFieldLabel
            htmlFor="field-postal-code"
            id="field-postal-code-label">
            Postal code
          </GlFormFieldLabel>
          <GlFormInput id="field-postal-code" name="postalCode" />
        </GlFormField>
      </GlFormFieldGroup>
    </GlFormFieldSet>
  );
}
