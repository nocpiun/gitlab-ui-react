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
    return <GlButton onClick={() => setVisible(true)}>Show banner again</GlButton>;
  }

  return (
    <GlBanner onClose={() => setVisible(false)}>
      <GlBannerTitle>Explore OPanel</GlBannerTitle>
      <GlBannerDescription>
        Organize project operations in one place and keep your team informed.
      </GlBannerDescription>
      <GlBannerActions>
        <GlButton href="#opanel" variant="confirm">Explore OPanel</GlButton>
      </GlBannerActions>
    </GlBanner>
  );
}
