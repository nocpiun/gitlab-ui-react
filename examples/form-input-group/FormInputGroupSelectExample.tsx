import { GlFormField, GlFormFieldLabel } from "gitlab-ui-react/form-field";
import {
  GlFormInputGroup,
  GlFormInputGroupAddon,
  GlInputGroupText,
} from "gitlab-ui-react/form-input-group";
import { GlFormSelect, GlFormSelectItem } from "gitlab-ui-react/form-select";

export default function FormInputGroupSelectExample() {
  return (
    <GlFormField className="max-w-md">
      <GlFormFieldLabel
        htmlFor="grouped-member-role"
        id="grouped-member-role-label">
        Member role
      </GlFormFieldLabel>
      <GlFormInputGroup aria-labelledby="grouped-member-role-label">
        <GlFormInputGroupAddon position="prepend">
          <GlInputGroupText>Role</GlInputGroupText>
        </GlFormInputGroupAddon>
        <GlFormSelect defaultValue="developer" id="grouped-member-role">
          <GlFormSelectItem value="developer">Developer</GlFormSelectItem>
          <GlFormSelectItem value="maintainer">Maintainer</GlFormSelectItem>
        </GlFormSelect>
      </GlFormInputGroup>
    </GlFormField>
  );
}
