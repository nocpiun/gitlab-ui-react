import {
  GlBadge,
  GlButton,
  GlFormDate,
  GlFormSelect,
  GlFormSelectItem,
} from "gitlab-ui-react";
import { BlockHeader, ShowcaseCard } from "./showcase-card";

export function BookingBlock() {
  return (
    <ShowcaseCard labelledBy="booking-block-title">
      <BlockHeader
        action={<GlBadge variant="info">3 slots left</GlBadge>}
        description="Choose a day and reserve a time that works for you."
        id="booking-block-title"
        title="Book a studio session" />

      <div className="mt-5 grid gap-4">
        <div className="grid gap-2">
          <label className="font-semibold text-default" htmlFor="showcase-booking-date">
            Date
          </label>
          <GlFormDate id="showcase-booking-date" value="2026-09-18" />
        </div>
        <div className="grid gap-2">
          <label className="font-semibold text-default" htmlFor="showcase-booking-time">
            Available time
          </label>
          <GlFormSelect defaultValue="14:30" id="showcase-booking-time">
            <GlFormSelectItem value="10:00">10:00 AM</GlFormSelectItem>
            <GlFormSelectItem value="14:30">2:30 PM</GlFormSelectItem>
            <GlFormSelectItem value="16:00">4:00 PM</GlFormSelectItem>
          </GlFormSelect>
        </div>
        <GlButton block icon="calendar" variant="confirm">Reserve session</GlButton>
      </div>
    </ShowcaseCard>
  );
}
