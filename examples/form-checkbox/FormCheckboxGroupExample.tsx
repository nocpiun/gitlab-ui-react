import {
  GlFormCheckbox,
  GlFormCheckboxGroup,
} from "gitlab-ui-react/form-checkbox";

export default function FormCheckboxGroupExample() {
  return (
    <fieldset>
      <legend id="notification-channels" className="mb-4 font-bold">
        Notification channels
      </legend>
      <GlFormCheckboxGroup
        aria-labelledby="notification-channels"
        defaultValue={["email"]}
        name="notification-channels">
        <GlFormCheckbox value="email">Email</GlFormCheckbox>
        <GlFormCheckbox value="browser">Browser</GlFormCheckbox>
        <GlFormCheckbox value="mobile">Mobile</GlFormCheckbox>
      </GlFormCheckboxGroup>
    </fieldset>
  );
}
