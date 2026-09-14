import { GlAvatarLabeled } from "gitlab-ui-react/avatar-labeled";
import { GlBadge } from "gitlab-ui-react/badge";

export default function AvatarLabeledExample() {
  return (
    <div className="grid gap-5">
      <GlAvatarLabeled
        label="Norcleeh"
        meta={<GlBadge variant="info">Maintainer</GlBadge>}
        size={48}
        src="https://glui-story.nocp.space/img/avatar.jpg"
        subLabel="@NriotHrreion" />
      <GlAvatarLabeled
        entityId={4}
        entityName="Nocpiun"
        inlineLabels
        label="Nocpiun"
        shape="rect"
        size={32}
        subLabel="Organization" />
    </div>
  );
}
