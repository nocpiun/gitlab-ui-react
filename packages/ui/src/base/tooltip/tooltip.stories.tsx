import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type CSSProperties } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import GlButton from "../button/button";
import GlTooltip, {
  GlTooltipContent,
  GlTooltipTrigger,
  type GlTooltipPlacement,
  type GlTooltipProps,
} from "./tooltip";

const wrapperStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  justifyContent: "center",
  minHeight: "240px",
};

const meta = {
  title: "UI/Base/Tooltip",
  component: GlTooltip,
  args: {
    closeDelay: 0,
    delay: 0,
  },
  argTypes: {
    children: { control: false },
    onOpenChange: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Composition-first React port of the [Pajamas tooltip](https://design.gitlab.com/components/tooltip/), backed by Base UI Tooltip semantics.",
      },
    },
  },
} satisfies Meta<typeof GlTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const makePlacementStory = (placement: GlTooltipPlacement): Story => ({
  render: (args) => (
    <div style={wrapperStyle}>
      <GlTooltip {...args}>
        <GlTooltipTrigger>Tooltip</GlTooltipTrigger>
        <GlTooltipContent placement={placement}>some tooltip text</GlTooltipContent>
      </GlTooltip>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByText("Tooltip");

    await expect(trigger).not.toHaveClass("gl-button");
    await userEvent.hover(trigger);

    const tooltip = await within(document.body).findByRole("tooltip");

    await waitFor(() => expect(tooltip).toBeVisible());
    await expect(tooltip).toHaveTextContent("some tooltip text");
    await expect(tooltip).toHaveClass("gl-tooltip", `bs-tooltip-${placement}`);
    await waitFor(() => expect(trigger).toHaveAttribute("aria-describedby", tooltip.id));

    // The arrow tip touches the trigger with no gap between them.
    const arrow = tooltip.querySelector(".arrow");

    await expect(arrow).not.toBeNull();

    const triggerRect = trigger.getBoundingClientRect();
    const arrowRect = arrow!.getBoundingClientRect();
    const gaps: Record<GlTooltipPlacement, number> = {
      bottom: triggerRect.bottom - arrowRect.top,
      left: triggerRect.left - arrowRect.right,
      right: arrowRect.left - triggerRect.right,
      top: arrowRect.bottom - triggerRect.top,
    };

    await expect(Math.abs(gaps[placement])).toBeLessThanOrEqual(2);
  },
});

export const TopDefault: Story = makePlacementStory("top");

export const Right: Story = makePlacementStory("right");

export const Bottom: Story = makePlacementStory("bottom");

export const Left: Story = makePlacementStory("left");

export const HtmlContent: Story = {
  render: (args) => (
    <div style={wrapperStyle}>
      <GlTooltip {...args}>
        <GlTooltipTrigger asChild>
          <GlButton>HTML tooltip</GlButton>
        </GlTooltipTrigger>
        <GlTooltipContent>
          some <em>tooltip</em> text
        </GlTooltipContent>
      </GlTooltip>
    </div>
  ),
  play: async ({ canvas }) => {
    await userEvent.hover(canvas.getByRole("button"));

    const tooltip = await within(document.body).findByRole("tooltip");

    await expect(tooltip.querySelector(".tooltip-inner em")).toHaveTextContent("tooltip");
  },
};

export const ContentOptions: Story = {
  render: (args) => (
    <div style={wrapperStyle}>
      <GlTooltip {...args} noninteractive>
        <GlTooltipTrigger asChild>
          <GlButton aria-describedby="existing-description">Content options</GlButton>
        </GlTooltipTrigger>
        <GlTooltipContent
          ref={(element) => element?.setAttribute("data-ref-attached", "true")}
          className="custom-tooltip"
          noFade
          title="Forwarded popup attribute">
          Noninteractive tooltip
        </GlTooltipContent>
      </GlTooltip>
      <span id="existing-description">Existing description</span>
    </div>
  ),
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Content options" });
    await userEvent.hover(button);

    const tooltip = await within(document.body).findByRole("tooltip");

    await expect(tooltip).toHaveClass("gl-tooltip", "noninteractive", "custom-tooltip");
    await expect(tooltip).not.toHaveClass("fade");
    await expect(tooltip).toHaveAttribute("title", "Forwarded popup attribute");
    await expect(tooltip).toHaveAttribute("data-ref-attached", "true");
    await expect(button).toHaveAttribute(
      "aria-describedby",
      `existing-description ${tooltip.id}`,
    );
  },
};

function ControlledTooltipExample(props: GlTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={wrapperStyle}>
      <GlTooltip
        {...props}
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          props.onOpenChange?.(nextOpen);
        }}>
        <GlTooltipTrigger asChild>
          <GlButton>Controlled tooltip</GlButton>
        </GlTooltipTrigger>
        <GlTooltipContent>Controlled content</GlTooltipContent>
      </GlTooltip>
    </div>
  );
}

export const Controlled: Story = {
  render: (args) => <ControlledTooltipExample {...args} />,
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Controlled tooltip" });
    const body = within(document.body);

    await userEvent.tab();
    await expect(button).toHaveFocus();
    await body.findByRole("tooltip");

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("tooltip")).not.toBeInTheDocument());
  },
};

function DisabledControlledTooltipExample(props: GlTooltipProps) {
  const [closeNotifications, setCloseNotifications] = useState(0);

  return (
    <div style={wrapperStyle}>
      <output aria-label="Close notifications">{closeNotifications}</output>
      <GlTooltip
        {...props}
        disabled
        open
        onOpenChange={(nextOpen) => {
          if(!nextOpen) setCloseNotifications((count) => count + 1);
          props.onOpenChange?.(nextOpen);
        }}>
        <GlTooltipTrigger asChild>
          <GlButton>Disabled controlled tooltip</GlButton>
        </GlTooltipTrigger>
        <GlTooltipContent>Disabled controlled content</GlTooltipContent>
      </GlTooltip>
    </div>
  );
}

export const DisabledControlled: Story = {
  render: (args) => <DisabledControlledTooltipExample {...args} />,
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByRole("status", { name: "Close notifications" }))
      .toHaveTextContent("1"));
    await expect(canvas.getByRole("button", { name: "Disabled controlled tooltip" }))
      .not.toHaveAttribute("aria-describedby");
    await expect(within(document.body).queryByRole("tooltip")).not.toBeInTheDocument();
  },
};
