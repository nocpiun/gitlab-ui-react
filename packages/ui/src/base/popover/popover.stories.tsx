import { useRef, type CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import GlButton from "../button/button";
import GlLink from "../link/link";
import GlPopover, {
  GlPopoverBody,
  GlPopoverClose,
  GlPopoverContent,
  GlPopoverHeader,
  GlPopoverTitle,
  GlPopoverTrigger,
  type GlPopoverPlacement,
} from "./popover";

const wrapperStyle: CSSProperties = {
  alignItems: "center",
  display: "flex",
  height: 400,
  justifyContent: "center",
};

const meta = {
  title: "UI/Base/Popover",
  component: GlPopover,
  parameters: {
    docs: {
      description: {
        component: "See the [Pajamas popover documentation](https://design.gitlab.com/components/popover/) for usage guidance. Compose Trigger, Content, and optional Header, Title, Body, and Close parts.",
      },
    },
  },
} satisfies Meta<typeof GlPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={wrapperStyle}>
      <GlPopover>
        <GlPopoverTrigger render={<GlButton />}>Basic popover</GlPopoverTrigger>
        <GlPopoverContent>
          <GlPopoverHeader><GlPopoverTitle>Compliance framework</GlPopoverTitle></GlPopoverHeader>
          <GlPopoverBody>Adds this project to the compliance report.</GlPopoverBody>
        </GlPopoverContent>
      </GlPopover>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Basic popover" });
    await userEvent.click(trigger);
    const popup = await within(document.body).findByRole("dialog");
    await expect(popup).toHaveTextContent("Compliance framework");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{Escape}");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};

export const WithCloseButton: Story = {
  render: () => (
    <div style={wrapperStyle}>
      <GlPopover>
        <GlPopoverTrigger render={<GlButton />}>Show details</GlPopoverTrigger>
        <GlPopoverContent>
          <GlPopoverHeader>
            <GlPopoverTitle>Compliance framework used with Ruby project</GlPopoverTitle>
            <GlPopoverClose />
          </GlPopoverHeader>
          <GlPopoverBody>Adds this project to the compliance report.</GlPopoverBody>
        </GlPopoverContent>
      </GlPopover>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Show details" });
    await userEvent.click(trigger);
    await userEvent.click(await within(document.body).findByRole("button", { name: "Close" }));
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};

function InteractivePopoverExample() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={wrapperRef} data-testid="interactive-popover-wrapper" style={wrapperStyle}>
      <GlPopover>
        <GlPopoverTrigger render={<GlButton icon="information-o" aria-label="About compliance frameworks" />} />
        <GlPopoverContent container={wrapperRef}>
          <GlPopoverHeader><GlPopoverTitle>Compliance framework</GlPopoverTitle></GlPopoverHeader>
          <GlPopoverBody>
            Applying a compliance framework adds this project to the compliance report.
            <GlLink className="gl-block gl-mt-3" href="https://design.gitlab.com/components/popover/">Learn more</GlLink>
          </GlPopoverBody>
        </GlPopoverContent>
      </GlPopover>
    </div>
  );
}

export const InteractiveContent: Story = {
  render: () => <InteractivePopoverExample />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "About compliance frameworks" });
    await userEvent.click(trigger);
    const popup = await within(document.body).findByRole("dialog");
    await expect(popup).toHaveAccessibleName("Compliance framework");
    await expect(canvas.getByTestId("interactive-popover-wrapper")).toContainElement(popup);
    await userEvent.tab();
    await expect(within(popup).getByRole("link", { name: "Learn more" })).toHaveFocus();
  },
};

export const Placements: Story = {
  render: () => (
    <div style={{ ...wrapperStyle, gap: 80 }}>
      {(["top", "right", "bottom", "left"] satisfies GlPopoverPlacement[]).map((placement) => (
        <GlPopover key={placement}>
          <GlPopoverTrigger render={<GlButton />}>{placement}</GlPopoverTrigger>
          <GlPopoverContent placement={placement}>
            <GlPopoverBody>Popover on the {placement}</GlPopoverBody>
          </GlPopoverContent>
        </GlPopover>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    for(const placement of ["top", "right", "bottom", "left"] as const) {
      const trigger = canvas.getByRole("button", { name: placement });
      await userEvent.click(trigger);
      const popup = await within(document.body).findByRole("dialog");
      await expect(popup).toHaveClass(`bs-popover-${placement}`);
      await waitFor(() => {
        const arrow = popup.querySelector(".arrow");
        expect(arrow).not.toBeNull();
        const arrowRect = arrow!.getBoundingClientRect();
        const triggerRect = trigger.getBoundingClientRect();
        const gaps = {
          top: triggerRect.top - arrowRect.bottom,
          right: arrowRect.left - triggerRect.right,
          bottom: arrowRect.top - triggerRect.bottom,
          left: triggerRect.left - arrowRect.right,
        };
        expect(Math.abs(gaps[placement])).toBeLessThanOrEqual(1);
      });
    }
  },
};

export const Hover: Story = {
  render: () => (
    <div style={wrapperStyle}>
      <GlPopover>
        <GlPopoverTrigger openOnHover render={<GlButton />}>Hover for details</GlPopoverTrigger>
        <GlPopoverContent>
          <GlPopoverBody>Supplemental details.</GlPopoverBody>
        </GlPopoverContent>
      </GlPopover>
    </div>
  ),
};
