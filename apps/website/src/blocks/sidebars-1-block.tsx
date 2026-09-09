import { GlAvatar, GlIcon, GlNav, GlNavButton, GlNavItem, GlSubNav, GlSubNavButton, GlSubNavItem } from "gitlab-ui-react";
import { ShowcaseCard } from "../components/showcase-card";

export function Sidebars1Block() {
  return (
    <ShowcaseCard className="flex flex-col gap-3 sm:flex-row">
      <GlNav className="flex-1 border-b border-section pb-3 sm:border-r sm:border-b-0 sm:pr-3 sm:pb-0">
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
