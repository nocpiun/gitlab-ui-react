import { useState } from "react";
import {
  GlBadge,
  GlButton,
  GlButtonGroup,
  GlIcon,
} from "gitlab-ui-react";
import { ShowcaseCard } from "../components/showcase-card";

const features = [
  "Access to advanced AI models",
  "Unlimited projects and chats",
  "Faster responses at peak times",
  "Priority access to new features",
];

type BillingCycle = "monthly" | "annual";

const billingOptions: Record<BillingCycle, {
  billedLabel: string;
  buttonLabel: string;
  price: number;
}> = {
  monthly: {
    billedLabel: "Billed monthly",
    buttonLabel: "Monthly",
    price: 29,
  },
  annual: {
    billedLabel: "$288 billed annually",
    buttonLabel: "Annual · Save 17%",
    price: 24,
  },
};

export function ProPlanBlock() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");
  const selectedPlan = billingOptions[billingCycle];

  return (
    <ShowcaseCard className="flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
          <GlIcon name="tanuki-ai" size={24} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="pro-plan-block-title" className="m-0! text-xl font-semibold text-heading">
              AI Pro
            </h2>
            <GlBadge icon="license" variant="success">Recommended</GlBadge>
          </div>
          <p className="mb-0! mt-1! text-sm text-subtle">
            More intelligence and capacity for your everyday work.
          </p>
        </div>
      </div>

      <GlButtonGroup aria-label="Billing cycle" className="flex w-full">
        {(Object.keys(billingOptions) as BillingCycle[]).map((cycle) => (
          <GlButton
            aria-pressed={billingCycle === cycle}
            className="flex-1"
            key={cycle}
            onClick={() => setBillingCycle(cycle)}
            selected={billingCycle === cycle}>
            {billingOptions[cycle].buttonLabel}
          </GlButton>
        ))}
      </GlButtonGroup>

      <div aria-live="polite" className="rounded-xl border border-strong bg-default p-5">
        <div className="flex items-end gap-2">
          <span className="text-[2.5rem] font-semibold leading-none text-heading">
            ${selectedPlan.price}
          </span>
          <span className="pb-0.5 text-sm text-subtle">USD / month</span>
        </div>
        <p className="mb-0 mt-2! text-sm text-subtle">{selectedPlan.billedLabel}</p>

        <div className="my-5 border-t border-neutral-800" />

        <p className="m-0 text-sm font-semibold text-heading">Everything you need to move faster</p>
        <ul className="mb-0 mt-4 grid list-none gap-3 p-0">
          {features.map((feature) => (
            <li className="flex items-start gap-3 text-sm text-default" key={feature}>
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
          Upgrade to Pro
        </GlButton>
        <p className="mb-0! mt-3! text-center text-xs text-subtle">
          Cancel anytime. Your current plan stays active until renewal.
        </p>
      </div>
    </ShowcaseCard>
  );
}
