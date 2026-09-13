import { GlIcon } from "gitlab-ui-react/icon";

export default function IconExample() {
  return (
    <span className="flex items-center gap-2">
      <GlIcon name="information-o" />
      Additional information
    </span>
  );
}
