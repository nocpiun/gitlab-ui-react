import { GlFormTextarea } from "gitlab-ui-react/form-textarea";

export default function FormTextareaExample() {
  return (
    <div className="max-w-lg">
      <label className="mb-2 block font-bold" htmlFor="description">
        Description
      </label>
      <GlFormTextarea
        defaultValue="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
        id="description" />
    </div>
  );
}
