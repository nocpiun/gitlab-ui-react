import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { expect, fn, userEvent } from "storybook/test";
import GlAvatarLabeled from "./avatar-labeled";
import GlBadge from "../badge/badge";
import GlButton from "../button/button";
import GlIcon from "../icon/icon";

const metaRowStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  gap: "var(--gl-spacing-scale-2)",
  padding: "var(--gl-spacing-scale-1)",
};

const meta = {
  title: "UI/Base/Avatar Labeled",
  component: GlAvatarLabeled,
  args: {
    entityId: 123,
    entityName: "Norcleeh",
    fallbackOnError: false,
    inlineLabels: false,
    label: "Norcleeh",
    shape: "circle",
    size: 32,
    src: "/img/avatar.jpg",
    subLabel: "@NriotHrreion",
  },
  argTypes: {
    labelLinkAttrs: {
      control: false,
    },
    meta: {
      control: false,
    },
    onLabelLinkClick: {
      control: false,
    },
    shape: {
      control: "select",
      options: ["circle", "rect"],
    },
    size: {
      control: "select",
      options: [96, 64, 48, 32, 24, 16],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas avatar documentation](https://design.gitlab.com/components/avatar/) for usage guidance.",
      },
    },
  },
} satisfies Meta<typeof GlAvatarLabeled>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, canvasElement }) => {
    const avatar = canvasElement.querySelector("img.gl-avatar");

    await expect(avatar).toHaveAttribute("alt", "");
    await expect(avatar).toHaveAttribute("src", "/img/avatar.jpg");
    await expect(avatar).toHaveClass("gl-avatar-s32");
    await expect(canvas.getByText(args.label)).toHaveClass("gl-avatar-labeled-label");
    await expect(canvas.getByText(args.subLabel ?? "")).toHaveClass(
      "gl-avatar-labeled-sublabel",
    );
  },
};

export const WithInlineLabels: Story = {
  args: {
    inlineLabels: true,
  },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector(".gl-avatar-labeled-labels"),
    ).toHaveClass("inline-labels");
  },
};

export const WithBadges: Story = {
  args: {
    meta: (
      <div style={metaRowStyle}>
        <GlBadge variant="info">2FA</GlBadge>
        <GlBadge variant="danger">Blocked</GlBadge>
      </div>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("2FA")).toBeVisible();
    await expect(canvas.getByText("Blocked")).toBeVisible();
  },
};

export const WithAdditionalContent: Story = {
  args: {
    children: <GlButton className="gl-mt-3 gl-self-start" size="small">Follow</GlButton>,
    size: 64,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Follow" })).toBeVisible();
  },
};

export const WithLinks: Story = {
  args: {
    entityName: "GitLab",
    label: "GitLab.org / GitLab",
    labelLink: "#",
    meta: <GlIcon name="earth" variant="subtle" className="gl-px-1" />,
    onLabelLinkClick: fn(),
    shape: "rect",
    size: 48,
    subLabel: "",
  },
  play: async ({ args, canvas, canvasElement }) => {
    const avatar = canvasElement.querySelector(".gl-avatar");
    const labelLink = canvas.getByRole("link", { name: "GitLab.org / GitLab" });

    await expect(avatar).toHaveClass("gl-cursor-pointer");
    await expect(labelLink).toHaveClass("gl-avatar-link", "gl-link-meta");
    await userEvent.click(avatar as HTMLElement);
    await expect(args.onLabelLinkClick).toHaveBeenCalledOnce();
  },
};

export const WithLabelAndSubLabelLinks: Story = {
  args: {
    labelLink: "#",
    subLabelLink: "#activity",
  },
  play: async ({ args, canvas }) => {
    await expect(canvas.getByRole("link", { name: args.label })).toHaveAttribute(
      "href",
      "#",
    );
    await expect(canvas.getByRole("link", { name: args.subLabel })).toHaveAttribute(
      "href",
      "#activity",
    );
  },
};
