import { useState } from "react";
import { GlBadge } from "gitlab-ui-react/badge";
import { GlButton } from "gitlab-ui-react/button";
import { GlButtonGroup } from "gitlab-ui-react/button-group";
import { GlIcon } from "gitlab-ui-react/icon";
import { ShowcaseCard } from "../components/showcase-card";
import { type Locale } from "../i18n/config";
import {
  type BillingCycle,
  formatCurrency,
  showcaseContent,
} from "../i18n/showcase-content";

type ProPlanBlockProps = {
  locale: Locale;
};

export function ProPlanBlock({ locale }: ProPlanBlockProps) {
  const content = showcaseContent[locale].proPlan;
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");
  const selectedPlan = content.billingOptions[billingCycle];

  return (
    <ShowcaseCard className="flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
          <GlIcon name="tanuki-ai" size={24} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="pro-plan-block-title" className="m-0 text-xl font-semibold text-heading">
              {content.title}
            </h2>
            <GlBadge icon="license" variant="success">{content.recommended}</GlBadge>
          </div>
          <p className="mb-0 mt-1 text-sm text-subtle">
            {content.description}
          </p>
        </div>
      </div>

      <GlButtonGroup aria-label={content.billingCycleLabel} className="flex w-full">
        {(Object.keys(content.billingOptions) as BillingCycle[]).map((cycle) => (
          <GlButton
            aria-pressed={billingCycle === cycle}
            className="flex-1"
            key={cycle}
            onClick={() => setBillingCycle(cycle)}
            selected={billingCycle === cycle}>
            {content.billingOptions[cycle].buttonLabel}
          </GlButton>
        ))}
      </GlButtonGroup>

      <div aria-live="polite" className="rounded-xl border border-strong bg-default p-5">
        <div className="flex items-end gap-2">
          <span className="text-[2.5rem] font-semibold leading-none text-heading">
            {formatCurrency(locale, selectedPlan.price, content.currency, 0)}
          </span>
          <span className="pb-0.5 text-sm text-subtle">{content.perMonth}</span>
        </div>
        <p className="mb-0 mt-2 text-sm text-subtle">{selectedPlan.billedLabel}</p>

        <div className="my-5 border-t border-neutral-800" />

        <p className="m-0 text-sm font-semibold text-heading">{content.featuresTitle}</p>
        <ul className="mb-0 mt-4 grid list-none gap-3 p-0">
          {content.features.map((feature, index) => (
            <li className="flex items-start gap-3 text-sm text-default" key={index}>
              <GlIcon
                className="mt-0.5 shrink-0"
                name="check-circle"
                size={16}
                variant="success" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <GlButton block variant="confirm">
          {content.upgrade}
        </GlButton>
        <p className="mb-0 mt-3 text-center text-xs text-subtle">
          {content.cancelAnytime}
        </p>
      </div>
    </ShowcaseCard>
  );
}
