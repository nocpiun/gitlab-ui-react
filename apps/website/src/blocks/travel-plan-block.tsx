import {
  GlBadge,
  GlButton,
  GlPath,
  GlPathItem,
  GlPathItemMetric,
  GlPathItemTitle,
} from "gitlab-ui-react";
import { BlockHeader, ShowcaseCard } from "./showcase-card";

export function TravelPlanBlock() {
  return (
    <ShowcaseCard labelledBy="travel-block-title">
      <BlockHeader
        action={<GlBadge icon="earth" variant="tier">4 days</GlBadge>}
        description="Everything for the trip, gathered in one place."
        id="travel-block-title"
        title="Weekend in Kyoto" />

      <GlPath defaultValue="stay">
        <GlPathItem icon="paper-airplane" value="flight">
          <GlPathItemTitle>Flight</GlPathItemTitle>
          <GlPathItemMetric>Booked</GlPathItemMetric>
        </GlPathItem>
        <GlPathItem icon="home" value="stay">
          <GlPathItemTitle>Stay</GlPathItemTitle>
          <GlPathItemMetric>2 nights</GlPathItemMetric>
        </GlPathItem>
      </GlPath>

      <div className="mt-5 grid gap-3">
        <div className="flex items-center justify-between rounded-xl border border-section bg-default p-4">
          <div>
            <p className="m-0 font-semibold text-heading">Machiya residence</p>
            <p className="mb-0 mt-1 text-sm text-subtle">Gion · Check-in after 3 PM</p>
          </div>
          <GlBadge variant="success">Confirmed</GlBadge>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-section bg-default p-4">
          <div>
            <p className="m-0 font-semibold text-heading">Arashiyama morning</p>
            <p className="mb-0 mt-1 text-sm text-subtle">Saturday · 8:30 AM</p>
          </div>
          <GlBadge variant="info">Planned</GlBadge>
        </div>
      </div>

      <GlButton category="tertiary" className="mt-4" icon="plus">Add itinerary item</GlButton>
    </ShowcaseCard>
  );
}
