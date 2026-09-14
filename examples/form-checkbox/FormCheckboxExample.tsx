import { GlFormCheckbox } from "gitlab-ui-react/form-checkbox";

export default function FormCheckboxExample() {
  return (
    <GlFormCheckbox defaultChecked value="notifications">
      Receive notifications
    </GlFormCheckbox>
  );
}
