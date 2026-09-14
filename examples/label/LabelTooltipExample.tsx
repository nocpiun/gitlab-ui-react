import { GlLabel } from "gitlab-ui-react/label";

export default function LabelTooltipExample() {
  return (
    <GlLabel
      backgroundColor="#CBE2F9"
      description="Tracks work that is ready for review."
      footer="Project label"
      title="Ready for review"
      target="#ready-for-review" />
  );
}
