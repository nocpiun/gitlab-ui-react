import {
  GlAttributeList,
  GlAttributeListItem,
  GlAvatarLabeled,
  GlBadge,
} from "gitlab-ui-react";
import { ShowcaseCard } from "../components/showcase-card";

export function MemberProfileBlock() {
  return (
    <ShowcaseCard className="flex flex-col gap-5">
      <GlAvatarLabeled
        entityName="Norcleeh"
        label="Norcleeh"
        labelLink="#NriotHrreion"
        shape="circle"
        size={32}
        subLabel="@NriotHrreion · Software Engineering"/>

      <div className="border-t border-section">
        <GlAttributeList
          descriptionClassName="text-default"
          labelClassName="text-subtle"
          layout="horizontal">
          <GlAttributeListItem icon="group" label="Team">
            Software
          </GlAttributeListItem>
          <GlAttributeListItem icon="location-dot" label="Location">
            Mainland China
          </GlAttributeListItem>
          <GlAttributeListItem icon="clock" label="Time zone">
            UTC+8
          </GlAttributeListItem>
          <GlAttributeListItem icon="on-call-schedules" label="Schedule">
            <GlBadge variant="info">On call</GlBadge>
          </GlAttributeListItem>
        </GlAttributeList>
      </div>
    </ShowcaseCard>
  );
}
