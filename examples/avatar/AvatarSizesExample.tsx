import { GlAvatar } from "gitlab-ui-react/avatar";

const avatarSrc = "https://glui-story.nocp.space/img/avatar.jpg";

export default function AvatarSizesExample() {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <GlAvatar alt="" size={16} src={avatarSrc} />
      <GlAvatar alt="" size={24} src={avatarSrc} />
      <GlAvatar alt="" size={32} src={avatarSrc} />
      <GlAvatar alt="" size={48} src={avatarSrc} />
      <GlAvatar alt="" size={64} src={avatarSrc} />
      <GlAvatar alt="" size={96} src={avatarSrc} />
      <GlAvatar entityId={4} entityName="Nocpiun" shape="rect" size={64} />
    </div>
  );
}
