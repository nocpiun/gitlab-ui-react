import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import GlButton, {
  type GlButtonCategory,
  type GlButtonSize,
  type GlButtonVariant,
} from "./button";

const categories = ["primary", "secondary", "tertiary"] satisfies GlButtonCategory[];
const variants = ["default", "confirm", "danger"] satisfies GlButtonVariant[];
const sizes = ["small", "medium"] satisfies GlButtonSize[];

const collectionStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
};

const gridStyle: CSSProperties = {
  alignItems: "center",
  display: "grid",
  gap: "0.75rem",
  gridTemplateColumns: "repeat(3, max-content)",
};

const meta = {
  title: "UI/Base/Button",
  component: GlButton,
  args: {
    category: "primary",
    children: "Button text",
    disabled: false,
    selected: false,
    size: "medium",
    variant: "default",
  },
  argTypes: {
    category: {
      control: "select",
      options: categories,
    },
    render: {
      control: false,
    },
    size: {
      control: "select",
      options: sizes,
    },
    variant: {
      control: "select",
      options: [...variants, "link", "reset"],
    },
  },
  parameters: {
    docs: {
      description: {
        component: "See the [Pajamas button documentation](https://design.gitlab.com/components/button/) for usage guidance.",
      },
    },
  },
} satisfies Meta<typeof GlButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Button text" });

    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute("type", "button");
    await expect(button).toHaveClass("btn", "gl-button", "btn-default", "btn-md");
  },
};

export const VariantsAndCategories: Story = {
  render: (args) => (
    <div style={gridStyle}>
      {variants.flatMap((variant) => categories.map((category) => (
        <GlButton {...args} key={`${variant}-${category}`} category={category} variant={variant}>
          {category} {variant}
        </GlButton>
      )))}
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("button")).toHaveLength(variants.length * categories.length);
    await expect(canvas.getByRole("button", { name: "secondary confirm" })).toHaveClass(
      "btn-confirm-secondary",
    );
    await expect(canvas.getByRole("button", { name: "tertiary danger" })).toHaveClass(
      "btn-danger-tertiary",
    );
  },
};

export const SizesAndBlock: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <div style={collectionStyle}>
        <GlButton {...args} size="small">Small button</GlButton>
        <GlButton {...args}>Medium button</GlButton>
      </div>
      <GlButton {...args} block>Full-width button</GlButton>
    </div>
  ),
};

export const Icons: Story = {
  render: (args) => (
    <div style={collectionStyle}>
      <GlButton {...args} aria-label="Star" icon="star-o" children={undefined} />
      <GlButton {...args} icon="star-o">Star project</GlButton>
      <GlButton {...args} aria-label="More actions" icon="ellipsis_h" children={undefined} />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Star" })).toHaveClass("btn-icon");
    await expect(canvas.getByRole("button", { name: "Star project" })).not.toHaveClass("btn-icon");
    await expect(canvas.getByRole("button", { name: "More actions" })).toHaveClass(
      "button-ellipsis-horizontal",
    );
  },
};

export const Counts: Story = {
  render: (args) => (
    <div style={collectionStyle}>
      <GlButton {...args} count={5}>Issues</GlButton>
      <GlButton {...args} count={3} countSrText="pending comments" variant="confirm">
        Review
      </GlButton>
      <GlButton {...args} count={0} variant="danger">Alerts</GlButton>
    </div>
  ),
};

export const Selected: Story = {
  args: {
    "aria-pressed": true,
    children: "Selected button",
    selected: true,
  },
};

export const Disabled: Story = {
  args: {
    children: "Disabled button",
    disabled: true,
    onClick: fn(),
  },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole("button", { name: "Disabled button" });

    await userEvent.click(button);
    await expect(button).toHaveAttribute("aria-disabled", "true");
    await expect(button).not.toHaveAttribute("disabled");
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const Link: Story = {
  args: {
    children: "GitLab Design System",
    href: "https://design.gitlab.com/",
    target: "_blank",
  },
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "GitLab Design System" });

    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  },
};

export const Label: Story = {
  args: {
    children: "b29cc44d",
    label: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("b29cc44d").closest(".gl-button")).toHaveClass("btn-label");
  },
};

export const CustomElement: Story = {
  args: {
    children: "Custom element button",
    nativeButton: false,
    render: <div />,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Custom element button" }).tagName).toBe("DIV");
  },
};

// TODO: Add loading stories after GlLoadingIcon is ported and the loading prop is implemented.
