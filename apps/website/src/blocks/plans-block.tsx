import { GlBadge, GlButton, GlIcon } from "gitlab-ui-react";
import { BlockHeader, ShowcaseCard } from "./showcase-card";

const features = ["Advanced models", "Advanced image creation with Thinking", "Expanded memory across chats"];

export function PlansBlock() {
  return (
    <ShowcaseCard labelledBy="plans-block-title">
      <BlockHeader
        description="A pricing choice with the important details kept close."
        id="plans-block-title"
        title="Choose a plan" />

      <div className="rounded-xl border-2 border-strong bg-default p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col">
            <span className="m-0 text-600 font-semibold">Plus</span>
            <span className="m-0 text-sm text-subtle">Unlock the full experience</span>
          </div>
          <GlBadge variant="tier">Most popular</GlBadge>
        </div>
        <div className="mt-8 flex items-baseline gap-4">
          <span className="text-[2.5rem] font-semibold leading-none text-heading">$20</span>
          <span className="text-sm text-subtle">per month</span>
        </div>
        <ul className="mt-5! grid list-none gap-3 p-0">
          {features.map((feature) => (
            <li className="flex items-center gap-3 text-sm text-default" key={feature}>
              <GlIcon name="check-circle" size={16} variant="success" />
              {feature}
            </li>
          ))}
        </ul>
        <GlButton block className="mt-5" variant="confirm">Upgrade to Plus</GlButton>
      </div>

      <div className="mt-6 flex justify-end">
        <GlButton size="small">Switch to Business</GlButton>
      </div>
    </ShowcaseCard>
  );
}
