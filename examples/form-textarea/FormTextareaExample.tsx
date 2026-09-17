import { GlFormField, GlFormFieldLabel } from "gitlab-ui-react/form-field";
import { GlFormTextarea } from "gitlab-ui-react/form-textarea";

export default function FormTextareaExample() {
  return (
    <GlFormField className="max-w-lg">
      <GlFormFieldLabel htmlFor="description">
        Description
      </GlFormFieldLabel>
      <GlFormTextarea
        defaultValue="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
        id="description" />
    </GlFormField>
  );
}
