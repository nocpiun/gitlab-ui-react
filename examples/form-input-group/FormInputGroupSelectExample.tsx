import {
  GlFormInputGroup,
  GlFormInputGroupAddon,
  GlInputGroupText,
} from "gitlab-ui-react/form-input-group";
import { GlFormSelect, GlFormSelectItem } from "gitlab-ui-react/form-select";

export default function FormInputGroupSelectExample() {
  return (
    <div className="max-w-md">
      <label
        className="mb-2 block font-bold"
        htmlFor="grouped-member-role"
        id="grouped-member-role-label">
        Member role
      </label>
      <GlFormInputGroup aria-labelledby="grouped-member-role-label">
        <GlFormInputGroupAddon position="prepend">
          <GlInputGroupText>Role</GlInputGroupText>
        </GlFormInputGroupAddon>
        <GlFormSelect defaultValue="developer" id="grouped-member-role">
          <GlFormSelectItem value="developer">Developer</GlFormSelectItem>
          <GlFormSelectItem value="maintainer">Maintainer</GlFormSelectItem>
        </GlFormSelect>
      </GlFormInputGroup>
    </div>
  );
}
