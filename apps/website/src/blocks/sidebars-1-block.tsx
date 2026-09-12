import { GlAvatar } from "gitlab-ui-react/avatar";
import { GlIcon } from "gitlab-ui-react/icon";
import {
  GlNav,
  GlNavButton,
  GlNavItem,
  GlSubNav,
  GlSubNavButton,
  GlSubNavItem,
} from "gitlab-ui-react/nav";
import { ShowcaseCard } from "../components/showcase-card";
import { type Locale } from "../i18n/config";
import { showcaseContent } from "../i18n/showcase-content";

type Sidebars1BlockProps = {
  locale: Locale;
};

export function Sidebars1Block({ locale }: Sidebars1BlockProps) {
  const content = showcaseContent[locale].sidebars1;

  return (
    <ShowcaseCard className="flex flex-col gap-3 sm:flex-row">
      <GlNav
        aria-label={content.accountNavigationLabel}
        className="flex-1 border-b border-section pb-3 sm:border-r sm:border-b-0 sm:pr-3 sm:pb-0">
        <GlNavItem>
          <GlNavButton>
            <GlAvatar
              entityName={content.user}
              shape="rect"
              size={24}/>
            {content.user}
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="credit-card"/>
            {content.billing}
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="notifications"/>
            {content.notifications}
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="settings"/>
            {content.settings}
          </GlNavButton>
          <GlSubNav>
            <GlSubNavItem>
              <GlSubNavButton>
                <GlIcon name="appearance"/>
                {content.appearance}
              </GlSubNavButton>
            </GlSubNavItem>
            <GlSubNavItem>
              <GlSubNavButton>
                <GlIcon name="preferences"/>
                {content.preferences}
              </GlSubNavButton>
            </GlSubNavItem>
          </GlSubNav>
        </GlNavItem>
      </GlNav>
      <GlNav aria-label={content.adminNavigationLabel} className="flex-1">
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="dashboard"/>
            {content.dashboard}
          </GlNavButton>
        </GlNavItem>
        <GlNavItem selected>
          <GlNavButton>
            <GlIcon name="chart"/>
            {content.monitor}
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="users"/>
            {content.users}
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="security-configuration"/>
            {content.security}
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="policy"/>
            {content.logs}
          </GlNavButton>
        </GlNavItem>
      </GlNav>
    </ShowcaseCard>
  );
}
