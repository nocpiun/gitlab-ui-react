import { GlButton } from "gitlab-ui-react";

export default function ButtonSizesExample() {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3">
        <GlButton size="small">Small button</GlButton>
        <GlButton>Medium button</GlButton>
      </div>
      <GlButton block>Full-width button</GlButton>
    </div>
  );
}
