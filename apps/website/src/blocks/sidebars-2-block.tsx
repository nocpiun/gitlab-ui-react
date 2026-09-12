import { GlAvatar } from "gitlab-ui-react/avatar";
import { GlBadge } from "gitlab-ui-react/badge";
import { GlIcon } from "gitlab-ui-react/icon";
import {
  GlNav,
  GlNavButton,
  GlNavItem,
  GlNavItemAddon,
  GlSubNav,
  GlSubNavButton,
  GlSubNavItem,
} from "gitlab-ui-react/nav";
import { ShowcaseCard } from "../components/showcase-card";
import { type Locale } from "../i18n/config";
import { showcaseContent } from "../i18n/showcase-content";

type Sidebars2BlockProps = {
  locale: Locale;
};

export function Sidebars2Block({ locale }: Sidebars2BlockProps) {
  const content = showcaseContent[locale].sidebars2;

  return (
    <ShowcaseCard className="flex flex-col gap-3 sm:flex-row">
      <GlNav
        aria-label={content.workspaceNavigationLabel}
        className="flex-1 border-b border-section pb-3 sm:border-r sm:border-b-0 sm:pr-3 sm:pb-0">
        <GlNavItem selected>
          <GlNavButton>
            <GlIcon name="home" />
            {content.home}
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="project" />
            {content.projects}
            <GlNavItemAddon>
              <GlBadge>8</GlBadge>
            </GlNavItemAddon>
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="group" />
            {content.groups}
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="todo-done" />
            {content.todo}
            <GlNavItemAddon>
              <GlBadge variant="info">3</GlBadge>
            </GlNavItemAddon>
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="compass" />
            {content.explore}
          </GlNavButton>
        </GlNavItem>
      </GlNav>

      <GlNav aria-label={content.projectNavigationLabel} className="flex-1">
        <GlNavItem>
          <GlNavButton>
            <GlAvatar entityName="OPanel" shape="rect" size={24} />
            OPanel
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="overview" />
            {content.overview}
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="planning" />
            {content.plan}
          </GlNavButton>
          <GlSubNav defaultOpen>
            <GlSubNavItem selected>
              <GlSubNavButton>
                <GlIcon name="issues" />
                {content.issues}
                <GlNavItemAddon>
                  <GlBadge>12</GlBadge>
                </GlNavItemAddon>
              </GlSubNavButton>
            </GlSubNavItem>
            <GlSubNavItem>
              <GlSubNavButton>
                <GlIcon name="issue-open-m" />
                {content.boards}
              </GlSubNavButton>
            </GlSubNavItem>
          </GlSubNav>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="code" />
            {content.code}
          </GlNavButton>
          <GlSubNav>
            <GlSubNavItem>
              <GlSubNavButton>
                <GlIcon name="merge-request" />
                {content.mergeRequests}
              </GlSubNavButton>
            </GlSubNavItem>
            <GlSubNavItem>
              <GlSubNavButton>
                <GlIcon name="repository" />
                {content.repository}
              </GlSubNavButton>
            </GlSubNavItem>
          </GlSubNav>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="rocket" />
            {content.build}
          </GlNavButton>
        </GlNavItem>
      </GlNav>
    </ShowcaseCard>
  );
}
