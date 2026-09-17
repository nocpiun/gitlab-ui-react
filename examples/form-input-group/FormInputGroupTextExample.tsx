import { GlFormInput } from "gitlab-ui-react/form-input";
import {
  GlFormInputGroup,
  GlFormInputGroupAddon,
  GlInputGroupText,
} from "gitlab-ui-react/form-input-group";

export default function FormInputGroupTextExample() {
  return (
    <div className="max-w-md">
      <label
        className="mb-2 block font-bold"
        htmlFor="grouped-repository-path"
        id="grouped-repository-path-label">
        Repository path
      </label>
      <GlFormInputGroup aria-labelledby="grouped-repository-path-label">
        <GlFormInputGroupAddon position="prepend">
          <GlInputGroupText id="grouped-repository-prefix">
            https://
          </GlInputGroupText>
        </GlFormInputGroupAddon>
        <GlFormInput
          aria-describedby="grouped-repository-prefix grouped-repository-suffix"
          defaultValue="gitlab.com/example/repository"
          id="grouped-repository-path" />
        <GlFormInputGroupAddon position="append">
          <GlInputGroupText id="grouped-repository-suffix">
            .git
          </GlInputGroupText>
        </GlFormInputGroupAddon>
      </GlFormInputGroup>
    </div>
  );
}
