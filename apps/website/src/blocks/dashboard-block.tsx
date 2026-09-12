import { GlBadge } from "gitlab-ui-react/badge";
import {
  GlBreadcrumb,
  GlBreadcrumbItem,
} from "gitlab-ui-react/breadcrumb";
import {
  GlCard,
  GlCardContent,
  GlCardFooter,
  GlCardHeader,
} from "gitlab-ui-react/card";
import { GlIcon } from "gitlab-ui-react/icon";
import { GlProgressBar } from "gitlab-ui-react/progress-bar";
import { ShowcaseCard } from "../components/showcase-card";
import { type Locale } from "../i18n/config";
import { showcaseContent } from "../i18n/showcase-content";

const metricIcons = {
  cpu: "tachometer",
  memory: "metrics",
  network: "earth",
  uptime: "status_success",
} as const;

type DashboardBlockProps = {
  locale: Locale;
};

export function DashboardBlock({ locale }: DashboardBlockProps) {
  const content = showcaseContent[locale].dashboard;

  return (
    <ShowcaseCard className="flex flex-col gap-4">
      <div>
        <GlBreadcrumb autoResize={false} aria-label={content.breadcrumbLabel}>
          <GlBreadcrumbItem href="#infrastructure">{content.infrastructure}</GlBreadcrumbItem>
          <GlBreadcrumbItem href="#overview">{content.overview}</GlBreadcrumbItem>
        </GlBreadcrumb>
        <h2 className="mt-4 text-[1.25rem] font-semibold text-heading sm:text-[1.5rem]">
          {content.serverOverview}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {content.metrics.map((metric) => (
          <GlCard className="h-full border-subtle bg-strong" key={metric.key}>
            <GlCardHeader className="flex items-center justify-between gap-2">
              <h3 className="text-sm">{metric.label}</h3>
              <GlIcon name={metricIcons[metric.key]} size={16} variant="subtle" />
            </GlCardHeader>

            <GlCardContent className="flex flex-col p-3">
              <p className="text-[1.75rem] font-semibold leading-none text-heading">
                {metric.value}
              </p>
              <p className="mb-0 mt-2 text-xs leading-relaxed text-default">
                {metric.description}
              </p>
              {metric.progress ? (
                <GlProgressBar
                  aria-label={`${metric.label}: ${metric.value}`}
                  className="mt-3"
                  height="0.375rem"
                  value={metric.progress}
                  variant="success" />
              ) : null}
            </GlCardContent>

            <GlCardFooter className="text-xs">
              {content.updated}
            </GlCardFooter>
          </GlCard>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-subtle">{content.averageResponseTime}</span>
        <GlBadge icon="clock" variant="info">128 ms</GlBadge>
      </div>
    </ShowcaseCard>
  );
}
