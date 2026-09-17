import { GlFormField, GlFormFieldLabel } from "gitlab-ui-react/form-field";
import {
  GlFormSelect,
  GlFormSelectItem,
} from "gitlab-ui-react/form-select";

export default function FormSelectExample() {
  return (
    <GlFormField className="max-w-sm">
      <GlFormFieldLabel htmlFor="project">
        Project
      </GlFormFieldLabel>
      <GlFormSelect defaultValue="opanel" id="project">
        <GlFormSelectItem value="opanel">OPanel</GlFormSelectItem>
        <GlFormSelectItem value="documentation">Documentation</GlFormSelectItem>
        <GlFormSelectItem value="website">Website</GlFormSelectItem>
      </GlFormSelect>
    </GlFormField>
  );
}
