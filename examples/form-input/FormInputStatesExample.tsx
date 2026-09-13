import { GlFormInput } from "gitlab-ui-react/form-input";

export default function FormInputStatesExample() {
  return (
    <div className="grid max-w-md gap-4">
      <GlFormInput aria-label="Read-only value" defaultValue="Read-only value" readOnly />
      <GlFormInput aria-label="Plain text value" defaultValue="Plain text value" plaintext />
      <div className="grid gap-2">
        <GlFormInput
          aria-describedby="invalid-value-message"
          aria-label="Invalid value"
          defaultValue="Invalid value"
          state={false} />
        <p
          id="invalid-value-message"
          className="m-0"
          style={{ color: "var(--gl-control-text-color-error)" }}>
          Enter a supported value.
        </p>
      </div>
      <GlFormInput aria-label="Disabled value" defaultValue="Disabled value" disabled />
    </div>
  );
}
