import {
  GlAvatar,
  GlBadge,
  GlIcon,
  GlNav,
  GlNavButton,
  GlNavItem,
  GlNavItemAddon,
  GlSubNav,
  GlSubNavButton,
  GlSubNavItem,
} from "gitlab-ui-react";
import { ShowcaseCard } from "../components/showcase-card";

export function Sidebars2Block() {
  return (
    <ShowcaseCard className="flex flex-col gap-3 sm:flex-row">
      <GlNav
        aria-label="Workspace navigation"
        className="flex-1 border-b border-section pb-3 sm:border-r sm:border-b-0 sm:pr-3 sm:pb-0">
        <GlNavItem selected>
          <GlNavButton>
            <GlIcon name="home" />
            Home
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="project" />
            Projects
            <GlNavItemAddon>
              <GlBadge>8</GlBadge>
            </GlNavItemAddon>
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="group" />
            Groups
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="todo-done" />
            To-do
            <GlNavItemAddon>
              <GlBadge variant="info">3</GlBadge>
            </GlNavItemAddon>
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="compass" />
            Explore
          </GlNavButton>
        </GlNavItem>
      </GlNav>

      <GlNav aria-label="Project navigation" className="flex-1">
        <GlNavItem>
          <GlNavButton>
            <GlAvatar entityName="OPanel" shape="rect" size={24} />
            OPanel
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="overview" />
            Overview
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="planning" />
            Plan
          </GlNavButton>
          <GlSubNav defaultOpen>
            <GlSubNavItem selected>
              <GlSubNavButton>
                <GlIcon name="issues" />
                Issues
                <GlNavItemAddon>
                  <GlBadge>12</GlBadge>
                </GlNavItemAddon>
              </GlSubNavButton>
            </GlSubNavItem>
            <GlSubNavItem>
              <GlSubNavButton>
                <GlIcon name="issue-open-m" />
                Boards
              </GlSubNavButton>
            </GlSubNavItem>
          </GlSubNav>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="code" />
            Code
          </GlNavButton>
          <GlSubNav>
            <GlSubNavItem>
              <GlSubNavButton>
                <GlIcon name="merge-request" />
                Merge requests
              </GlSubNavButton>
            </GlSubNavItem>
            <GlSubNavItem>
              <GlSubNavButton>
                <GlIcon name="repository" />
                Repository
              </GlSubNavButton>
            </GlSubNavItem>
          </GlSubNav>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="rocket" />
            Build
          </GlNavButton>
        </GlNavItem>
      </GlNav>
    </ShowcaseCard>
  );
}
