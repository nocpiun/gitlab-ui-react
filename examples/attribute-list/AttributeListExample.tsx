import {
  GlAttributeList,
  GlAttributeListItem,
} from "gitlab-ui-react/attribute-list";

export default function AttributeListExample() {
  return (
    <GlAttributeList>
      <GlAttributeListItem icon="calendar" label="Created">Feb 9, 2026</GlAttributeListItem>
      <GlAttributeListItem icon="clock" label="Run started">2:30 PM</GlAttributeListItem>
      <GlAttributeListItem icon="hourglass" label="Runtime">5 minutes 42 seconds</GlAttributeListItem>
      <GlAttributeListItem icon="status-health" label="Health">Healthy</GlAttributeListItem>
      <GlAttributeListItem icon="user" label="Owner">Alex Morgan</GlAttributeListItem>
      <GlAttributeListItem icon="project" label="Project">Design system</GlAttributeListItem>
    </GlAttributeList>
  );
}
