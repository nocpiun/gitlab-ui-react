import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import GlProgressBar, { type GlProgressBarVariant } from "./progress-bar";

const variants = [
  "primary",
  "success",
  "warning",
  "danger",
] satisfies GlProgressBarVariant[];

const collectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
};

const meta = {
  title: "UI/Base/ProgressBar",
  component: GlProgressBar,
  args: {
    max: 100,
    value: 30,
    variant: "primary",
  },
  argTypes: {
    variant: {
      control: "select",
      options: variants,
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas progress bar documentation](https://design.gitlab.com/components/progress-bar) for usage guidance.",
      },
    },
  },
} satisfies Meta<typeof GlProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const bar = canvas.getByRole("progressbar", { name: "Progress bar" });

    await expect(bar).toHaveClass("gl-progress", "gl-progress-bar-primary");
    await expect(bar).toHaveAttribute("aria-valuemin", "0");
    await expect(bar).toHaveAttribute("aria-valuemax", "100");
    await expect(bar).toHaveAttribute("aria-valuenow", "30");
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
        <GlProgressBar {...args} key={variant} variant={variant} />
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const bars = canvas.getAllByRole("progressbar");

    for(const [index, variant] of variants.entries()) {
      await expect(bars[index]).toHaveClass(`gl-progress-bar-${variant}`);
    }
  },
};

export const CustomHeight: Story = {
  argTypes: {
    height: {
      control: false,
    },
    variant: {
      control: false,
    },
  },
  render: (args) => (
    <div style={collectionStyle}>
      <GlProgressBar {...args} height="4px" />
      <GlProgressBar {...args} height="8px" />
      <GlProgressBar {...args} height="1rem" />
      <GlProgressBar {...args} height="2rem" />
    </div>
  ),
  play: async ({ canvas }) => {
    const tracks = canvas.getAllByRole("progressbar").map((bar) => bar.parentElement);

    await expect(tracks[0]).toHaveStyle({ height: "4px" });
    await expect(tracks[3]).toHaveStyle({ height: "32px" });
  },
};
