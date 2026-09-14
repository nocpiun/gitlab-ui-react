import { GlIcon } from "gitlab-ui-react/icon";

export default function IconVariantsExample() {
  return (
    <div className="flex flex-wrap items-center gap-5">
      <GlIcon ariaLabel="Information" name="information-o" variant="info" />
      <GlIcon ariaLabel="Warning" name="warning" variant="warning" />
      <GlIcon ariaLabel="Error" name="error" variant="danger" />
      <GlIcon ariaLabel="Success" name="check-circle" variant="success" />
    </div>
  );
}
