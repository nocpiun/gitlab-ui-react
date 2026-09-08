import { useState } from "react";
import {
  GlAlert,
  GlAlertDescription,
  GlBadge,
  GlButton,
  GlFormPasswordInput,
  GlToggle,
} from "gitlab-ui-react";
import { BlockHeader, ShowcaseCard } from "./showcase-card";

export function SecurityBlock() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  return (
    <ShowcaseCard labelledBy="security-block-title">
      <BlockHeader
        action={<GlBadge icon="shield" variant="success">Protected</GlBadge>}
        description="Review sign-in preferences and account protection."
        id="security-block-title"
        title="Security settings" />

      <GlAlert variant="success" title="No security issues found" dismissible={false}>
        <GlAlertDescription>
          Last checked a few seconds ago
        </GlAlertDescription>
      </GlAlert>

      <div className="mt-5 grid gap-4">
        <GlToggle
          description="Require a second verification step when signing in."
          label="Two-factor authentication"
          onChange={setTwoFactorEnabled}
          value={twoFactorEnabled} />
        <div className="grid gap-2">
          <label className="font-semibold text-default" htmlFor="showcase-password">
            Confirm your password
          </label>
          <GlFormPasswordInput id="showcase-password" placeholder="Enter password" />
        </div>
        <GlButton block icon="lock" variant="confirm">Save security settings</GlButton>
      </div>
    </ShowcaseCard>
  );
}
