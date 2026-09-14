import { GlToggle } from "gitlab-ui-react/toggle";

export default function ToggleLabelPositionsExample() {
  return (
    <div className="flex flex-col items-start gap-6">
      <GlToggle defaultValue label="Top label" />
      <GlToggle defaultValue label="Left label" labelPosition="left" />
      <GlToggle aria-label="Hidden label" label="Hidden label" labelPosition="hidden" />
    </div>
  );
}
