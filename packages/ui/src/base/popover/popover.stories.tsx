import type { Meta, StoryObj } from "@storybook/react-vite";
import { Fragment, useRef, useState, type CSSProperties } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import GlButton from "../button/button";
import GlLink from "../link/link";
import GlPopover, {
  GlPopoverContent,
  GlPopoverTitle,
  GlPopoverTrigger,
  type GlPopoverPlacement,
} from "./popover";

const wrapperStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "2rem",
  minHeight: "400px",
};
const body = () => within(document.body);
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const meta = {
  title: "UI/Base/Popover",
  component: GlPopover,
  subcomponents: { GlPopoverTrigger, GlPopoverContent, GlPopoverTitle },
  args: {
    onOpenChange: fn(),
    onOpenChangeComplete: fn(),
  },
  argTypes: {
    children: { control: false },
    triggers: { control: "select", options: ["hover", "focus", "click", "manual", ["hover", "focus"]] },
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas popover documentation](https://design.gitlab.com/components/popover/). "
          + "Use GlPopoverTitle alongside body content inside GlPopoverContent. Prefer click triggers for interactive content; "
          + "the default retains GitLab UI's hover + focus-visible behavior with 50/150ms delays. "
          + "Portal rendering defaults to body and preserves keyboard navigation through Base UI focus guards. "
          + "Use portalled={false} with Content after Trigger when adjacent DOM reading order is required. "
          + "Target, title/default slots, cssClasses, and show/root events map to Trigger, Title/Content children, className, "
          + "and React state callbacks. Legacy placement aliases, fallbackPlacement, offset, variant, noninteractive, "
          + "Vue directives/instance APIs, detached or multiple triggers, and automatic Bootstrap modal containers are not supported.",
      },
    },
  },
  render: (args) => (
    <div style={wrapperStyle}>
      <GlPopover {...args}>
        <GlPopoverTrigger>Popover</GlPopoverTrigger>
        <GlPopoverContent>
          <GlPopoverTitle>Supplemental information</GlPopoverTitle>
          A popover provides additional information about the referring element.
        </GlPopoverContent>
      </GlPopover>
    </div>
  ),
} satisfies Meta<typeof GlPopover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, args }) => {
    const trigger = canvas.getByRole("button", { name: "Popover" });
    await userEvent.hover(trigger);
    const popup = await body().findByRole("dialog", { name: "Supplemental information" });

    await expect(popup).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(trigger).toHaveAttribute("aria-controls", popup.id);
    await expect(popup).not.toHaveAttribute("aria-describedby");
    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await userEvent.hover(popup);
    await pause(200);
    await expect(popup).toBeVisible();

    await userEvent.unhover(popup);
    await waitFor(() => expect(body().queryByRole("dialog")).not.toBeInTheDocument());
    await expect(args.onOpenChange).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(args.onOpenChangeComplete).toHaveBeenLastCalledWith(false));
  },
};

export const ClickAndKeyboard: Story = {
  args: { triggers: "click" },
  render: (args) => (
    <div style={wrapperStyle}>
      <GlButton>Before</GlButton>
      <GlPopover {...args}>
        <GlPopoverTrigger>Details</GlPopoverTrigger>
        <GlPopoverContent showCloseButton>
          <GlPopoverTitle>Popover title</GlPopoverTitle>
          <GlLink href="#details" onClick={(event) => event.preventDefault()}>Learn more</GlLink>
        </GlPopoverContent>
      </GlPopover>
      <GlButton>After</GlButton>
    </div>
  ),
  play: async ({ canvas, args }) => {
    const trigger = canvas.getByRole("button", { name: "Details" });
    await userEvent.click(canvas.getByRole("button", { name: "Before" }));
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await expect(body().queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    const popup = await body().findByRole("dialog", { name: "Popover title" });

    await expect(trigger).toHaveFocus();
    await expect(popup).toHaveAccessibleName("Popover title");
    await userEvent.tab();
    await expect(within(popup).getByRole("button", { name: "Close" })).toHaveFocus();
    await userEvent.tab();
    await expect(within(popup).getByRole("link")).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();
    await pause(200);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.keyboard(" ");
    await body().findByRole("dialog");
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "After" })).toHaveFocus();
    await waitFor(() => expect(body().queryByRole("dialog")).not.toBeInTheDocument());
    await expect(args.onOpenChange).toHaveBeenCalledTimes(4);
  },
};

export const FocusAndHover: Story = {
  render: (args) => (
    <div style={wrapperStyle}>
      <GlButton>Before</GlButton>
      <GlPopover {...args}>
        <GlPopoverTrigger>Focus trigger</GlPopoverTrigger>
        <GlPopoverContent><GlLink href="#focus">Learn more</GlLink></GlPopoverContent>
      </GlPopover>
      <GlButton>After</GlButton>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Focus trigger" });
    await userEvent.click(canvas.getByRole("button", { name: "Before" }));
    await userEvent.tab();
    const popup = await body().findByRole("dialog", { name: "Focus trigger" });
    await userEvent.hover(trigger);
    await userEvent.unhover(trigger);
    await pause(200);
    await expect(popup).toBeVisible();

    await userEvent.tab();
    await expect(within(popup).getByRole("link")).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).not.toBeInTheDocument());
    await pause(200);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.tab({ shift: true });
    await userEvent.tab();
    await body().findByRole("dialog");
    await userEvent.click(canvas.getByRole("button", { name: "After" }));
    await waitFor(() => expect(body().queryByRole("dialog")).not.toBeInTheDocument());
    await expect(canvas.getByRole("button", { name: "After" })).toHaveFocus();
  },
};

export const FocusOnly: Story = {
  args: { triggers: "focus" },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button");
    await userEvent.click(trigger);
    await pause(100);
    await expect(body().queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.tab({ shift: true });
    await userEvent.tab();
    await body().findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).not.toBeInTheDocument());
  },
};

export const Delays: Story = {
  args: { triggers: "hover", delay: 300, closeDelay: 300 },
  play: async ({ canvas, args }) => {
    const trigger = canvas.getByRole("button");
    await userEvent.hover(trigger);
    await expect(body().queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.unhover(trigger);
    await pause(350);
    await expect(args.onOpenChange).not.toHaveBeenCalled();

    await userEvent.hover(trigger);
    const popup = await body().findByRole("dialog");
    await userEvent.unhover(trigger);
    await expect(popup).toBeVisible();
    await userEvent.hover(popup);
    await pause(350);
    await expect(popup).toBeVisible();
    await userEvent.unhover(popup);
    await waitFor(() => expect(body().queryByRole("dialog")).not.toBeInTheDocument());
  },
};

function ControlledExample() {
  const [open, setOpen] = useState(false);
  const [locked, setLocked] = useState(true);
  const [title, setTitle] = useState(true);
  const [requests, setRequests] = useState(0);
  const [closeClicks, setCloseClicks] = useState(0);
  return (
    <div style={wrapperStyle}>
      <GlButton onClick={() => setOpen(!open)}>Toggle externally</GlButton>
      <GlPopover
        onOpenChange={(nextOpen) => {
          setRequests((count) => count + 1);
          if(!locked) setOpen(nextOpen);
        }}
        open={open}
        triggers="manual">
        <GlPopoverTrigger>Manual trigger</GlPopoverTrigger>
        <GlPopoverContent
          onCloseButtonClick={() => setCloseClicks((count) => count + 1)}
          showCloseButton>
          {title ? <GlPopoverTitle id="dynamic-title">Dynamic title</GlPopoverTitle> : null}
          <GlButton onClick={() => setTitle(!title)}>Toggle title</GlButton>
          <GlButton onClick={() => setLocked(false)}>Allow closing</GlButton>
          <output aria-label="Close requests">{requests}</output>
          <output aria-label="Close clicks">{closeClicks}</output>
        </GlPopoverContent>
      </GlPopover>
    </div>
  );
}

export const ControlledAndDynamicTitle: Story = {
  render: () => <ControlledExample />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Manual trigger" });
    await userEvent.hover(trigger);
    await userEvent.click(trigger);
    await pause(100);
    await expect(body().queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Toggle externally" }));
    const popup = await body().findByRole("dialog", { name: "Dynamic title" });
    await expect(popup).toHaveAttribute("aria-labelledby", "dynamic-title");
    await userEvent.click(within(popup).getByRole("button", { name: "Toggle title" }));
    await expect(popup).toHaveAccessibleName("Manual trigger");
    await expect(popup).not.toHaveClass("has-title");
    await expect(within(popup).queryByRole("heading")).not.toBeInTheDocument();
    await userEvent.click(within(popup).getByRole("button", { name: "Toggle title" }));
    await expect(popup).toHaveAccessibleName("Dynamic title");

    await userEvent.click(within(popup).getByRole("button", { name: "Close" }));
    await expect(popup).toBeVisible();
    await expect(within(popup).getByLabelText("Close requests")).toHaveTextContent("1");
    await expect(within(popup).getByLabelText("Close clicks")).toHaveTextContent("1");
    await userEvent.click(within(popup).getByRole("button", { name: "Allow closing" }));
    await userEvent.click(within(popup).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(body().queryByRole("dialog")).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();
  },
};

export const Disabled: Story = {
  render: () => (
    <div style={wrapperStyle}>
      <GlPopover disabled><GlPopoverTrigger>Root disabled</GlPopoverTrigger><GlPopoverContent>Body</GlPopoverContent></GlPopover>
      <GlPopover><GlPopoverTrigger disabled>Trigger disabled</GlPopoverTrigger><GlPopoverContent>Body</GlPopoverContent></GlPopover>
      <GlPopover><GlPopoverTrigger loading>Loading</GlPopoverTrigger><GlPopoverContent>Body</GlPopoverContent></GlPopover>
    </div>
  ),
  play: async ({ canvas }) => {
    for(const trigger of canvas.getAllByRole("button")) {
      await userEvent.hover(trigger);
      await userEvent.click(trigger);
      await pause(100);
      await expect(body().queryByRole("dialog")).not.toBeInTheDocument();
    }
  },
};

function ComposedExample() {
  const triggerRef = useRef<HTMLElement>(null);
  const childRef = useRef<HTMLAnchorElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [clicks, setClicks] = useState(0);
  const [childClicks, setChildClicks] = useState(0);
  const [refsValid, setRefsValid] = useState(false);
  return (
    <div style={wrapperStyle}>
      <GlPopover triggers="click">
        <GlPopoverTrigger
          ref={triggerRef}
          nativeButton={false}
          onClick={() => setClicks((value) => value + 1)}
          render={<a ref={childRef} href="#composed" onClick={() => setChildClicks((value) => value + 1)} />}>
          Composed trigger
        </GlPopoverTrigger>
        <GlPopoverContent ref={popupRef} container={containerRef}>
          <GlPopoverTitle ref={titleRef}>Composed title</GlPopoverTitle>
          <GlButton onClick={() => setRefsValid(triggerRef.current === childRef.current
            && popupRef.current?.getAttribute("role") === "dialog"
            && titleRef.current?.tagName === "H3")}>
            Check refs
          </GlButton>
          <output aria-label="Refs valid">{String(refsValid)}</output>
        </GlPopoverContent>
      </GlPopover>
      <output aria-label="Trigger clicks">{clicks}</output>
      <output aria-label="Child clicks">{childClicks}</output>
      <div ref={containerRef} data-testid="custom-container" />
    </div>
  );
}

export const CompositionAndContainer: Story = {
  render: () => <ComposedExample />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("link", { name: "Composed trigger" }));
    const popup = await within(canvas.getByTestId("custom-container")).findByRole("dialog", { name: "Composed title" });
    await expect(canvas.getByLabelText("Trigger clicks")).toHaveTextContent("1");
    await expect(canvas.getByLabelText("Child clicks")).toHaveTextContent("1");
    await expect(window.location.hash).toBe("#composed");
    await userEvent.click(within(popup).getByRole("button", { name: "Check refs" }));
    await expect(within(popup).getByLabelText("Refs valid")).toHaveTextContent("true");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).not.toBeInTheDocument());
  },
};

export const InlineAndRefs: Story = {
  render: function InlineExample() {
    const triggerRef = useRef<HTMLElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const [valid, setValid] = useState(false);
    return (
      <div style={wrapperStyle}>
        <GlPopover triggers="click">
          <GlPopoverTrigger ref={triggerRef} render={<button className="custom-trigger" />}>Inline trigger</GlPopoverTrigger>
          <GlPopoverContent ref={popupRef} portalled={false}>
            <GlPopoverTitle ref={titleRef}>Inline title</GlPopoverTitle>
            <GlButton onClick={() => setValid(triggerRef.current?.classList.contains("custom-trigger") === true
              && popupRef.current?.getAttribute("role") === "dialog"
              && titleRef.current?.tagName === "H3")}>
              Check refs
            </GlButton>
            <output aria-label="Refs valid">{String(valid)}</output>
          </GlPopoverContent>
        </GlPopover>
      </div>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Inline trigger" }));
    const popup = await canvas.findByRole("dialog", { name: "Inline title" });
    await userEvent.click(within(popup).getByRole("button", { name: "Check refs" }));
    await expect(within(popup).getByLabelText("Refs valid")).toHaveTextContent("true");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("dialog")).not.toBeInTheDocument());
  },
};

const placements: GlPopoverPlacement[] = ["top", "right", "bottom", "left"];

export const PlacementAndHeaderMatrix: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8rem", padding: "8rem" }}>
      {placements.map((placement, index) => (
        <GlPopover key={placement} defaultOpen triggers="manual">
          <GlPopoverTrigger>{placement}</GlPopoverTrigger>
          <GlPopoverContent noFade placement={placement} showCloseButton={index % 2 === 1}>
            {index < 2 ? <GlPopoverTitle>Popover title</GlPopoverTitle> : null}
            Some supplemental information.
          </GlPopoverContent>
        </GlPopover>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const popups = await body().findAllByRole("dialog");
    await expect(popups).toHaveLength(4);
    for(const placement of placements) {
      const trigger = canvas.getByRole("button", { name: placement, exact: true });
      await waitFor(() => expect(trigger).toHaveAttribute("aria-controls"));
      const popup = document.getElementById(trigger.getAttribute("aria-controls")!)!;
      await waitFor(() => expect(popup).toHaveClass(`bs-popover-${placement}`));
      const arrow = popup.querySelector<HTMLElement>(".arrow")!;
      const triggerRect = trigger.getBoundingClientRect();
      const arrowRect = arrow.getBoundingClientRect();
      const gaps = {
        top: triggerRect.top - arrowRect.bottom,
        right: arrowRect.left - triggerRect.right,
        bottom: arrowRect.top - triggerRect.bottom,
        left: triggerRect.left - arrowRect.right,
      };
      await expect(Math.abs(gaps[placement])).toBeLessThanOrEqual(2);
      await expect(getComputedStyle(popup).maxWidth).toBe("280px");
      await expect(getComputedStyle(popup).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
      await expect(getComputedStyle(arrow, "::before").borderStyle).toBe("solid");
    }
  },
};

export const ViewportCollision: Story = {
  render: () => (
    <div style={{ position: "fixed", top: "5px", left: "50%" }}>
      <GlPopover defaultOpen triggers="manual">
        <GlPopoverTrigger>Viewport edge</GlPopoverTrigger>
        <GlPopoverContent noFade>
          <GlPopoverTitle>Flipped below</GlPopoverTitle>
          Content stays inside the viewport.
        </GlPopoverContent>
      </GlPopover>
    </div>
  ),
  play: async () => {
    const popup = await body().findByRole("dialog");
    await waitFor(() => expect(popup).toHaveClass("bs-popover-bottom"));
    await expect(popup.getBoundingClientRect().top).toBeGreaterThanOrEqual(5);
  },
};

export const LongContent: Story = {
  render: () => (
    <div style={{ ...wrapperStyle, minHeight: "750px" }}>
      <GlPopover defaultOpen triggers="manual">
        <GlPopoverTrigger>Long content</GlPopoverTrigger>
        <GlPopoverContent showCloseButton>
          <Fragment>
            <GlPopoverTitle>Supplemental information with a longer title that wraps across several lines</GlPopoverTitle>
          </Fragment>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          <hr className="popover-hr" />
          <GlLink href="https://design.gitlab.com/components/popover/">Learn more</GlLink>
        </GlPopoverContent>
      </GlPopover>
    </div>
  ),
};

export const ContentStructure: Story = {
  render: () => (
    <div style={wrapperStyle}>
      <GlPopover defaultOpen triggers="manual">
        <GlPopoverTrigger>Structure</GlPopoverTrigger>
        <GlPopoverContent noFade id="structure-popup" className="custom-popup" closeButtonLabel="Dismiss details" showCloseButton>
          {[
            <Fragment key="fragment">
              <span>First</span>
              {false}
              {null}
              <GlPopoverTitle id="structure-title" className="custom-title">Rich <em>title</em></GlPopoverTitle>
            </Fragment>,
            0,
            <span key="last">Last</span>,
            "<script>alert(1)</script>",
          ]}
        </GlPopoverContent>
      </GlPopover>
    </div>
  ),
  play: async () => {
    const popup = await body().findByRole("dialog", { name: "Rich title" });
    await expect(popup).toHaveAttribute("id", "structure-popup");
    await expect(popup).toHaveAttribute("aria-labelledby", "structure-title");
    await expect(popup).toHaveClass("custom-popup", "has-title", "has-close-button");
    await expect(popup).not.toHaveClass("fade");
    const heading = within(popup).getByRole("heading", { level: 3 });
    await expect(heading).toHaveClass("custom-title");
    await expect(heading.querySelector("em")).toHaveTextContent("title");
    await expect(heading.querySelector("button")).toBeNull();
    const content = popup.querySelector(".popover-body")!;
    await expect(content.textContent).toBe("First0Last<script>alert(1)</script>");
    await expect(content.querySelector("script")).toBeNull();
    await expect(content.querySelector("h3")).toBeNull();
    await expect(popup.firstElementChild).toHaveClass("arrow");
    await expect(popup.children[1]).toHaveClass("popover-header");
    await userEvent.click(within(popup).getByRole("button", { name: "Dismiss details" }));
    await waitFor(() => expect(body().queryByRole("dialog")).not.toBeInTheDocument());
  },
};
