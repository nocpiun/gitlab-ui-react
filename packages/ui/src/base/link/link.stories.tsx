import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from "react";
import GlLink, { type GlLinkVariant } from "./link";

const variants = [
  "inline",
  "meta",
  "mention",
  "mentionCurrent",
  "unstyled",
] satisfies GlLinkVariant[];

const collectionStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
};

type RouterLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & { to: string };

const RouterLink = forwardRef<HTMLAnchorElement, RouterLinkProps>(function RouterLink({
  to,
  ...props
}, ref) {
  return <a {...props} ref={ref} href={to} />;
});

const meta = {
  title: "UI/Base/Link",
  component: GlLink,
  args: {
    active: false,
    children: "This is a UI link",
    disabled: false,
    href: "#",
    showExternalIcon: false,
    variant: undefined,
  },
  argTypes: {
    render: {
      control: false,
    },
    variant: {
      control: "select",
      options: [undefined, ...variants],
    },
  },
  parameters: {
    docs: {
      description: {
        component: "See the [Pajamas link documentation](https://design.gitlab.com/components/link/) for usage guidance.",
      },
    },
  },
} satisfies Meta<typeof GlLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onClick: fn(),
  },
  play: async ({ args, canvas }) => {
    const link = canvas.getByRole("link", { name: "This is a UI link" });
    const previewUrl = link.ownerDocument.location.href;

    await userEvent.click(link);
    await expect(link).toHaveAttribute("href", "#");
    await expect(link).toHaveClass("gl-link");
    await expect(args.onClick).toHaveBeenCalledOnce();
    await expect(link.ownerDocument.location.href).toBe(previewUrl);
  },
};

export const Variants: Story = {
  render: (args) => (
    <div style={collectionStyle}>
      <GlLink {...args}>UI link</GlLink>
      {variants.map((variant) => (
        <GlLink {...args} key={variant} variant={variant}>
          {variant === "mention" ? "@anotheruser" : null}
          {variant === "mentionCurrent" ? "@currentuser" : null}
          {variant !== "mention" && variant !== "mentionCurrent" ? `${variant} link` : null}
        </GlLink>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "inline link" })).toHaveClass("gl-link-inline");
    await expect(canvas.getByRole("link", { name: "meta link" })).toHaveClass("gl-link-meta");
    await expect(canvas.getByRole("link", { name: "@anotheruser" })).toHaveClass("gl-link-mention");
    await expect(canvas.getByRole("link", { name: "@currentuser" })).toHaveClass(
      "gl-link-mention-current",
    );
    await expect(canvas.getByRole("link", { name: "unstyled link" })).not.toHaveClass("gl-link");
  },
};

export const External: Story = {
  args: {
    children: "GitLab Design System",
    href: "https://design.gitlab.com/",
    showExternalIcon: true,
    target: "_blank",
  },
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: /GitLab Design System/ });

    await expect(link).toHaveClass("gl-link-external");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  },
};

export const Disabled: Story = {
  args: {
    children: "Disabled link",
    disabled: true,
    href: "/projects",
    onClick: fn(),
  },
  play: async ({ args, canvas }) => {
    const link = canvas.getByRole("link", { name: "Disabled link" });

    await userEvent.click(link);
    await expect(link).toHaveAttribute("aria-disabled", "true");
    await expect(link).toHaveAttribute("tabindex", "-1");
    await expect(link).toHaveClass("disabled");
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const RouterComposition: Story = {
  args: {
    children: "Projects",
    href: undefined,
    render: <RouterLink data-router-link="" to="/projects" />,
  },
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "Projects" });

    await expect(link).toHaveAttribute("data-router-link", "");
    await expect(link).toHaveAttribute("href", "/projects");
    await expect(link).toHaveClass("gl-link");
  },
};
