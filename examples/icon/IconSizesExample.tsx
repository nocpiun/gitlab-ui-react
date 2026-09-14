import { GlIcon } from "gitlab-ui-react/icon";

export default function IconSizesExample() {
  return (
    <div className="flex flex-wrap items-end gap-5">
      <GlIcon name="tanuki" size={12} />
      <GlIcon name="tanuki" size={16} />
      <GlIcon name="tanuki" size={24} />
      <GlIcon name="tanuki" size={32} />
      <GlIcon name="tanuki" size={48} />
    </div>
  );
}
