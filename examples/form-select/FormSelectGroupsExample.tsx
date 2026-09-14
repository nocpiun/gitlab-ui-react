import {
  GlFormSelect,
  GlFormSelectGroup,
  GlFormSelectItem,
} from "gitlab-ui-react/form-select";

export default function FormSelectGroupsExample() {
  return (
    <div className="max-w-sm">
      <label className="mb-2 block font-bold" htmlFor="destination">
        Destination
      </label>
      <GlFormSelect id="destination">
        <GlFormSelectGroup label="Recent projects">
          <GlFormSelectItem value="opanel">OPanel</GlFormSelectItem>
          <GlFormSelectItem value="documentation">Documentation</GlFormSelectItem>
        </GlFormSelectGroup>
        <GlFormSelectGroup label="Organizations">
          <GlFormSelectItem value="nocpiun">Nocpiun</GlFormSelectItem>
        </GlFormSelectGroup>
      </GlFormSelect>
    </div>
  );
}
