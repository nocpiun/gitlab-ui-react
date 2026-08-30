import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import GlCard, { GlCardContent, GlCardFooter, GlCardHeader } from "./card";

const meta = {
  title: "UI/Base/Card",
  component: GlCard,
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas card documentation](https://design.gitlab.com/components/card) for usage guidance.",
      },
    },
  },
} satisfies Meta<typeof GlCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <GlCard {...args}>
      <GlCardHeader>
        <h3 className="gl-heading-scale-300 gl-mb-0">This is a custom header</h3>
      </GlCardHeader>
      <GlCardContent>Hello World</GlCardContent>
      <GlCardFooter>This is a custom footer</GlCardFooter>
    </GlCard>
  ),
  play: async ({ canvas }) => {
    const header = canvas.getByText("This is a custom header");
    const content = canvas.getByText("Hello World");
    const footer = canvas.getByText("This is a custom footer");

    await expect(header.parentElement).toHaveClass("gl-card-header");
    await expect(content).toHaveClass("gl-card-body");
    await expect(footer).toHaveClass("gl-card-footer");
    await expect(content.parentElement).toHaveClass("gl-card");
  },
};

export const ContentOnly: Story = {
  render: (args) => (
    <GlCard {...args}>
      <GlCardContent>Hello World</GlCardContent>
    </GlCard>
  ),
  play: async ({ canvas }) => {
    const content = canvas.getByText("Hello World");

    await expect(content).toHaveClass("gl-card-body");
    await expect(content.parentElement?.querySelector(".gl-card-header")).toBeNull();
    await expect(content.parentElement?.querySelector(".gl-card-footer")).toBeNull();
  },
};
