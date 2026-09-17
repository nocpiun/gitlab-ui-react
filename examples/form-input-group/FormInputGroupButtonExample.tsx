import { GlButton } from "gitlab-ui-react/button";
import { GlFormInput } from "gitlab-ui-react/form-input";
import {
  GlFormInputGroup,
  GlFormInputGroupAddon,
} from "gitlab-ui-react/form-input-group";

export default function FormInputGroupButtonExample() {
  return (
    <form className="max-w-md">
      <label
        className="mb-2 block font-bold"
        htmlFor="grouped-search"
        id="grouped-search-label">
        Search projects
      </label>
      <GlFormInputGroup aria-labelledby="grouped-search-label">
        <GlFormInput id="grouped-search" type="search" />
        <GlFormInputGroupAddon position="append">
          <GlButton type="reset">Clear</GlButton>
        </GlFormInputGroupAddon>
      </GlFormInputGroup>
    </form>
  );
}
