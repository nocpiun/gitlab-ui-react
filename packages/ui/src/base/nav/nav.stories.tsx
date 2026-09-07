import type { Meta, StoryObj } from "@storybook/react-vite";
import { forwardRef, useState, type ComponentPropsWithoutRef } from "react";
import { expect, fn, userEvent } from "storybook/test";
import GlAvatar from "../avatar/avatar";
import GlButton from "../button/button";
import GlIcon from "../icon/icon";
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
          "Compound navigation items adapted from GitLab UI. Icons, avatars, labels, and addons are children of the same button or link; nested navigation supports uncontrolled and controlled disclosure state.",
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
      <GlNavItem><GlNavButton type="button">Activity</GlNavButton></GlNavItem>
      <GlNavItem selected><GlNavButton type="button">Selected</GlNavButton></GlNavItem>
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

export const IndependentParents: Story = {
  render: () => (
    <GlNav aria-label="Independent navigation" style={wideNavStyle}>
      <GlNavItem>
        <GlNavButton>Plan</GlNavButton>
        <GlSubNav>
          <GlSubNavItem><GlSubNavButton href="/issues">Issues</GlSubNavButton></GlSubNavItem>
        </GlSubNav>
      </GlNavItem>
      <GlNavItem>
        <GlNavButton>Code</GlNavButton>
        <GlSubNav>
          <GlSubNavItem><GlSubNavButton href="/files">Files</GlSubNavButton></GlSubNavItem>
        </GlSubNav>
      </GlNavItem>
      <GlNavItem>
        <GlNavButton disabled>Disabled parent</GlNavButton>
        <GlSubNav>
          <GlSubNavItem><GlSubNavButton href="/hidden">Hidden</GlSubNavButton></GlSubNavItem>
        </GlSubNav>
      </GlNavItem>
    </GlNav>
  ),
  play: async ({ canvas }) => {
    const plan = canvas.getByRole("button", { name: "Plan" });
    const code = canvas.getByRole("button", { name: "Code" });
    const disabled = canvas.getByRole("button", { name: "Disabled parent" });

    await userEvent.click(plan);
    await userEvent.click(code);
    await expect(plan).toHaveAttribute("aria-expanded", "true");
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
