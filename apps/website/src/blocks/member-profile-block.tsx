import {
  GlAttributeList,
  GlAttributeListItem,
} from "gitlab-ui-react/attribute-list";
import { GlAvatarLabeled } from "gitlab-ui-react/avatar-labeled";
import { GlBadge } from "gitlab-ui-react/badge";
import { ShowcaseCard } from "../components/showcase-card";
import { type Locale } from "../i18n/config";
import { showcaseContent } from "../i18n/showcase-content";

type MemberProfileBlockProps = {
  locale: Locale;
};

export function MemberProfileBlock({ locale }: MemberProfileBlockProps) {
  const content = showcaseContent[locale].memberProfile;

  return (
    <ShowcaseCard className="flex flex-col gap-5">
      <GlAvatarLabeled
        entityName={content.displayName}
        label={content.displayName}
        labelLink={"#" + content.handle.slice(1)}
        shape="circle"
        size={32}
        subLabel={content.handle + " · " + content.role}/>

      <div className="border-t border-section">
        <GlAttributeList
          descriptionClassName="text-default"
          labelClassName="text-subtle"
          layout="horizontal">
          <GlAttributeListItem icon="group" label={content.teamLabel}>
            {content.team}
          </GlAttributeListItem>
          <GlAttributeListItem icon="location-dot" label={content.locationLabel}>
            {content.location}
          </GlAttributeListItem>
          <GlAttributeListItem icon="clock" label={content.timeZoneLabel}>
            {content.timeZone}
          </GlAttributeListItem>
          <GlAttributeListItem icon="on-call-schedules" label={content.scheduleLabel}>
            <GlBadge variant="info">{content.schedule}</GlBadge>
          </GlAttributeListItem>
        </GlAttributeList>
      </div>
    </ShowcaseCard>
  );
}
