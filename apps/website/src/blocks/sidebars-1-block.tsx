import { GlAvatar, GlIcon, GlNav, GlNavButton, GlNavItem, GlSubNav, GlSubNavButton, GlSubNavItem } from "gitlab-ui-react";
import { ShowcaseCard } from "../components/showcase-card";

export function Sidebars1Block() {
  return (
    <ShowcaseCard className="flex gap-3">
      <GlNav className="flex-1 pr-3 border-r border-r-neutral-200 dark:border-r-neutral-800">
        <GlNavItem>
          <GlNavButton>
            <GlAvatar
              entityName="Norcleeh"
              shape="rect"
              size={24}/>
            Norcleeh
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="credit-card"/>
            Billing
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="notifications"/>
            Notifications
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="settings"/>
            Settings
          </GlNavButton>
          <GlSubNav>
            <GlSubNavItem>
              <GlSubNavButton>
                <GlIcon name="appearance"/>
                Appearance
              </GlSubNavButton>
            </GlSubNavItem>
            <GlSubNavItem>
              <GlSubNavButton>
                <GlIcon name="preferences"/>
                Preferences
              </GlSubNavButton>
            </GlSubNavItem>
          </GlSubNav>
        </GlNavItem>
      </GlNav>
      <GlNav className="flex-1">
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="dashboard"/>
            Dashboard
          </GlNavButton>
        </GlNavItem>
        <GlNavItem selected>
          <GlNavButton>
            <GlIcon name="chart"/>
            Monitor
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="users"/>
            Users
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="security-configuration"/>
            Security
          </GlNavButton>
        </GlNavItem>
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="policy"/>
            Logs
          </GlNavButton>
        </GlNavItem>
      </GlNav>
    </ShowcaseCard>
  );
}
