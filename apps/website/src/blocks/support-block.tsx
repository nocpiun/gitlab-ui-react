import {
  GlAlert,
  GlAlertDescription,
  GlAvatarLabeled,
  GlBadge,
  GlButton,
  GlFormTextarea,
} from "gitlab-ui-react";
import { BlockHeader, ShowcaseCard } from "./showcase-card";

export function SupportBlock() {
  return (
    <ShowcaseCard labelledBy="support-block-title">
      <BlockHeader
        action={<GlBadge variant="success">Online</GlBadge>}
        description="A compact support conversation with clear next actions."
        id="support-block-title"
        title="Order delivery question" />

      <GlAvatarLabeled
        entityId={18}
        entityName="Li Hua"
        label="Li Hua"
        size={32}
        subLabel="Customer, 12 minutes ago" />

      <div className="my-4 px-5 py-4 bg-neutral-900 rounded-lg text-default">
        Can you tell me how much the shirt is?
      </div>

      <GlAlert
        dismissible={false}
        title="Address can still be changed"
        variant="info"
        className="mb-5">
        <GlAlertDescription>The order has not entered fulfillment yet.</GlAlertDescription>
      </GlAlert>

      <GlFormTextarea placeholder="Write a reply..." value="Yes, it's nine fifteen." rows={3} noResize={false} />
      <div className="mt-4 flex justify-end gap-3">
        <GlButton category="tertiary">Add note</GlButton>
        <GlButton variant="confirm">Send reply</GlButton>
      </div>
    </ShowcaseCard>
  );
}
