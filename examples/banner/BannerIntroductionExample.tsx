import { useState } from "react";
import {
  GlBanner,
  GlBannerActions,
  GlBannerDescription,
  GlBannerTitle,
} from "gitlab-ui-react/banner";
import { GlButton } from "gitlab-ui-react/button";

export default function BannerIntroductionExample() {
  const [visible, setVisible] = useState(true);

  if(!visible) {
    return <GlButton onClick={() => setVisible(true)}>Show introduction again</GlButton>;
  }

  return (
    <GlBanner onClose={() => setVisible(false)} variant="introduction">
      <GlBannerTitle>Get started with OPanel</GlBannerTitle>
      <GlBannerDescription>
        Connect a project to see its environments, deployments, and alerts.
      </GlBannerDescription>
      <GlBannerActions>
        <GlButton href="#get-started" variant="confirm">Get started</GlButton>
      </GlBannerActions>
    </GlBanner>
  );
}
