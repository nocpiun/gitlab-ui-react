import { GlSkeletonLoader } from "gitlab-ui-react";
import { ShowcaseCard } from "../components/showcase-card";
import { type Locale } from "../i18n/config";
import { showcaseContent } from "../i18n/showcase-content";

type SkeletonBlockProps = {
  locale: Locale;
};

export function SkeletonBlock({ locale }: SkeletonBlockProps) {
  const content = showcaseContent[locale].skeleton;

  return (
    <ShowcaseCard>
      <div aria-busy="true" aria-label={content.loadingLabel} className="flex flex-col gap-5">
        <GlSkeletonLoader aria-hidden="true" />
        <GlSkeletonLoader
          aria-hidden="true"
          className="w-full"
          height={64}
          preserveAspectRatio="none"
          width={320}>
          <circle cx="28" cy="32" r="24" />
          <rect height="12" rx="4" width="142" x="64" y="12" />
          <rect height="10" rx="4" width="96" x="64" y="34" />
          <rect height="24" rx="12" width="54" x="258" y="20" />
        </GlSkeletonLoader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[0, 1].map((item) => (
            <div className="rounded-lg border border-subtle bg-default p-4" key={item}>
              <GlSkeletonLoader
                aria-hidden="true"
                className="w-full"
                height={58}
                preserveAspectRatio="none"
                width={140}>
                <rect height="9" rx="4" width="74" x="0" y="0" />
                <rect height="22" rx="5" width="96" x="0" y="19" />
                <rect height="8" rx="4" width="112" x="0" y="50" />
              </GlSkeletonLoader>
            </div>
          ))}
        </div>
      </div>
    </ShowcaseCard>
  );
}
