import { GlFormField, GlFormFieldLabel } from "gitlab-ui-react/form-field";
import {
  GlFormSelect,
  GlFormSelectGroup,
  GlFormSelectItem,
} from "gitlab-ui-react/form-select";

export default function FormSelectGroupsExample() {
  return (
    <GlFormField className="max-w-sm">
      <GlFormFieldLabel htmlFor="destination">
        Destination
      </GlFormFieldLabel>
      <GlFormSelect id="destination">
        <GlFormSelectGroup label="Recent projects">
          <GlFormSelectItem value="opanel">OPanel</GlFormSelectItem>
          <GlFormSelectItem value="documentation">Documentation</GlFormSelectItem>
        </GlFormSelectGroup>
        <GlFormSelectGroup label="Organizations">
          <GlFormSelectItem value="nocpiun">Nocpiun</GlFormSelectItem>
        </GlFormSelectGroup>
      </GlFormSelect>
    </GlFormField>
  );
}
