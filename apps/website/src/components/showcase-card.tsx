import type { PropsWithChildren } from "react";
import { GlCard, GlCardContent } from "gitlab-ui-react";
import { clsx } from "cn";

type ShowcaseCardProps = PropsWithChildren<{
  className?: string;
}>;

export function ShowcaseCard({ children, className }: ShowcaseCardProps) {
  return (
    <GlCard className="overflow-hidden border-subtle! bg-subtle! shadow-sm!">
      <GlCardContent className={clsx("p-6!", className)}>
        {children}
      </GlCardContent>
    </GlCard>
  );
}
