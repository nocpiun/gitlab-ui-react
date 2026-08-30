import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
} from "react";
import GlAvatar from "../avatar/avatar";
import GlAvatarLabeled from "../avatar-labeled/avatar-labeled";
import GlAvatarLink from "./avatar-link";

type RouterLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & { to: string };

const RouterLink = forwardRef<HTMLAnchorElement, RouterLinkProps>(function RouterLink({
  to,
  ...props
}, ref) {
  return <a {...props} ref={ref} href={to} />;
});

const meta = {
  title: "UI/Base/Avatar Link",
  component: GlAvatarLink,
  args: {
    disabled: false,
    href: "#",
    onClick: fn(),
  },
  argTypes: {
    children: {
      control: false,
    },
    onClick: {
      control: false,
    },
    render: {
      control: false,
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
  render: (args) => (
    <GlAvatarLink {...args}>
      <GlAvatar
        alt="Norcleeh"
        shape="circle"
        size={32}
        src="/img/avatar.jpg" />
    </GlAvatarLink>
  ),
} satisfies Meta<typeof GlAvatarLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas }) => {
    const link = canvas.getByRole("link", { name: "Norcleeh" });

    await expect(link).toHaveClass("gl-avatar-link", "gl-link-meta");
    await userEvent.click(link);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const WithLabeledAvatar: Story = {
  render: (args) => (
    <GlAvatarLink {...args}>
      <GlAvatarLabeled
        label="Norcleeh"
        size={32}
        src="/img/avatar.jpg"
        subLabel="@NriotHrreion" />
    </GlAvatarLink>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Norcleeh @NriotHrreion" })).toHaveClass(
      "gl-avatar-link",
    );
  },
};

export const WithNoImageAvatar: Story = {
  render: (args) => (
    <GlAvatarLink {...args}>
      <GlAvatarLabeled
        entityName="Norcleeh"
        label="Norcleeh"
        size={32}
        subLabel="@NriotHrreion" />
    </GlAvatarLink>
  ),
  play: async ({ canvas, canvasElement }) => {
    await expect(canvasElement.querySelector(".gl-avatar-identicon")).toHaveTextContent("N");
    await expect(canvas.getByRole("link", { name: "Norcleeh @NriotHrreion" })).toBeVisible();
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    onClick: fn(),
  },
  play: async ({ args, canvas }) => {
    const link = canvas.getByRole("link", { name: "Norcleeh" });

    await userEvent.click(link);
    await expect(link).toHaveAttribute("aria-disabled", "true");
    await expect(link).toHaveAttribute("tabindex", "-1");
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const RouterComposition: Story = {
  args: {
    href: undefined,
    render: <RouterLink data-router-link="" to="/NriotHrreion" />,
  },
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "Norcleeh" });

    await expect(link).toHaveAttribute("data-router-link", "");
    await expect(link).toHaveAttribute("href", "/NriotHrreion");
  },
};
