import { GlAvatar } from "gitlab-ui-react/avatar";
import { GlAvatarLabeled } from "gitlab-ui-react/avatar-labeled";
import { GlAvatarLink } from "gitlab-ui-react/avatar-link";

export default function AvatarLinkExample() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <GlAvatarLink href="#user-profile">
        <GlAvatar
          alt="Norcleeh"
          size={48}
          src="https://glui-story.nocp.space/img/avatar.jpg" />
      </GlAvatarLink>
      <GlAvatarLink href="#project-overview">
        <GlAvatarLabeled
          entityId={4}
          entityName="OPanel"
          label="OPanel"
          shape="rect"
          size={48}
          subLabel="Project" />
      </GlAvatarLink>
    </div>
  );
}
