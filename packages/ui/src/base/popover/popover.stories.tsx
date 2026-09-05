import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type CSSProperties } from "react";
import { expect, fireEvent, fn, userEvent, waitFor, within } from "storybook/test";
import GlButton from "../button/button";
import GlLink from "../link/link";
import GlPopover, {
  GlPopoverContent,
  GlPopoverTitle,
  GlPopoverTrigger,
  type GlPopoverPlacement,
} from "./popover";

const placements = ["top", "right", "bottom", "left"] satisfies GlPopoverPlacement[];
const storyLayout: CSSProperties = {
  alignItems: "center",
  display: "flex",
  justifyContent: "center",
  minHeight: "320px",
};

const meta = {
  title: "UI/Base/Popover",
  component: GlPopover,
  args: {
    closeDelay: 0,
    delay: 0,
  },
  argTypes: {
    children: { control: false },
    onOpenChange: { control: false },
    triggers: {
      control: "check",
      options: ["click", "hover", "focus"],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Composition-first React port of the [Pajamas popover](https://design.gitlab.com/components/popover/), backed by Base UI Popover semantics.",
      },
    },
  },
} satisfies Meta<typeof GlPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div style={storyLayout}>
      <GlPopover {...args}>
        <GlPopoverTrigger>
          <GlButton>Popover</GlButton>
        </GlPopoverTrigger>
        <GlPopoverContent>
          <GlPopoverTitle>Popover title</GlPopoverTitle>
          <span>A popover provides supplemental, useful information about an element.</span>
        </GlPopoverContent>
      </GlPopover>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Popover" });

    await userEvent.tab();
    await expect(trigger).toHaveFocus();

    const dialog = await within(document.body).findByRole("dialog");
    const title = within(dialog).getByRole("heading", { name: "Popover title" });

    await waitFor(() => expect(dialog).toBeVisible());
    await expect(dialog).toHaveClass("gl-popover", "has-title", "bs-popover-top");
    await expect(dialog.querySelector(".popover-body")).toHaveTextContent(
      "A popover provides supplemental, useful information about an element.",
    );
    await expect(dialog).toHaveAttribute("aria-labelledby", title.id);

    await userEvent.hover(trigger);
    fireEvent.mouseEnter(trigger);
    await userEvent.unhover(trigger);
    fireEvent.mouseLeave(trigger, { relatedTarget: document.body });
    fireEvent.mouseMove(document.body);
    await expect(dialog).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).not.toBeInTheDocument());

    await userEvent.hover(trigger);
    fireEvent.mouseEnter(trigger);
    await within(document.body).findByRole("dialog");
  },
};

const closeButtonClick = fn();

export const WithCloseButton: Story = {
  render: (args) => (
    <div style={storyLayout}>
      <GlPopover {...args} triggers={["click"]}>
        <GlPopoverTrigger>
          <GlButton>Compliance framework</GlButton>
        </GlPopoverTrigger>
        <GlPopoverContent
          onCloseButtonClick={closeButtonClick}
          showCloseButton>
          <GlPopoverTitle>Compliance framework used with Ruby project</GlPopoverTitle>
          <span>A popover provides supplemental, useful information about an element.</span>
        </GlPopoverContent>
      </GlPopover>
    </div>
  ),
  play: async ({ canvas }) => {
    closeButtonClick.mockClear();
    await userEvent.click(canvas.getByRole("button", { name: "Compliance framework" }));

    const body = within(document.body);
    const dialog = await body.findByRole("dialog");
    const closeButton = within(dialog).getByRole("button", { name: "Close" });

    await expect(dialog).toHaveClass("has-title", "has-close-button");
    await userEvent.click(closeButton);
    await expect(closeButtonClick).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
  },
};

export const TextLinks: Story = {
  render: (args) => (
    <div style={storyLayout}>
      <GlPopover {...args} triggers={["click"]}>
        <GlPopoverTrigger>
          <GlButton id="text-links-popover-trigger">Learn about popovers</GlButton>
        </GlPopoverTrigger>
        <GlPopoverContent showCloseButton>
          <span>A popover can contain rich content and actionable elements. </span>
          <GlLink href="https://design.gitlab.com/components/popover/">
            Read the Pajamas guidance
          </GlLink>
        </GlPopoverContent>
      </GlPopover>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Learn about popovers" });
    await expect(trigger).toHaveAttribute("id", "text-links-popover-trigger");

    await userEvent.click(trigger);
    await waitFor(() => expect(trigger).toHaveFocus());

    const body = within(document.body);
    const dialog = await body.findByRole("dialog");
    const closeButton = within(dialog).getByRole("button", { name: "Close" });
    const link = within(dialog).getByRole("link", { name: "Read the Pajamas guidance" });

    await expect(dialog).toHaveClass("has-close-button");
    await expect(dialog).not.toHaveClass("has-title");
    await expect(dialog).toHaveAccessibleName("Learn about popovers");
    await expect(dialog).toHaveAttribute("aria-labelledby", trigger.id);
    await userEvent.tab();
    await expect(closeButton).toHaveFocus();
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
  },
};

export const OnClick: Story = {
  render: (args) => (
    <div style={storyLayout}>
      <GlPopover {...args} triggers={["click"]}>
        <GlPopoverTrigger>
          <GlButton>Click trigger</GlButton>
        </GlPopoverTrigger>
        <GlPopoverContent noFade>
          <GlPopoverTitle>Click-triggered popover</GlPopoverTitle>
          <span>This popover toggles only when its trigger is clicked.</span>
        </GlPopoverContent>
      </GlPopover>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Click trigger" });
    const body = within(document.body);

    await userEvent.hover(trigger);
    await expect(body.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(trigger);
    const dialog = await body.findByRole("dialog");

    await expect(dialog).not.toHaveClass("fade");
    await userEvent.click(trigger);
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
  },
};

function ControlledManualPopover() {
  const [open, setOpen] = useState(false);

  return (
    <div className="gl-flex gl-items-center gl-gap-3" style={storyLayout}>
      <GlButton onClick={() => setOpen((value) => !value)}>Toggle externally</GlButton>
      <GlPopover
        closeDelay={0}
        delay={0}
        onOpenChange={setOpen}
        open={open}
        triggers={[]}>
        <GlPopoverTrigger>
          <GlButton>Manual trigger</GlButton>
        </GlPopoverTrigger>
        <GlPopoverContent noFade>
          <GlPopoverTitle>Controlled popover</GlPopoverTitle>
          <span>The trigger does not mutate the popover state.</span>
        </GlPopoverContent>
      </GlPopover>
    </div>
  );
}

export const ControlledManual: Story = {
  render: () => <ControlledManualPopover />,
  play: async ({ canvas }) => {
    const body = within(document.body);

    await userEvent.click(canvas.getByRole("button", { name: "Manual trigger" }));
    await expect(body.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "Toggle externally" }));
    const dialog = await body.findByRole("dialog");

    await expect(dialog).toHaveAttribute("data-open");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
  },
};

export const Placements: Story = {
  render: () => (
    <div className="gl-grid gl-grid-cols-2 gl-gap-12 gl-p-12">
      {placements.map((placement) => (
        <GlPopover key={placement} open triggers={[]}>
          <GlPopoverTrigger>
            <GlButton>{placement}</GlButton>
          </GlPopoverTrigger>
          <GlPopoverContent noFade placement={placement}>
            <GlPopoverTitle>{placement} placement</GlPopoverTitle>
            <span>Popover content</span>
          </GlPopoverContent>
        </GlPopover>
      ))}
    </div>
  ),
};
