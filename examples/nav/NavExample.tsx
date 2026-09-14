import {
  GlNav,
  GlNavButton,
  GlNavItem,
  GlNavItemAddon,
  GlSubNav,
  GlSubNavButton,
  GlSubNavItem,
} from "gitlab-ui-react/nav";

export default function NavExample() {
  return (
    <GlNav aria-label="Project navigation" className="max-w-[16rem]">
      <GlNavItem selected>
        <GlNavButton href="#overview">Overview</GlNavButton>
      </GlNavItem>
      <GlNavItem>
        <GlNavButton>
          Plan
          <GlNavItemAddon>4</GlNavItemAddon>
        </GlNavButton>
        <GlSubNav defaultOpen>
          <GlSubNavItem>
            <GlSubNavButton href="#issues">Issues</GlSubNavButton>
          </GlSubNavItem>
          <GlSubNavItem>
            <GlSubNavButton href="#milestones">Milestones</GlSubNavButton>
          </GlSubNavItem>
        </GlSubNav>
      </GlNavItem>
      <GlNavItem disabled>
        <GlNavButton>Settings</GlNavButton>
      </GlNavItem>
    </GlNav>
  );
}
