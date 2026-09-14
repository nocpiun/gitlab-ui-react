import { GlFormInput } from "gitlab-ui-react/form-input";

export default function FormInputExample() {
  return (
    <div className="max-w-md">
      <label className="mb-2 block font-bold" htmlFor="username">
        Username
      </label>
      <GlFormInput defaultValue="Norcleeh" id="username" />
    </div>
  );
}
