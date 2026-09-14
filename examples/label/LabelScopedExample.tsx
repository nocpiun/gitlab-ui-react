import { GlLabel } from "gitlab-ui-react/label";

export default function LabelScopedExample() {
  return (
    <div className="flex flex-wrap gap-3">
      <GlLabel
        backgroundColor="#CBE2F9"
        scoped
        title="workflow::review"
        target="#review" />
      <GlLabel
        backgroundColor="#FDD4CD"
        scoped
        title="priority::high"
        target="#high-priority" />
    </div>
  );
}
