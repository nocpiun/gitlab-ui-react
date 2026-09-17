import { GlFormInput } from "gitlab-ui-react/form-input";
import {
  GlFormInputGroup,
  GlFormInputGroupAddon,
  GlInputGroupText,
} from "gitlab-ui-react/form-input-group";

export default function FormInputGroupExample() {
  return (
    <div className="max-w-md">
      <label
        className="mb-2 block font-bold"
        htmlFor="grouped-username"
        id="grouped-username-label">
        Username
      </label>
      <GlFormInputGroup aria-labelledby="grouped-username-label">
        <GlFormInputGroupAddon position="prepend">
          <GlInputGroupText id="grouped-username-prefix">@</GlInputGroupText>
        </GlFormInputGroupAddon>
        <GlFormInput
          aria-describedby="grouped-username-prefix"
          defaultValue="NriotHrreion"
          id="grouped-username" />
      </GlFormInputGroup>
    </div>
  );
}
