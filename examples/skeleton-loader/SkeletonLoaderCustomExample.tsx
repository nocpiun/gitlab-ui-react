import { GlSkeletonLoader } from "gitlab-ui-react/skeleton-loader";

export default function SkeletonLoaderCustomExample() {
  return (
    <GlSkeletonLoader className="max-w-full" height={92} width={360}>
      <circle cx="32" cy="32" r="32" />
      <rect height="14" rx="4" width="170" x="80" y="8" />
      <rect height="12" rx="4" width="240" x="80" y="32" />
      <rect height="12" rx="4" width="200" x="80" y="52" />
      <rect height="12" rx="4" width="320" y="80" />
    </GlSkeletonLoader>
  );
}
