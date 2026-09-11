import { GlButton } from "gitlab-ui-react";

export default function ButtonStatesExample() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <GlButton loading>Loading</GlButton>
      <GlButton aria-pressed="true" selected>Selected</GlButton>
      <GlButton disabled>Disabled</GlButton>
    </div>
  );
}
