import { GlFormInput } from "gitlab-ui-react/form-input";
import {
  GlFormInputGroup,
  GlFormInputGroupAddon,
  GlInputGroupText,
} from "gitlab-ui-react/form-input-group";

export default function FormInputGroupRangeExample() {
  return (
    <div className="max-w-md">
      <label
        className="mb-2 block font-bold"
        htmlFor="grouped-progress"
        id="grouped-progress-label">
        Progress
      </label>
      <GlFormInputGroup aria-labelledby="grouped-progress-label">
        <GlFormInputGroupAddon position="prepend">
          <GlInputGroupText>0</GlInputGroupText>
        </GlFormInputGroupAddon>
        <GlFormInput
          defaultValue={50}
          id="grouped-progress"
          max={100}
          min={0}
          type="range" />
        <GlFormInputGroupAddon position="append">
          <GlInputGroupText>100</GlInputGroupText>
        </GlFormInputGroupAddon>
      </GlFormInputGroup>
    </div>
  );
}
