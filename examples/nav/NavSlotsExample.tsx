import { GlIcon } from "gitlab-ui-react/icon";
import {
  GlNav,
  GlNavButton,
  GlNavItem,
  GlNavItemAddon,
} from "gitlab-ui-react/nav";

export default function NavSlotsExample() {
  return (
    <GlNav aria-label="Work items" className="max-w-[16rem]">
      <GlNavItem selected>
        <GlNavButton href="#issues">
          <GlIcon name="issues" />
          Issues
          <GlNavItemAddon>12</GlNavItemAddon>
        </GlNavButton>
      </GlNavItem>
      <GlNavItem>
        <GlNavButton href="#merge-requests">
          <GlIcon name="merge-request" />
          Merge requests
          <GlNavItemAddon>3</GlNavItemAddon>
        </GlNavButton>
      </GlNavItem>
    </GlNav>
  );
}
