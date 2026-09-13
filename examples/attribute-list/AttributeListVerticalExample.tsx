import {
  GlAttributeList,
  GlAttributeListItem,
} from "gitlab-ui-react/attribute-list";

export default function AttributeListVerticalExample() {
  return (
    <GlAttributeList layout="vertical">
      <GlAttributeListItem label="Merge request author">Alex Morgan</GlAttributeListItem>
      <GlAttributeListItem label="Most recent approval">Yesterday at 4:20 PM</GlAttributeListItem>
      <GlAttributeListItem label="Target branch">main</GlAttributeListItem>
      <GlAttributeListItem label="Pipeline status">Passed</GlAttributeListItem>
    </GlAttributeList>
  );
}
