import { GlFormCheckbox } from "gitlab-ui-react/form-checkbox";

export default function FormCheckboxStatesExample() {
  return (
    <div className="flex flex-col gap-3">
      <GlFormCheckbox indeterminate>Partially selected</GlFormCheckbox>
      <GlFormCheckbox disabled>Unavailable option</GlFormCheckbox>
      <GlFormCheckbox help="You can change this later.">
        Include optional updates
      </GlFormCheckbox>
    </div>
  );
}
