import { useState } from "react";
import {
  GlBanner,
  GlBannerActions,
  GlBannerDescription,
  GlBannerTitle,
} from "gitlab-ui-react/banner";
import { GlButton } from "gitlab-ui-react/button";

export default function BannerExample() {
  const [visible, setVisible] = useState(true);

  if(!visible) {
    return <GlButton onClick={() => setVisible(true)}>Show promotion banner again</GlButton>;
  }

  return (
    <GlBanner onClose={() => setVisible(false)}>
      <GlBannerTitle>Plan work with issue boards</GlBannerTitle>
      <GlBannerDescription>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua.
        </p>
      </GlBannerDescription>
      <GlBannerActions>
        <GlButton href="#issue-boards" variant="confirm">Explore issue boards</GlButton>
      </GlBannerActions>
    </GlBanner>
  );
}
