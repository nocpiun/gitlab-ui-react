import { GlFormField, GlFormFieldLabel } from "gitlab-ui-react/form-field";
import { GlFormDate } from "gitlab-ui-react/form-date";

export default function FormDateExample() {
  return (
    <GlFormField className="max-w-xs">
      <GlFormFieldLabel htmlFor="due-date">
        Due date
      </GlFormFieldLabel>
      <GlFormDate id="due-date" />
    </GlFormField>
  );
}
