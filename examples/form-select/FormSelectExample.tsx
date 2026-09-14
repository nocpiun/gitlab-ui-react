import {
  GlFormSelect,
  GlFormSelectItem,
} from "gitlab-ui-react/form-select";

export default function FormSelectExample() {
  return (
    <div className="max-w-sm">
      <label className="mb-2 block font-bold" htmlFor="project">
        Project
      </label>
      <GlFormSelect defaultValue="opanel" id="project">
        <GlFormSelectItem value="opanel">OPanel</GlFormSelectItem>
        <GlFormSelectItem value="documentation">Documentation</GlFormSelectItem>
        <GlFormSelectItem value="website">Website</GlFormSelectItem>
      </GlFormSelect>
    </div>
  );
}
