import { GlFormInput } from "gitlab-ui-react/form-input";

export default function FormInputTypesExample() {
  return (
    <div className="grid max-w-md gap-4">
      <div>
        <label className="mb-2 block font-bold" htmlFor="email">Email</label>
        <GlFormInput id="email" placeholder="name@example.com" type="email" />
      </div>
      <div>
        <label className="mb-2 block font-bold" htmlFor="maximum-results">
          Maximum results
        </label>
        <GlFormInput
          defaultValue={20}
          id="maximum-results"
          min={1}
          number
          type="number" />
      </div>
    </div>
  );
}
