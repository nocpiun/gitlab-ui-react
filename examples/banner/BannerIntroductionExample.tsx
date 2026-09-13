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
    return <GlButton onClick={() => setVisible(true)}>Show introduction banner again</GlButton>;
  }

  return (
    <GlBanner onClose={() => setVisible(false)} variant="introduction">
      <GlBannerTitle>Set up Service Desk</GlBannerTitle>
      <GlBannerDescription>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua.
        </p>
      </GlBannerDescription>
      <GlBannerActions>
        <GlButton href="#service-desk" variant="confirm">Set up Service Desk</GlButton>
      </GlBannerActions>
    </GlBanner>
  );
}
