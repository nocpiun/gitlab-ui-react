import { GlToggle } from "gitlab-ui-react/toggle";

export default function ToggleExample() {
  return (
    <GlToggle
      defaultValue
      description="Controls whether notifications are sent for new activity."
      help="You can change this setting at any time."
      label="Email notifications" />
  );
}
