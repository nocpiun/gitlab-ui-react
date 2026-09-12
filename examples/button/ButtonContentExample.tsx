import { GlButton } from "gitlab-ui-react/button";

export default function ButtonContentExample() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <GlButton icon="star-o">Star project</GlButton>
      <GlButton aria-label="More actions" icon="ellipsis_h" />
      <GlButton count={5} countSrText="open issues">Issues</GlButton>
    </div>
  );
}
