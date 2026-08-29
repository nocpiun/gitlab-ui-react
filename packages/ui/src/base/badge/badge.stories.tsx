import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import iconsInfo from "@gitlab/svgs/dist/icons.json";
import GlBadge, { type GlBadgeIconSize, type GlBadgeVariant } from "./badge";

const variants = [
  "neutral",
  "info",
  "success",
  "warning",
  "danger",
  "tier",
] satisfies GlBadgeVariant[];

const iconSizes = ["sm", "md"] satisfies GlBadgeIconSize[];

const collectionStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
};

const meta = {
  title: "UI/Base/Badge",
  component: GlBadge,
  args: {
    active: false,
    children: "TestBadge",
    disabled: false,
    href: undefined,
    icon: undefined,
    iconOpticallyAligned: false,
    iconSize: "md",
    target: "_self",
    variant: "neutral",
  },
  argTypes: {
    icon: {
      control: "select",
      options: ["", ...iconsInfo.icons],
    },
    iconSize: {
      control: "select",
      options: iconSizes,
    },
    render: {
      control: false,
    },
    variant: {
      control: "select",
      options: variants,
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas badge documentation](https://design.gitlab.com/components/badge/) for usage guidance.",
      },
    },
  },
} satisfies Meta<typeof GlBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const badge = canvas.getByText("TestBadge").closest(".gl-badge");

    await expect(badge).toHaveClass("gl-badge", "badge", "badge-pill", "badge-neutral");
    await expect(badge?.tagName).toBe("SPAN");
  },
};

export const Variants: Story = {
  argTypes: {
    variant: {
      control: false,
    },
  },
  render: (args) => (
    <div style={collectionStyle}>
      {variants.map((variant) => (
        <GlBadge {...args} key={variant} variant={variant}>
          {variant}
        </GlBadge>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    for(const variant of variants) {
      await expect(canvas.getByText(variant).closest(".gl-badge")).toHaveClass(`badge-${variant}`);
    }
  },
};

export const Actionable: Story = {
  argTypes: {
    variant: {
      control: false,
    },
  },
  args: {
    href: "#foo",
    onClick: fn(),
  },
  render: (args) => (
    <div style={collectionStyle}>
      {variants.map((variant) => (
        <GlBadge {...args} key={variant} variant={variant}>
          {variant}
        </GlBadge>
      ))}
    </div>
  ),
  play: async ({ args, canvas }) => {
    const badge = canvas.getByRole("link", { name: "info" });

    await userEvent.click(badge);
    await expect(badge).toHaveAttribute("href", "#foo");
    await expect(badge).toHaveClass("badge-info");
    await expect(badge).not.toHaveClass("gl-link");
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const DisabledLink: Story = {
  args: {
    children: "Disabled badge",
    disabled: true,
    href: "/projects",
    onClick: fn(),
  },
  play: async ({ args, canvas }) => {
    const badge = canvas.getByRole("link", { name: "Disabled badge" });

    await userEvent.click(badge);
    await expect(badge).toHaveAttribute("aria-disabled", "true");
    await expect(badge).toHaveAttribute("tabindex", "-1");
    await expect(badge).toHaveClass("disabled");
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const BadgeIcon: Story = {
  argTypes: {
    icon: {
      control: false,
    },
    iconSize: {
      control: false,
    },
  },
  render: (args) => (
    <div style={collectionStyle}>
      <GlBadge {...args} variant="tier" icon="license">With icon</GlBadge>
      <GlBadge {...args} variant="success" icon="issue-open-m">With status open</GlBadge>
      <GlBadge {...args} variant="info" icon="issue-close">With status closed</GlBadge>
      <GlBadge {...args} variant="warning" icon="status-alert" iconSize="sm">With sm icon</GlBadge>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("issue-open-m-icon")).toHaveClass("gl-badge-icon", "-gl-ml-2");
    await expect(canvas.getByTestId("status-alert-icon")).toHaveClass("s12");
  },
};

export const IconOpticallyAligned: Story = {
  argTypes: {
    icon: {
      control: false,
    },
  },
  render: (args) => (
    <div style={collectionStyle}>
      <GlBadge {...args} icon="status_canceled" iconOpticallyAligned>Canceled</GlBadge>
      <GlBadge {...args} icon="status_created" iconOpticallyAligned>Created</GlBadge>
      <GlBadge {...args} variant="danger" icon="status_failed" iconOpticallyAligned>Failed</GlBadge>
      <GlBadge {...args} icon="status_manual" iconOpticallyAligned>Manual</GlBadge>
      <GlBadge {...args} variant="success" icon="status_success" iconOpticallyAligned>Passed</GlBadge>
      <GlBadge {...args} variant="warning" icon="status_pending" iconOpticallyAligned>Pending</GlBadge>
      <GlBadge {...args} icon="status_preparing" iconOpticallyAligned>Preparing</GlBadge>
      <GlBadge {...args} variant="info" icon="status_running" iconOpticallyAligned>Running</GlBadge>
      <GlBadge {...args} icon="status_scheduled" iconOpticallyAligned>Scheduled</GlBadge>
      <GlBadge {...args} icon="status_skipped" iconOpticallyAligned>Skipped</GlBadge>
      <GlBadge {...args} icon="status-waiting" iconOpticallyAligned>Waiting for resource</GlBadge>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("status_success-icon")).toHaveClass("-gl-ml-2");
  },
};

export const IconOnly: Story = {
  args: {
    "aria-label": "Scheduled",
    children: undefined,
    icon: "calendar",
    variant: "success",
  },
  play: async ({ canvas }) => {
    const badge = canvas.getByRole("img", { name: "Scheduled" });

    await expect(badge).toHaveClass("!gl-px-2");
    await expect(badge.querySelector(".gl-badge-content")).toBeNull();
  },
};

export const Truncated: Story = {
  argTypes: {
    children: {
      control: false,
    },
  },
  render: (args) => (
    <div>
      {/* Badges inside normal flow should not shrink by default */}
      <div className="gl-mb-5 gl-border" style={{ width: 50 }}>
        <GlBadge {...args}>Regular text</GlBadge>
      </div>

      <div className="gl-mb-5 gl-border" style={{ width: 50 }}>
        <GlBadge {...args} icon="spinner">Regular text</GlBadge>
      </div>

      {/* Badges inside flexbox should not shrink by default */}
      <div className="gl-flex gl-mb-5 gl-border" style={{ width: 200 }}>
        <GlBadge {...args}>Regular text</GlBadge>
        <GlBadge {...args}>Regular text</GlBadge>
        <GlBadge {...args}>Regular text</GlBadge>
        <GlBadge {...args}>Regular text</GlBadge>
        <GlBadge {...args}>Regular text</GlBadge>
      </div>

      {/* Content inside badge should shrink to container width when gl-truncate applied */}
      <div className="gl-mb-5 gl-border" style={{ width: 80 }}>
        <GlBadge {...args}><span className="gl-truncate">Truncated text</span></GlBadge>
      </div>
      <div className="gl-mb-5 gl-border" style={{ width: 80 }}>
        <GlBadge {...args} icon="spinner"><span className="gl-truncate">Truncated text</span></GlBadge>
      </div>

      {/* 1 and 2 should match in width (20px) */}
      <div className="gl-mb-5 gl-border" style={{ width: 22 }}>
        <GlBadge {...args}>1</GlBadge>
      </div>
      <div className="gl-mb-5 gl-border" style={{ width: 22 }}>
        <GlBadge {...args}>2</GlBadge>
      </div>
    </div>
  ),
};
