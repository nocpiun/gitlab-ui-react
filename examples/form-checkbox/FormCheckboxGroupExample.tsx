import {
  GlFormFieldLegend,
  GlFormFieldSet,
} from "gitlab-ui-react/form-field";
import {
  GlFormCheckbox,
  GlFormCheckboxGroup,
} from "gitlab-ui-react/form-checkbox";

export default function FormCheckboxGroupExample() {
  return (
    <GlFormFieldSet>
      <GlFormFieldLegend id="notification-channels">
        Notification channels
      </GlFormFieldLegend>
      <GlFormCheckboxGroup
        aria-label="Notification channels"
        defaultValue={["email"]}
        name="notification-channels">
        <GlFormCheckbox value="email">Email</GlFormCheckbox>
        <GlFormCheckbox value="browser">Browser</GlFormCheckbox>
        <GlFormCheckbox value="mobile">Mobile</GlFormCheckbox>
      </GlFormCheckboxGroup>
    </GlFormFieldSet>
  );
}
