import { GlToggle } from "gitlab-ui-react/toggle";

export default function ToggleStatesExample() {
  return (
    <div className="flex flex-col items-start gap-5">
      <GlToggle defaultValue label="On" />
      <GlToggle label="Off" />
      <GlToggle disabled label="On disabled" value />
      <GlToggle disabled label="Off disabled" />
      <GlToggle label="Loading on" loading value />
      <GlToggle label="Loading off" loading />
    </div>
  );
}
