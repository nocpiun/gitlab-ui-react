import {
  GlBadge,
  GlBreadcrumb,
  GlBreadcrumbItem,
  GlCard,
  GlCardContent,
  GlCardFooter,
  GlCardHeader,
  GlIcon,
  GlProgressBar,
} from "gitlab-ui-react";
import { ShowcaseCard } from "../components/showcase-card";

const metrics = [
  {
    description: "Average processor utilization.",
    icon: "tachometer",
    label: "CPU usage",
    value: "42%",
  },
  {
    description: "Memory currently used by services.",
    icon: "metrics",
    label: "Memory usage",
    value: "12.6 GB",
  },
  {
    description: "Transferred over the last 30 days.",
    icon: "earth",
    label: "Network traffic",
    value: "248 GB",
  },
  {
    description: "Availability during this period.",
    icon: "status_success",
    label: "Uptime",
    progress: 99.98,
    value: "99.98%",
  },
];

export function DashboardBlock() {
  return (
    <ShowcaseCard className="flex flex-col gap-4">
      <div>
        <GlBreadcrumb autoResize={false} aria-label="Dashboard location">
          <GlBreadcrumbItem href="#infrastructure">Infrastructure</GlBreadcrumbItem>
          <GlBreadcrumbItem href="#overview">Overview</GlBreadcrumbItem>
        </GlBreadcrumb>
        <h2 className="mt-4! text-[1.25rem]! font-semibold text-heading sm:text-[1.5rem]!">
          Server Overview
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {metrics.map((metric) => (
          <GlCard className="h-full border-subtle! bg-strong!" key={metric.label}>
            <GlCardHeader className="flex items-center justify-between gap-2">
              <h3 className="text-sm!">{metric.label}</h3>
              <GlIcon name={metric.icon} size={16} variant="subtle" />
            </GlCardHeader>

            <GlCardContent className="flex flex-col p-3!">
              <p className="text-[1.75rem] font-semibold leading-none text-heading">
                {metric.value}
              </p>
              <p className="mb-0! mt-2! text-xs leading-relaxed text-default">
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
              Updated just now
            </GlCardFooter>
          </GlCard>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-subtle">Average response time</span>
        <GlBadge icon="clock" variant="info">128 ms</GlBadge>
      </div>
    </ShowcaseCard>
  );
}
