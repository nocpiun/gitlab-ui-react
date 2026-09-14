import { GlLoadingIcon } from "gitlab-ui-react/loading-icon";

const sizes = ["sm", "md", "lg", "xl"] as const;

export default function LoadingIconVariantsExample() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="flex flex-col gap-4 rounded-default p-5">
        <strong>Spinner</strong>
        <div className="flex items-end gap-5">
          {sizes.map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <GlLoadingIcon
                label={`${size} spinner`}
                size={size} />
              <span>{size}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4 rounded-default bg-neutral-950 p-5 text-white">
        <strong>Dots</strong>
        <div className="flex items-end gap-5">
          {sizes.map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <GlLoadingIcon
                color="light"
                label={`${size} dots`}
                size={size}
                variant="dots" />
              <span>{size}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
