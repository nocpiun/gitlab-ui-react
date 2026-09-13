import { GlAvatar } from "gitlab-ui-react/avatar";

export default function AvatarFallbackExample() {
  return (
    <div className="flex flex-wrap gap-5">
      <div className="flex items-center gap-3">
        <GlAvatar entityId={4} entityName="Nocpiun" shape="rect" size={48} />
        <span>Nocpiun</span>
      </div>
      <div className="flex items-center gap-3">
        <GlAvatar entityId={6} entityName="OPanel" shape="rect" size={48} />
        <span>OPanel</span>
      </div>
    </div>
  );
}
