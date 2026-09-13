import {
  GlAlert,
  GlAlertDescription,
} from "gitlab-ui-react/alert";

export default function AlertVariantsExample() {
  return (
    <div className="grid gap-3">
      <GlAlert dismissible={false} title="Deployment failed" variant="danger">
        <GlAlertDescription>Resolve the job errors, then run the deployment again.</GlAlertDescription>
      </GlAlert>
      <GlAlert dismissible={false} title="Storage is almost full" variant="warning">
        <GlAlertDescription>Free some space before the storage limit is reached.</GlAlertDescription>
      </GlAlert>
      <GlAlert dismissible={false} title="Import complete" variant="success">
        <GlAlertDescription>The project is now ready to use.</GlAlertDescription>
      </GlAlert>
      <GlAlert dismissible={false} title="Pipeline is running" variant="info">
        <GlAlertDescription>This page updates as jobs finish.</GlAlertDescription>
      </GlAlert>
      <GlAlert dismissible={false} title="Save time with templates" variant="tip">
        <GlAlertDescription>Start from a template when creating a new issue.</GlAlertDescription>
      </GlAlert>
    </div>
  );
}
