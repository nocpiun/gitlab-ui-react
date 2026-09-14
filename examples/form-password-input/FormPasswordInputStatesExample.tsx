import { GlFormPasswordInput } from "gitlab-ui-react/form-password-input";

export default function FormPasswordInputStatesExample() {
  return (
    <div className="grid max-w-md gap-4">
      <div>
        <label className="mb-2 block font-bold" htmlFor="read-only-token">
          Read-only access token
        </label>
        <GlFormPasswordInput
          defaultValue="example-access-token"
          id="read-only-token"
          initialVisibility
          readOnly
          revealLabel="Reveal access token"
          hideLabel="Hide access token" />
      </div>
      <div>
        <label className="mb-2 block font-bold" htmlFor="disabled-password">
          Disabled password
        </label>
        <GlFormPasswordInput
          defaultValue="example-password"
          disabled
          id="disabled-password" />
      </div>
    </div>
  );
}
