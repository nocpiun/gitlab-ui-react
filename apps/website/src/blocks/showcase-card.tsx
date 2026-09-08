import type { PropsWithChildren, ReactNode } from "react";
import { GlCard, GlCardContent } from "gitlab-ui-react";

type ShowcaseCardProps = PropsWithChildren<{
  labelledBy: string;
}>;

type BlockHeaderProps = {
  action?: ReactNode;
  description?: string;
  id: string;
  title: string;
};

export function ShowcaseCard({ children, labelledBy }: ShowcaseCardProps) {
  return (
    <GlCard
      aria-labelledby={labelledBy}
      className="overflow-hidden border-subtle! bg-subtle! shadow-sm!">
      <GlCardContent className="p-6!">
        {children}
      </GlCardContent>
    </GlCard>
  );
}

export function BlockHeader({ action, description, id, title }: BlockHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 id={id} className="m-0 text-lg font-semibold text-heading">
          {title}
        </h2>
        {description ? (
          <p className="mb-0 mt-2 text-sm text-subtle">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
