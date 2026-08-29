import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import iconsInfo from "@gitlab/svgs/dist/icons.json";
import GlIcon, { type GlIconSize, type GlIconVariant } from "./icon";

const sizes = [8, 12, 14, 16, 24, 32, 48, 72] satisfies GlIconSize[];
const variants = [
  "current",
  "default",
  "subtle",
  "strong",
  "disabled",
  "link",
  "info",
  "warning",
  "danger",
  "success",
] satisfies GlIconVariant[];

const collectionStyle: CSSProperties = {
  alignItems: "end",
  display: "flex",
  flexWrap: "wrap",
  gap: "1rem",
};

const itemStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  minWidth: "5rem",
};

const meta = {
  title: "UI/Base/Icon",
  component: GlIcon,
  args: {
    ariaLabel: "Success",
    name: "check-circle",
    size: 16,
    variant: "current",
  },
  argTypes: {
    ariaLabel: {
      control: "text",
    },
    name: {
      control: "select",
      options: iconsInfo.icons,
    },
    size: {
      control: "select",
      options: sizes,
    },
    variant: {
      control: "select",
      options: variants,
    },
  },
} satisfies Meta<typeof GlIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Decorative: Story = {
  args: {
    ariaLabel: undefined,
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={collectionStyle}>
      {sizes.map((size) => (
        <div key={size} style={itemStyle}>
          <GlIcon {...args} ariaLabel={`${size} pixel icon`} size={size} />
          <span>{size}px</span>
        </div>
      ))}
    </div>
  ),
};

export const Variants: Story = {
  render: (args) => (
    <div style={collectionStyle}>
      {variants.map((variant) => (
        <div key={variant} style={itemStyle}>
          <GlIcon {...args} ariaLabel={`${variant} icon`} variant={variant} />
          <span>{variant}</span>
        </div>
      ))}
    </div>
  ),
};
