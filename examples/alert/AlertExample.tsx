import {
  GlAlert,
  GlAlertDescription,
} from "gitlab-ui-react/alert";

export default function AlertExample() {
  return (
    <GlAlert dismissible={false}>
      <GlAlertDescription>
        Your preferences were updated and will apply to new projects.
      </GlAlertDescription>
    </GlAlert>
  );
}
