import {
  GlDisclosureDropdown,
  GlDisclosureDropdownContent,
  GlDisclosureDropdownGroup,
  GlDisclosureDropdownGroupLabel,
  GlDisclosureDropdownItem,
  GlDisclosureDropdownTrigger,
} from "gitlab-ui-react/disclosure-dropdown";

export default function DropdownExample() {
  return (
    <GlDisclosureDropdown>
      <GlDisclosureDropdownTrigger>Project actions</GlDisclosureDropdownTrigger>
      <GlDisclosureDropdownContent>
        <GlDisclosureDropdownGroup>
          <GlDisclosureDropdownItem icon="pencil" value="edit">
            Edit project
          </GlDisclosureDropdownItem>
          <GlDisclosureDropdownItem value="duplicate">
            Duplicate project
          </GlDisclosureDropdownItem>
        </GlDisclosureDropdownGroup>
        <GlDisclosureDropdownGroup bordered>
          <GlDisclosureDropdownGroupLabel>Danger zone</GlDisclosureDropdownGroupLabel>
          <GlDisclosureDropdownItem value="delete" variant="danger">
            Delete project
          </GlDisclosureDropdownItem>
        </GlDisclosureDropdownGroup>
      </GlDisclosureDropdownContent>
    </GlDisclosureDropdown>
  );
}
