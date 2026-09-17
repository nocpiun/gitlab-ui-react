import { GlFormCheckbox } from "gitlab-ui-react/form-checkbox";
import {
  GlFormField,
  GlFormFieldGroup,
  GlFormFieldLabel,
  GlFormFieldLegend,
  GlFormFieldSet,
} from "gitlab-ui-react/form-field";
import { GlFormInput } from "gitlab-ui-react/form-input";
import { GlFormSelect, GlFormSelectItem } from "gitlab-ui-react/form-select";

export default function FormFieldSetsExample() {
  return (
    <GlFormFieldGroup className="max-w-lg">
      <GlFormFieldSet>
        <GlFormFieldLegend>Account</GlFormFieldLegend>
        <GlFormFieldGroup>
          <GlFormField aria-labelledby="field-account-email-label">
            <GlFormFieldLabel
              htmlFor="field-account-email"
              id="field-account-email-label">
              Email
            </GlFormFieldLabel>
            <GlFormInput id="field-account-email" name="email" type="email" />
          </GlFormField>
          <GlFormField aria-labelledby="field-account-timezone-label">
            <GlFormFieldLabel
              htmlFor="field-account-timezone"
              id="field-account-timezone-label">
              Timezone
            </GlFormFieldLabel>
            <GlFormSelect
              defaultValue="utc"
              id="field-account-timezone"
              name="timezone">
              <GlFormSelectItem value="utc">UTC</GlFormSelectItem>
              <GlFormSelectItem value="local">Local time</GlFormSelectItem>
            </GlFormSelect>
          </GlFormField>
        </GlFormFieldGroup>
      </GlFormFieldSet>
      <GlFormFieldSet>
        <GlFormFieldLegend>Notifications</GlFormFieldLegend>
        <GlFormFieldGroup>
          <GlFormField aria-label="Email notifications">
            <GlFormCheckbox name="emailNotifications">
              Email notifications
            </GlFormCheckbox>
          </GlFormField>
          <GlFormField aria-label="Browser notifications">
            <GlFormCheckbox name="browserNotifications">
              Browser notifications
            </GlFormCheckbox>
          </GlFormField>
        </GlFormFieldGroup>
      </GlFormFieldSet>
    </GlFormFieldGroup>
  );
}
