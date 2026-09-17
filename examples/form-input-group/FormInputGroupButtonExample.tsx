import { GlButton } from "gitlab-ui-react/button";
import { GlFormField, GlFormFieldLabel } from "gitlab-ui-react/form-field";
import { GlFormInput } from "gitlab-ui-react/form-input";
import {
  GlFormInputGroup,
  GlFormInputGroupAddon,
} from "gitlab-ui-react/form-input-group";

export default function FormInputGroupButtonExample() {
  return (
    <form className="max-w-md">
      <GlFormField>
        <GlFormFieldLabel
          htmlFor="grouped-search"
          id="grouped-search-label">
          Search projects
        </GlFormFieldLabel>
        <GlFormInputGroup aria-labelledby="grouped-search-label">
          <GlFormInput id="grouped-search" type="search" />
          <GlFormInputGroupAddon position="append">
            <GlButton type="reset">Clear</GlButton>
          </GlFormInputGroupAddon>
        </GlFormInputGroup>
      </GlFormField>
    </form>
  );
}
