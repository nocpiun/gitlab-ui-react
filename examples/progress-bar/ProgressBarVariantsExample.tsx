import { GlProgressBar } from "gitlab-ui-react/progress-bar";

const variants = ["primary", "success", "warning", "danger"] as const;

export default function ProgressBarVariantsExample() {
  return (
    <div className="flex flex-col gap-4">
      {variants.map((variant, index) => (
        <GlProgressBar
          key={variant}
          aria-label={`${variant} progress`}
          value={(index + 1) * 20}
          variant={variant} />
      ))}
    </div>
  );
}
