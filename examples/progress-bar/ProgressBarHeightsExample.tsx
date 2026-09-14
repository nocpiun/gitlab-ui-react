import { GlProgressBar } from "gitlab-ui-react/progress-bar";

export default function ProgressBarHeightsExample() {
  return (
    <div className="flex flex-col gap-3">
      <GlProgressBar aria-label="4 pixel progress" height="4px" value={30} />
      <GlProgressBar aria-label="8 pixel progress" height="8px" value={30} />
      <GlProgressBar aria-label="16 pixel progress" height="1rem" value={30} />
      <GlProgressBar aria-label="32 pixel progress" height="2rem" value={30} />
    </div>
  );
}
