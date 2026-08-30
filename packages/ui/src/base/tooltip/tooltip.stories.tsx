import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import GlButton from "../button/button";
import GlTooltip, { type GlTooltipPlacement } from "./tooltip";

const placements = [
  "top",
  "right",
  "bottom",
  "left",
] satisfies GlTooltipPlacement[];

const wrapperStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "4rem",
};

const meta = {
  title: "UI/Base/Tooltip",
  component: GlTooltip,
  args: {
    children: <GlButton>Tooltip</GlButton>,
    title: "some tooltip text",
    placement: "top",
  },
  argTypes: {
    children: {
      control: false,
    },
    placement: {
      control: "select",
      options: placements,
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas tooltip documentation](https://design.gitlab.com/components/tooltip/) for usage guidance.",
      },
    },
  },
} satisfies Meta<typeof GlTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const makePlacementStory = (placement: GlTooltipPlacement): Story => ({
  args: {
    placement,
  },
  render: (args) => (
    <div style={wrapperStyle}>
      <GlTooltip {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button");

    await userEvent.click(button);
    await waitFor(() => expect(button).toHaveFocus());

    const tooltip = await within(document.body).findByRole("tooltip");

    await waitFor(() => expect(tooltip).toBeVisible());
    await expect(tooltip).toHaveTextContent("some tooltip text");
    await expect(tooltip).toHaveClass("gl-tooltip", `bs-tooltip-${placement}`);
    await waitFor(() => expect(button).toHaveAttribute("aria-describedby", tooltip.id));

    // The arrow tip touches the trigger with no gap between them.
    const arrow = tooltip.querySelector(".arrow");

    await expect(arrow).not.toBeNull();

    const buttonRect = button.getBoundingClientRect();
    const arrowRect = arrow!.getBoundingClientRect();
    const gaps: Record<GlTooltipPlacement, number> = {
      bottom: buttonRect.bottom - arrowRect.top,
      left: buttonRect.left - arrowRect.right,
      right: arrowRect.left - buttonRect.right,
      top: arrowRect.bottom - buttonRect.top,
    };

    await expect(Math.abs(gaps[placement])).toBeLessThanOrEqual(2);
  },
});

export const TopDefault: Story = makePlacementStory("top");

export const Right: Story = makePlacementStory("right");

export const Bottom: Story = makePlacementStory("bottom");

export const Left: Story = makePlacementStory("left");

export const HtmlContent: Story = {
  args: {
    children: <GlButton>HTML tooltip</GlButton>,
    title: (
      <span>
        some <em>tooltip</em> text
      </span>
    ),
  },
  render: (args) => (
    <div style={wrapperStyle}>
      <GlTooltip {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByRole("button"));

    const tooltip = await within(document.body).findByRole("tooltip");

    await expect(tooltip.querySelector(".tooltip-inner em")).toHaveTextContent("tooltip");
  },
};
