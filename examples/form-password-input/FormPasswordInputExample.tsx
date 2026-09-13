import { GlFormPasswordInput } from "gitlab-ui-react/form-password-input";

export default function FormPasswordInputExample() {
  return (
    <div className="max-w-md">
      <label className="mb-2 block font-bold" htmlFor="password">
        Password
      </label>
      <GlFormPasswordInput
        autoComplete="current-password"
        defaultValue="example-password"
        id="password" />
    </div>
  );
}
