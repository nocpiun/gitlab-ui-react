import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import GlLoadingIcon, {
  type GlLoadingIconColor,
  type GlLoadingIconSize,
  type GlLoadingIconVariant,
} from "./loading-icon";

const colors = ["dark", "light"] satisfies GlLoadingIconColor[];
const sizes = ["sm", "md", "lg", "xl"] satisfies GlLoadingIconSize[];
const variants = ["spinner", "dots"] satisfies GlLoadingIconVariant[];

const previewStyle: CSSProperties = {
  borderRadius: "var(--gl-border-radius-base)",
  padding: "var(--gl-spacing-scale-5)",
  textAlign: "center",
};

const showcaseStyle: CSSProperties = {
  display: "grid",
  gap: "var(--gl-spacing-scale-3)",
  gridTemplateColumns: "repeat(auto-fit, minmax(9rem, 1fr))",
};

const cardStyle: CSSProperties = {
  ...previewStyle,
  alignItems: "center",
  display: "flex",
  flexDirection: "column",
  gap: "var(--gl-spacing-scale-3)",
};

const backgroundFor = (color: GlLoadingIconColor) => color === "light"
  ? "var(--gl-color-neutral-950)"
  : "var(--gl-background-color-default)";

const foregroundFor = (color: GlLoadingIconColor) => color === "light"
  ? "var(--gl-color-neutral-0)"
  : "var(--gl-text-color-default)";

const showcaseItems = variants.flatMap((variant) => colors.flatMap((color) => (
  sizes.map((size) => ({
    color,
    label: `${variant} ${color} ${size}`,
    size,
    variant,
  }))
)));

const meta = {
  title: "UI/Base/Loading Icon",
  component: GlLoadingIcon,
  args: {
    color: "dark",
    inline: false,
    label: "Loading",
    size: "sm",
    variant: "spinner",
  },
  argTypes: {
    color: {
      control: "select",
      options: colors,
    },
    inline: {
      control: "boolean",
    },
    label: {
      control: "text",
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
  render: (args) => {
    const color = args.color ?? "dark";

    return (
      <div
        style={{
          ...previewStyle,
          backgroundColor: backgroundFor(color),
          color: foregroundFor(color),
        }}>
        <GlLoadingIcon {...args} />
        Loading
      </div>
    );
  },
} satisfies Meta<typeof GlLoadingIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const loader = canvas.getByRole("status", { name: "Loading" });

    await expect(loader.tagName).toBe("DIV");
    await expect(loader).toHaveClass("gl-spinner-container");
    await expect(loader.firstElementChild).toHaveClass(
      "gl-spinner",
      "gl-spinner-dark",
      "gl-spinner-sm",
    );
  },
};

export const Inline: Story = {
  args: {
    inline: true,
  },
  play: async ({ canvas }) => {
    const loader = canvas.getByRole("status", { name: "Loading" });

    await expect(loader.tagName).toBe("SPAN");
  },
};

export const Dots: Story = {
  args: {
    size: "md",
    variant: "dots",
  },
  play: async ({ canvas }) => {
    const loader = canvas.getByRole("status", { name: "Loading" });

    await expect(loader).toHaveClass(
      "gl-dots-loader",
      "gl-dots-loader-dark",
      "gl-dots-loader-md",
    );
    await expect(loader.firstElementChild?.tagName).toBe("SPAN");
  },
};

export const VariantsAndSizes: Story = {
  render: () => (
    <div style={showcaseStyle}>
      {showcaseItems.map(({ color, label, size, variant }) => (
        <div
          key={label}
          style={{
            ...cardStyle,
            backgroundColor: backgroundFor(color),
            color: foregroundFor(color),
          }}>
          <GlLoadingIcon color={color} label={label} size={size} variant={variant} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("status")).toHaveLength(
      variants.length * colors.length * sizes.length,
    );
  },
};
