import { GlAlert, GlAlertDescription } from "gitlab-ui-react/alert";

export default function AlertVariantsExample() {
  return (
    <div className="grid gap-5">
      <GlAlert dismissible={false} title="Deployment failed" variant="danger">
        <GlAlertDescription>Review the job log and retry the deployment.</GlAlertDescription>
      </GlAlert>
      <GlAlert dismissible={false} title="Storage almost full" variant="warning">
        <GlAlertDescription>Free space before the next repository backup.</GlAlertDescription>
      </GlAlert>
      <GlAlert dismissible={false} title="Pipeline passed" variant="success">
        <GlAlertDescription>All required jobs completed successfully.</GlAlertDescription>
      </GlAlert>
      <GlAlert dismissible={false} title="Indexing in progress" variant="info">
        <GlAlertDescription>Search results will update when indexing finishes.</GlAlertDescription>
      </GlAlert>
      <GlAlert dismissible={false} title="Save time with templates" variant="tip">
        <GlAlertDescription>Start new issues from a reusable template.</GlAlertDescription>
      </GlAlert>
    </div>
  );
}
