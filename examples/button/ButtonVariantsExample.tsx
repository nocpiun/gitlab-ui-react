import { GlButton } from "gitlab-ui-react";

export default function ButtonVariantsExample() {
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-3">
        <GlButton>Default</GlButton>
        <GlButton category="secondary">Default secondary</GlButton>
        <GlButton category="tertiary">Default tertiary</GlButton>
      </div>
      <div className="flex flex-wrap gap-3">
        <GlButton variant="confirm">Confirm</GlButton>
        <GlButton category="secondary" variant="confirm">Confirm secondary</GlButton>
        <GlButton category="tertiary" variant="confirm">Confirm tertiary</GlButton>
      </div>
      <div className="flex flex-wrap gap-3">
        <GlButton variant="danger">Danger</GlButton>
        <GlButton category="secondary" variant="danger">Danger secondary</GlButton>
        <GlButton category="tertiary" variant="danger">Danger tertiary</GlButton>
      </div>
    </div>
  );
}
