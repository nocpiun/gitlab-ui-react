import type { Meta, StoryObj } from "@storybook/react-vite";
import { Fragment, forwardRef, useState, type ComponentPropsWithoutRef } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import GlAvatar from "../avatar/avatar";
import GlButton from "../button/button";
import GlIcon from "../icon/icon";
import {
  GlCollapsibleNav,
  GlCollapsibleNavToggle,
  GlNavProvider,
} from "./collapsible-nav";
import GlNav, {
  GlNavButton,
  GlNavItem,
  GlNavItemAddon,
  GlSubNav,
  GlSubNavButton,
  GlSubNavItem,
} from "./nav";

const meta = {
  title: "UI/Base/Nav",
  component: GlNav,
  parameters: {
    docs: {
      description: {
        component:
          "Compound navigation items adapted from GitLab UI. Icons, avatars, labels, and addons are children of the same button or link; addon contents must remain non-interactive. Nested navigation supports uncontrolled and controlled disclosure state.",
      },
    },
  },
} satisfies Meta<typeof GlNav>;

export default meta;
type Story = StoryObj<typeof meta>;

const narrowNavStyle = { width: "12rem" };
const wideNavStyle = { width: "14rem" };

export const Default: Story = {
  render: () => (
    <GlNav aria-label="Project navigation" style={narrowNavStyle}>
      <GlNavItem><GlNavButton href="/project">Project overview</GlNavButton></GlNavItem>
      <GlNavItem><GlNavButton>Activity</GlNavButton></GlNavItem>
      <GlNavItem selected><GlNavButton>Selected</GlNavButton></GlNavItem>
      <GlNavItem disabled><GlNavButton>Disabled</GlNavButton></GlNavItem>
      <GlNavItem><GlNavButton href="">Empty href uses a button</GlNavButton></GlNavItem>
    </GlNav>
  ),
};

export const Selected: Story = {
  render: () => (
    <GlNav aria-label="Indicator examples" style={narrowNavStyle}>
      <GlNavItem selected>
        <GlNavButton href="/left">Left indicator</GlNavButton>
      </GlNavItem>
      <GlNavItem indicatorPosition="right" selected>
        <GlNavButton href="/right">
          Right indicator
        </GlNavButton>
      </GlNavItem>
      <GlNavItem indicatorPosition="bottom" selected>
        <GlNavButton href="/bottom">
          Bottom indicator
        </GlNavButton>
      </GlNavItem>
    </GlNav>
  ),
};

const disabledActivation = fn();

export const Disabled: Story = {
  render: () => (
    <GlNav aria-label="Disabled navigation" style={wideNavStyle}>
      <GlNavItem disabled>
        <GlNavButton onClick={disabledActivation}>Disabled button</GlNavButton>
      </GlNavItem>
      <GlNavItem disabled>
        <GlNavButton href="/disabled" onClick={disabledActivation}>
          Disabled link
        </GlNavButton>
      </GlNavItem>
      <GlNavItem disabled selected>
        <GlNavButton onClick={disabledActivation}>Disabled selected item</GlNavButton>
      </GlNavItem>
      <GlNavItem disabled>
        <GlNavButton>Disabled parent</GlNavButton>
        <GlSubNav>
          <GlSubNavItem>
            <GlSubNavButton href="/hidden">Hidden child</GlSubNavButton>
          </GlSubNavItem>
        </GlSubNav>
      </GlNavItem>
    </GlNav>
  ),
  play: async ({ canvas }) => {
    disabledActivation.mockClear();
    const button = canvas.getByRole("button", { name: "Disabled button" });
    const link = canvas.getByRole("link", { name: "Disabled link" });
    const selected = canvas.getByRole("button", { name: "Disabled selected item" });
    const parent = canvas.getByRole("button", { name: "Disabled parent" });
    const disabledItems = [button, link, selected, parent];

    await expect(button).toBeDisabled();
    await expect(link).toHaveAttribute("aria-disabled", "true");
    await expect(link).toHaveAttribute("tabindex", "-1");
    await expect(parent).toHaveAttribute("aria-expanded", "false");

    for(const item of disabledItems) {
      const color = getComputedStyle(item).color;
      const backgroundColor = getComputedStyle(item).backgroundColor;

      await expect(getComputedStyle(item).cursor).toBe("not-allowed");
      await userEvent.hover(item);
      await expect(getComputedStyle(item).cursor).toBe("not-allowed");
      await expect(getComputedStyle(item).color).toBe(color);
      await expect(getComputedStyle(item).backgroundColor).toBe(backgroundColor);
      await userEvent.unhover(item);
    }

    await userEvent.click(button);
    await userEvent.click(link);
    await userEvent.click(parent);

    await expect(disabledActivation).not.toHaveBeenCalled();
    await expect(parent).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByRole("link", { name: "Hidden child" })).not.toBeInTheDocument();
  },
};

export const WithIcon: Story = {
  render: () => (
    <GlNav aria-label="Project areas" style={narrowNavStyle}>
      <GlNavItem>
        <GlNavButton href="/issues"><GlIcon name="issues" />Issues</GlNavButton>
      </GlNavItem>
      <GlNavItem>
        <GlNavButton href="/merge-requests">
          <GlIcon name="merge-request" />Merge requests
        </GlNavButton>
      </GlNavItem>
    </GlNav>
  ),
};

const addonClick = fn();

export const WithSlots: Story = {
  render: () => (
    <GlNav aria-label="Navigation with slots" style={narrowNavStyle}>
      <GlNavItem>
        <GlNavButton onClick={addonClick}>
          <GlIcon name="issues" />
          Issues
          <GlNavItemAddon>12</GlNavItemAddon>
        </GlNavButton>
      </GlNavItem>
      <GlNavItem>
        <GlNavButton href="/quiet">
          Quiet item
          <GlNavItemAddon aria-hidden="true">•</GlNavItemAddon>
        </GlNavButton>
      </GlNavItem>
    </GlNav>
  ),
  play: async ({ canvas }) => {
    addonClick.mockClear();
    const button = canvas.getByRole("button", { name: "Issues 12" });
    const addon = canvas.getByText("12");

    await userEvent.click(addon);
    await expect(addonClick).toHaveBeenCalledTimes(1);
    await expect(button).toHaveFocus();
    await expect(addon.closest("button")).toBe(button);
    await expect(canvas.getByRole("link", { name: "Quiet item" })).toBeInTheDocument();
  },
};

export const Avatar: Story = {
  render: () => (
    <GlNav aria-label="Pinned projects" style={narrowNavStyle}>
      <GlNavItem>
        <GlNavButton href="/gitlab-org/gitlab">
          <GlAvatar alt="" entityId={1} entityName="GitLab" size={24} shape="rect" />
          GitLab
        </GlNavButton>
      </GlNavItem>
    </GlNav>
  ),
};

const escapeHandler = fn();
const pointerOverHandler = fn();
const pointerLeaveHandler = fn();

export const IsParent: Story = {
  render: () => (
    <GlNav aria-label="Nested project navigation" style={wideNavStyle}>
      <GlNavItem>
        <GlNavButton
          onEscape={escapeHandler}
          onPointerLeave={pointerLeaveHandler}
          onPointerOver={pointerOverHandler}>
          Plan
        </GlNavButton>
        <GlSubNav>
          <GlSubNavItem><GlSubNavButton href="/issues">Issues</GlSubNavButton></GlSubNavItem>
          <GlSubNavItem>
            <GlSubNavButton href="/milestones">
              Milestones
              <GlNavItemAddon>3</GlNavItemAddon>
            </GlSubNavButton>
          </GlSubNavItem>
        </GlSubNav>
      </GlNavItem>
    </GlNav>
  ),
  play: async ({ canvas }) => {
    escapeHandler.mockClear();
    pointerOverHandler.mockClear();
    pointerLeaveHandler.mockClear();
    const trigger = canvas.getByRole("button", { name: "Plan" });

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByRole("link", { name: "Milestones 3" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect(escapeHandler).toHaveBeenCalledTimes(1);
    await userEvent.hover(trigger);
    await expect(pointerOverHandler).toHaveBeenCalled();
    await userEvent.unhover(trigger);
    await expect(pointerLeaveHandler).toHaveBeenCalled();
    await userEvent.keyboard(" ");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};

export const DefaultOpen: Story = {
  render: () => (
    <GlNav aria-label="Default-open navigation" style={wideNavStyle}>
      <GlNavItem>
        <GlNavButton>Repository</GlNavButton>
        <GlSubNav defaultOpen>
          <GlSubNavItem><GlSubNavButton href="/files">Files</GlSubNavButton></GlSubNavItem>
        </GlSubNav>
      </GlNavItem>
    </GlNav>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Repository" }))
      .toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByRole("link", { name: "Files" })).toBeVisible();
  },
};

const controlledOpenChange = fn();

function ControlledSubNavExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="gl-flex gl-flex-col gl-items-start gl-gap-3">
      <GlButton
        aria-controls="controlled-sub-nav"
        aria-expanded={open}
        onClick={() => setOpen((currentOpen) => !currentOpen)}>
        {open ? "Close sub-navigation" : "Open sub-navigation"}
      </GlButton>
      <GlNav aria-label="Controlled navigation" style={wideNavStyle}>
        <GlNavItem>
          <GlNavButton>Manage</GlNavButton>
          <GlSubNav
            id="controlled-sub-nav"
            onOpenChange={(nextOpen) => {
              controlledOpenChange(nextOpen);
              setOpen(nextOpen);
            }}
            open={open}>
            <GlSubNavItem>
              <GlSubNavButton href="/members">Members</GlSubNavButton>
            </GlSubNavItem>
          </GlSubNav>
        </GlNavItem>
      </GlNav>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledSubNavExample />,
  play: async ({ canvas }) => {
    controlledOpenChange.mockClear();
    const trigger = canvas.getByRole("button", { name: "Manage" });
    const externalToggle = canvas.getByRole("button", { name: "Open sub-navigation" });

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(externalToggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(externalToggle);
    await expect(controlledOpenChange).not.toHaveBeenCalled();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(trigger).toHaveAttribute("aria-controls", "controlled-sub-nav");
    await expect(canvas.getByRole("button", { name: "Close sub-navigation" }))
      .toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByRole("link", { name: "Members" })).toBeVisible();

    await userEvent.click(trigger);
    await expect(controlledOpenChange).toHaveBeenLastCalledWith(false);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(trigger);
    await expect(controlledOpenChange).toHaveBeenLastCalledWith(true);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  },
};

export const ParentAddon: Story = {
  render: () => (
    <GlNav aria-label="Navigation with parent addon" style={wideNavStyle}>
      <GlNavItem>
        <GlNavButton>
          Plan
          <GlNavItemAddon>2</GlNavItemAddon>
        </GlNavButton>
        <GlSubNav>
          <GlSubNavItem><GlSubNavButton href="/issues">Issues</GlSubNavButton></GlSubNavItem>
        </GlSubNav>
      </GlNavItem>
    </GlNav>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Plan 2" });
    const addon = canvas.getByText("2");

    await expect(canvas.queryByTestId("nav-item-chevron")).not.toBeInTheDocument();
    await userEvent.click(addon);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(addon.closest("button")).toBe(trigger);
  },
};

const independentParentItems = [
  { childHref: "/issues", childLabel: "Issues", id: "plan", label: "Plan" },
  { childHref: "/files", childLabel: "Files", id: "code", label: "Code" },
];

function IndependentParentsExample() {
  const [reversed, setReversed] = useState(false);
  const items = reversed ? [...independentParentItems].reverse() : independentParentItems;

  return (
    <div className="gl-flex gl-flex-col gl-items-start gl-gap-3">
      <GlButton onClick={() => setReversed((current) => !current)}>Reverse order</GlButton>
      <GlNav aria-label="Independent navigation" style={wideNavStyle}>
        {items.map((item) => (
          <Fragment key={item.id}>
            <GlNavItem>
              <GlNavButton>{item.label}</GlNavButton>
              <GlSubNav>
                <GlSubNavItem>
                  <GlSubNavButton href={item.childHref}>{item.childLabel}</GlSubNavButton>
                </GlSubNavItem>
              </GlSubNav>
            </GlNavItem>
          </Fragment>
        ))}
        <GlNavItem disabled>
          <GlNavButton>Disabled parent</GlNavButton>
          <GlSubNav>
            <GlSubNavItem><GlSubNavButton href="/hidden">Hidden</GlSubNavButton></GlSubNavItem>
          </GlSubNav>
        </GlNavItem>
      </GlNav>
    </div>
  );
}

export const IndependentParents: Story = {
  render: () => <IndependentParentsExample />,
  play: async ({ canvas }) => {
    const reverse = canvas.getByRole("button", { name: "Reverse order" });
    let plan = canvas.getByRole("button", { name: "Plan" });
    let code = canvas.getByRole("button", { name: "Code" });
    const disabled = canvas.getByRole("button", { name: "Disabled parent" });

    await userEvent.click(plan);
    await expect(plan).toHaveAttribute("aria-expanded", "true");
    await expect(code).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(reverse);
    plan = canvas.getByRole("button", { name: "Plan" });
    code = canvas.getByRole("button", { name: "Code" });
    await expect(canvas.getAllByRole("button").indexOf(code))
      .toBeLessThan(canvas.getAllByRole("button").indexOf(plan));
    await expect(plan).toHaveAttribute("aria-expanded", "true");
    await expect(code).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(code);
    await expect(code).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(disabled);
    await expect(disabled).toHaveAttribute("aria-expanded", "false");
  },
};

const RouterAnchor = forwardRef<HTMLAnchorElement, ComponentPropsWithoutRef<"a">>(
  function RouterAnchor(props, ref) {
    return <a {...props} ref={ref} data-router-link="true" />;
  },
);

export const RouterLink: Story = {
  render: () => (
    <GlNav aria-label="Router navigation" style={narrowNavStyle}>
      <GlNavItem selected>
        <GlNavButton render={<RouterAnchor data-route="issues" />}>
          Issues
        </GlNavButton>
      </GlNavItem>
    </GlNav>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "Issues" });

    await expect(link).toHaveAttribute("data-router-link", "true");
    await expect(link).toHaveAttribute("data-route", "issues");
    await expect(link).toHaveAttribute("aria-current", "page");
  },
};

export const IconOnly: Story = {
  render: () => (
    <GlNav aria-label="Compact navigation">
      <GlNavItem>
        <GlNavButton aria-label="Issues" href="/issues" isIconOnly>
          <GlIcon name="issues" />
          Issues
          <GlNavItemAddon>12</GlNavItemAddon>
        </GlNavButton>
      </GlNavItem>
    </GlNav>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "Issues" });

    await expect(link).toHaveClass("gl-nav-item-is-icon-only");
    await expect(canvas.queryByText("12")).not.toBeInTheDocument();
  },
};

function CollapsibleNavItems({
  internalToggle = false,
  withSubNav = false,
}: {
  internalToggle?: boolean;
  withSubNav?: boolean;
}) {
  return (
    <>
      <GlNavItem selected>
        <GlNavButton href="/issues">
          <GlIcon name="issues" />
          Issues
          <GlNavItemAddon>12</GlNavItemAddon>
        </GlNavButton>
      </GlNavItem>
      {withSubNav ? (
        <GlNavItem>
          <GlNavButton>
            <GlIcon name="settings" />
            Manage
          </GlNavButton>
          <GlSubNav defaultOpen>
            <GlSubNavItem>
              <GlSubNavButton href="/members">Members</GlSubNavButton>
            </GlSubNavItem>
            <GlSubNavItem>
              <GlSubNavButton href="/integrations">Integrations</GlSubNavButton>
            </GlSubNavItem>
          </GlSubNav>
        </GlNavItem>
      ) : null}
      <GlNavItem>
        <GlNavButton>
          <GlIcon name="repository" />
          Repository
        </GlNavButton>
      </GlNavItem>
      {internalToggle ? (
        <GlNavItem><GlCollapsibleNavToggle /></GlNavItem>
      ) : null}
    </>
  );
}

export const ProviderRemoteControl: Story = {
  render: () => (
    <GlNavProvider navId="remote-project-navigation">
      <div className="gl-flex gl-items-start gl-gap-3">
        <GlCollapsibleNavToggle />
        <GlCollapsibleNav aria-label="Remote-controlled project navigation">
          {CollapsibleNavItems({})}
        </GlCollapsibleNav>
      </div>
    </GlNavProvider>
  ),
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole("button", { name: "Collapse sidebar" });
    const nav = canvas.getByRole("navigation", {
      name: "Remote-controlled project navigation",
    });

    await expect(toggle).toHaveAttribute("aria-controls", "remote-project-navigation");
    await expect(nav).toHaveAttribute("data-open", "true");
    const expandedIssues = canvas.getByRole("link", { name: "Issues 12" });
    const expandedBounds = expandedIssues.getBoundingClientRect();
    const expandedIconX = within(expandedIssues)
      .getByTestId("nav-item-start").getBoundingClientRect().x;
    await userEvent.click(toggle);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    expect(Math.round(within(expandedIssues).getByTestId("nav-item-start")
      .getBoundingClientRect().x)).toBe(Math.round(expandedIconX));
    await expect(nav).toHaveAttribute("data-open", "false");
    await expect(canvas.getByRole("button", { name: "Expand sidebar" }))
      .toHaveAttribute("aria-expanded", "false");
    const issues = canvas.getByRole("link", { name: "Issues" });
    await waitFor(() => {
      const bounds = issues.getBoundingClientRect();
      expect(Math.round(bounds.width)).toBe(Math.round(bounds.height));
      expect(Math.round(bounds.height)).toBe(Math.round(expandedBounds.height));
      expect(Math.round(bounds.x)).toBe(Math.round(expandedBounds.x));
      expect(Math.round(within(issues).getByTestId("nav-item-start")
        .getBoundingClientRect().x)).toBe(Math.round(expandedIconX));
    });
    await userEvent.hover(issues);
    const tooltip = await within(document.body).findByRole("tooltip", { name: "Issues" });
    await waitFor(() => expect(tooltip).toBeVisible());
    await userEvent.unhover(issues);
    const collapsedBounds = issues.getBoundingClientRect();
    await userEvent.click(canvas.getByRole("button", { name: "Expand sidebar" }));
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    const expandingBounds = issues.getBoundingClientRect();
    expect(expandingBounds.width).toBeGreaterThan(collapsedBounds.width);
    expect(expandingBounds.width).toBeLessThan(expandedBounds.width);
    expect(Math.round(expandingBounds.height)).toBe(Math.round(expandedBounds.height));
    expect(Math.round(expandingBounds.x)).toBe(Math.round(expandedBounds.x));
    expect(Math.round(within(issues).getByTestId("nav-item-start")
      .getBoundingClientRect().x)).toBe(Math.round(expandedIconX));
  },
};

export const InternalToggle: Story = {
  render: () => (
    <GlNavProvider defaultOpen navId="internal-toggle-navigation">
      <GlCollapsibleNav aria-label="Navigation with internal toggle">
        {CollapsibleNavItems({ internalToggle: true })}
      </GlCollapsibleNav>
    </GlNavProvider>
  ),
  play: async ({ canvas }) => {
    const nav = canvas.getByRole("navigation", { name: "Navigation with internal toggle" });
    await userEvent.click(canvas.getByRole("button", { name: "Collapse sidebar" }));
    await expect(nav).toHaveAttribute("data-open", "false");
    await expect(canvas.getByRole("button", { name: "Expand sidebar" }))
      .toHaveClass("gl-nav-item-is-icon-only");
  },
};

const preventedToggleClick = fn();

export const MultipleToggles: Story = {
  render: () => (
    <GlNavProvider defaultOpen={false} navId="multiple-toggle-navigation">
      <div className="gl-flex gl-items-start gl-gap-3">
        <GlCollapsibleNavToggle title="Header toggle" />
        <GlCollapsibleNav aria-label="Navigation with multiple toggles">
          {CollapsibleNavItems({ internalToggle: true })}
        </GlCollapsibleNav>
        <GlCollapsibleNavToggle title="Footer toggle" />
        <GlCollapsibleNavToggle
          collapseLabel="Blocked collapse"
          expandLabel="Blocked expand"
          onClick={(event) => {
            preventedToggleClick();
            event.preventDefault();
          }} />
      </div>
    </GlNavProvider>
  ),
  play: async ({ canvas }) => {
    preventedToggleClick.mockClear();
    const nav = canvas.getByRole("navigation", { name: "Navigation with multiple toggles" });
    await userEvent.click(canvas.getByRole("button", { name: "Blocked expand" }));
    await expect(preventedToggleClick).toHaveBeenCalledOnce();
    await expect(nav).toHaveAttribute("data-open", "false");
    const toggles = canvas.getAllByRole("button", { name: "Expand sidebar" });
    await expect(toggles).toHaveLength(3);
    await userEvent.click(toggles[0]);
    await expect(canvas.getAllByRole("button", { name: "Collapse sidebar" })).toHaveLength(3);
  },
};

function ControlledCollapsibleNavExample() {
  const [open, setOpen] = useState(false);

  return (
    <GlNavProvider open={open} onOpenChange={setOpen} navId="controlled-collapsible-navigation">
      <div className="gl-flex gl-flex-col gl-items-start gl-gap-3">
        <GlCollapsibleNavToggle />
        <span aria-live="polite">Sidebar is {open ? "expanded" : "collapsed"}</span>
        <GlCollapsibleNav aria-label="Controlled collapsible navigation">
          {CollapsibleNavItems({ internalToggle: true })}
        </GlCollapsibleNav>
      </div>
    </GlNavProvider>
  );
}

export const CollapsibleControlled: Story = {
  name: "Collapsible / Controlled",
  render: () => <ControlledCollapsibleNavExample />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Sidebar is collapsed")).toBeInTheDocument();
    await userEvent.click(canvas.getAllByRole("button", { name: "Expand sidebar" })[0]);
    await expect(canvas.getByText("Sidebar is expanded")).toBeInTheDocument();
  },
};

export const SubNavFlyout: Story = {
  render: () => (
    <GlNavProvider defaultOpen={false} navId="flyout-navigation">
      <GlCollapsibleNavToggle />
      <GlCollapsibleNav aria-label="Navigation with sub-navigation flyout">
        {CollapsibleNavItems({ withSubNav: true })}
      </GlCollapsibleNav>
    </GlNavProvider>
  ),
  play: async ({ canvas }) => {
    const parent = canvas.getByRole("button", { name: "Manage" });
    parent.focus();
    await expect(within(document.body).queryByRole("link", { name: "Members" }))
      .not.toBeInTheDocument();
    await userEvent.click(parent);
    await expect(within(document.body).queryByRole("link", { name: "Members" }))
      .not.toBeInTheDocument();
    parent.click();
    const synthesizedFlyout = await within(document.body).findByRole("link", { name: "Members" });
    await waitFor(() => expect(synthesizedFlyout).toBeVisible());
    parent.click();
    await waitFor(() => expect(within(document.body).queryByRole("dialog"))
      .not.toBeInTheDocument());
    await userEvent.hover(parent);
    const members = await within(document.body).findByRole("link", { name: "Members" });
    await waitFor(() => expect(members).toBeVisible());
    const flyout = within(document.body).getByRole("dialog");
    const flyoutStyleProbe = flyout.cloneNode(false) as HTMLElement;
    document.body.append(flyoutStyleProbe);
    flyoutStyleProbe.setAttribute("data-starting-style", "");
    expect(getComputedStyle(flyoutStyleProbe).transitionDuration).toBe("0.15s");
    flyoutStyleProbe.removeAttribute("data-starting-style");
    flyoutStyleProbe.setAttribute("data-ending-style", "");
    expect(getComputedStyle(flyoutStyleProbe).transitionDuration).toBe("0s");
    flyoutStyleProbe.remove();
    await userEvent.unhover(parent);
    await waitFor(() => expect(within(document.body).queryByRole("dialog"))
      .not.toBeInTheDocument());
    parent.focus();
    await userEvent.keyboard("{Enter}");
    const integrations = await within(document.body).findByRole("link", { name: "Integrations" });
    await waitFor(() => expect(integrations).toBeVisible());
    integrations.focus();
    await userEvent.keyboard("{Escape}");
    await expect(parent).toHaveFocus();
    parent.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }));
    parent.click();
    const touchFlyout = await within(document.body).findByRole("link", { name: "Members" });
    await waitFor(() => expect(touchFlyout).toBeVisible());
    await userEvent.keyboard("{Escape}");
    await userEvent.click(canvas.getByRole("button", { name: "Expand sidebar" }));
    await expect(canvas.getByRole("button", { name: "Manage" }))
      .toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByRole("link", { name: "Members" })).toBeVisible();
  },
};

function MobileOverlayExample() {
  const [open, setOpen] = useState(false);

  return (
    <GlNavProvider open={open} onOpenChange={setOpen} navId="mobile-navigation">
      <GlButton onClick={() => setOpen(true)}>Open programmatically</GlButton>
      <GlButton onClick={() => setOpen(false)}>Close programmatically</GlButton>
      <GlCollapsibleNavToggle />
      <GlCollapsibleNav className="gl-mt-4" aria-label="Mobile project navigation">
        {CollapsibleNavItems({ internalToggle: true })}
      </GlCollapsibleNav>
    </GlNavProvider>
  );
}

export const MobileOverlay: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  render: () => <MobileOverlayExample />,
  play: async ({ canvas }) => {
    const programmaticOpener = canvas.getByRole("button", { name: "Open programmatically" });
    const programmaticCloser = canvas.getByRole("button", { name: "Close programmatically" });
    const externalToggle = canvas.getByRole("button", { name: "Expand sidebar" });
    await userEvent.click(programmaticOpener);
    const nav = canvas.getByRole("navigation", { name: "Mobile project navigation" });
    const firstLink = canvas.getByRole("link", { name: "Issues 12" });
    const internalToggle = within(nav).getByRole("button", { name: "Collapse sidebar" });
    const backdrop = within(document.body).getByTestId("collapsible-nav-backdrop");
    await expect(nav).toHaveAttribute("data-open", "true");
    await expect(backdrop).toHaveAttribute("data-open", "true");
    await expect(document.body.style.overflow).toBe("hidden");
    const drawerStyleProbe = document.createElement("aside");
    const drawerBodyStyleProbe = document.createElement("div");
    const drawerContentStyleProbe = document.createElement("div");
    drawerStyleProbe.className = "gl-drawer gl-drawer-default";
    drawerBodyStyleProbe.className = "gl-drawer-body";
    drawerBodyStyleProbe.append(drawerContentStyleProbe);
    drawerStyleProbe.append(drawerBodyStyleProbe);
    document.body.append(drawerStyleProbe);
    const navStyle = getComputedStyle(nav);
    const drawerStyle = getComputedStyle(drawerStyleProbe);
    const navListStyle = getComputedStyle(nav.querySelector(":scope > .gl-nav-list")!);
    const indicatorStyle = getComputedStyle(firstLink, "::before");
    const drawerContentStyle = getComputedStyle(drawerContentStyleProbe);
    expect(navStyle.backgroundColor).toBe(drawerStyle.backgroundColor);
    expect(navStyle.boxShadow).toBe(drawerStyle.boxShadow);
    expect(navStyle.fontSize).toBe(drawerStyle.fontSize);
    expect(navStyle.lineHeight).toBe(drawerStyle.lineHeight);
    expect(navStyle.borderTopRightRadius).toBe(drawerStyle.borderTopLeftRadius);
    expect(navListStyle.paddingTop).toBe(drawerContentStyle.paddingTop);
    expect(navListStyle.paddingRight).toBe(drawerContentStyle.paddingRight);
    expect(Number.parseFloat(indicatorStyle.left))
      .toBe(-Number.parseFloat(navListStyle.paddingLeft));
    drawerStyleProbe.remove();
    await waitFor(() => expect(firstLink).toHaveFocus());
    await userEvent.click(canvas.getByRole("button", { name: "Repository" }));
    await expect(nav).toHaveAttribute("data-open", "true");
    firstLink.focus();
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    await expect(internalToggle).toHaveFocus();
    await userEvent.tab();
    await expect(firstLink).toHaveFocus();
    programmaticCloser.click();
    await waitFor(() => expect(nav).toHaveAttribute("data-open", "false"));
    await waitFor(() => expect(programmaticOpener).toHaveFocus());
    await expect(document.body.style.overflow).not.toBe("hidden");
    externalToggle.click();
    await waitFor(() => expect(nav).toHaveAttribute("data-open", "true"));
    await waitFor(() => expect(firstLink).toHaveFocus());
    await userEvent.click(backdrop);
    await expect(nav).toHaveAttribute("data-open", "false");
    await expect(externalToggle).toHaveFocus();
    await userEvent.click(externalToggle);
    await userEvent.keyboard("{Escape}");
    await expect(externalToggle).toHaveFocus();
  },
};

export const MobileOverlayDefaultOpen: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  render: () => (
    <GlNavProvider defaultOpen navId="default-open-mobile-navigation">
      <GlCollapsibleNavToggle />
      <GlCollapsibleNav aria-label="Initially open mobile navigation">
        {CollapsibleNavItems({ internalToggle: true })}
      </GlCollapsibleNav>
    </GlNavProvider>
  ),
  play: async ({ canvas }) => {
    const externalToggle = canvas.getAllByRole("button", { name: "Collapse sidebar" })
      .find((element) => element.dataset.glCollapsibleNavToggle === "external")!;
    const firstLink = canvas.getByRole("link", { name: "Issues 12" });

    await waitFor(() => expect(firstLink).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    await expect(externalToggle).toHaveAccessibleName("Expand sidebar");
    await expect(externalToggle).toHaveFocus();
  },
};

export const MobileOverlayRtl: Story = {
  name: "Collapsible / Mobile Overlay / RTL",
  parameters: {
    docs: {
      description: {
        story: "Use either toggle to inspect the mobile drawer animation from the RTL logical start edge.",
      },
    },
    viewport: { defaultViewport: "mobile1" },
  },
  render: () => (
    <div dir="rtl">
      <GlNavProvider defaultOpen navId="rtl-mobile-navigation">
        <GlCollapsibleNavToggle />
        <GlCollapsibleNav aria-label="RTL mobile project navigation">
          {CollapsibleNavItems({ internalToggle: true })}
        </GlCollapsibleNav>
      </GlNavProvider>
    </div>
  ),
  play: async ({ canvas }) => {
    const nav = canvas.getByRole("navigation", { name: "RTL mobile project navigation" });
    const internalToggle = within(nav).getByRole("button", { name: "Collapse sidebar" });

    await expect(getComputedStyle(nav).direction).toBe("rtl");
    await userEvent.click(internalToggle);
    await expect(nav).toHaveAttribute("data-open", "false");
    await waitFor(() => {
      const closedTransform = new DOMMatrixReadOnly(getComputedStyle(nav).transform);
      expect(closedTransform.m41).toBeGreaterThan(0);
    });

    await userEvent.click(canvas.getByRole("button", { name: "Expand sidebar" }));
    await expect(nav).toHaveAttribute("data-open", "true");
  },
};
