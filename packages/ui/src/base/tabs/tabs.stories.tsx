import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import GlButton from "../button/button";
import GlTab from "./tab";
import GlTabs, {
  GlScrollableTabs,
  GlTabActions,
  GlTabsAfter,
  GlTabsBefore,
  type GlTabsProps,
} from "./tabs";

const meta = {
  title: "UI/Base/Tabs",
  component: GlTabs,
  args: {
    defaultValue: 0,
    justified: false,
    lazy: false,
    onValueChange: fn(),
    queryParamName: "tab",
    syncActiveTabWithQueryParams: false,
  },
  argTypes: {
    children: { control: false },
    contentClassName: { control: false },
    empty: { control: false },
    navClassName: { control: false },
    value: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas tabs documentation](https://design.gitlab.com/components/tabs) for usage and implementation guidance.",
      },
    },
  },
  render: (args) => (
    <GlTabs {...args}>
      <GlTab title="Overview">Overview panel</GlTab>
      <GlTab title="Activity">Activity panel</GlTab>
      <GlTab title="Members">Members panel</GlTab>
    </GlTabs>
  ),
} satisfies Meta<typeof GlTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas }) => {
    const user = userEvent.setup();
    const [overview, activity, members] = canvas.getAllByRole("tab");

    await expect(overview).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("tabpanel")).toHaveTextContent("Overview panel");

    await user.pointer({ keys: "[MouseLeft>]", target: activity });
    await expect(activity).toHaveFocus();
    await expect(overview).toHaveAttribute("aria-selected", "true");
    await expect(activity).toHaveAttribute("aria-selected", "false");

    await user.pointer({ keys: "[/MouseLeft]", target: activity });
    await expect(args.onValueChange).toHaveBeenLastCalledWith(1);
    await expect(activity).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("tabpanel", { name: "Activity" }))
      .toHaveTextContent("Activity panel");

    activity.focus();
    await user.keyboard("{ArrowRight}");
    await expect(members).toHaveFocus();
    await expect(members).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowRight}");
    await expect(members).toHaveFocus();
  },
};

function ControlledTabsExample(props: GlTabsProps) {
  const [value, setValue] = useState(1);
  return (
    <>
      <GlButton onClick={() => setValue(0)}>Select overview</GlButton>
      <GlTabs
        {...props}
        onValueChange={(nextValue) => {
          setValue(nextValue);
          props.onValueChange?.(nextValue);
        }}
        value={value}>
        <GlTab title="Overview">Overview panel</GlTab>
        <GlTab title="Activity">Activity panel</GlTab>
      </GlTabs>
    </>
  );
}

export const Controlled: Story = {
  render: (args) => <ControlledTabsExample {...args} />,
  play: async ({ canvas }) => {
    const overview = canvas.getByRole("tab", { name: "Overview" });
    const activity = canvas.getByRole("tab", { name: "Activity" });

    await expect(activity).toHaveAttribute("aria-selected", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Select overview" }));
    await expect(overview).toHaveAttribute("aria-selected", "true");
  },
};

export const Justified: Story = {
  args: { justified: true },
};

export const CountsAndDisabled: Story = {
  render: (args) => (
    <GlTabs {...args}>
      <GlTab tabCount={42} tabCountSrText="42 issues" title="All">
        All issues
      </GlTab>
      <GlTab tabCount={15} tabCountSrText="15 open issues" title="Open">
        Open issues
      </GlTab>
      <GlTab disabled title="Closed">Closed issues</GlTab>
    </GlTabs>
  ),
  play: async ({ canvas }) => {
    const all = canvas.getByRole("tab", { name: /All 42 issues/ });
    const open = canvas.getByRole("tab", { name: /Open 15 open issues/ });
    const closed = canvas.getByRole("tab", { name: "Closed" });

    await expect(all).toBeInTheDocument();
    await expect(closed).toHaveAttribute("aria-disabled", "true");

    all.focus();
    await userEvent.keyboard("{End}");
    await expect(open).toHaveFocus();
    await expect(open).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{ArrowRight}");
    await expect(open).toHaveFocus();
  },
};

export const Empty: Story = {
  args: { children: null, empty: "No tabs are available." },
  render: (args) => <GlTabs {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No tabs are available.")).toBeInTheDocument();
    await expect(canvas.queryByRole("tab")).not.toBeInTheDocument();
  },
};

export const RegionsAndActions: Story = {
  render: (args) => (
    <GlTabs {...args}>
      <GlTabsBefore>
        <GlButton aria-label="Refresh issues" category="tertiary" icon="retry" />
      </GlTabsBefore>
      <GlTab title="All">All issues</GlTab>
      <GlTab title="Open">Open issues</GlTab>
      <GlTabsAfter>
        <GlButton category="tertiary">Export</GlButton>
      </GlTabsAfter>
      <GlTabActions aria-label="Issue actions">
        <GlButton category="secondary">Cancel</GlButton>
        <GlButton variant="confirm">Save changes</GlButton>
      </GlTabActions>
    </GlTabs>
  ),
  play: async ({ canvas }) => {
    const tablist = canvas.getByRole("tablist");
    const before = canvas.getByRole("button", { name: "Refresh issues" });
    const after = canvas.getByRole("button", { name: "Export" });

    await expect(tablist.contains(before)).toBe(false);
    await expect(tablist.contains(after)).toBe(false);
    await expect(canvas.getAllByRole("button", { name: "Save changes" })).toHaveLength(1);
    await expect(canvas.getByRole("toolbar", { name: "Issue actions" })).toBeInTheDocument();
  },
};

function QuerySyncTabs(props: GlTabsProps) {
  const [value, setValue] = useState(0);
  useState(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("gl-tabs-story-view", "open");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  });

  return (
    <GlTabs
      {...props}
      onValueChange={(nextValue) => {
        setValue(nextValue);
        props.onValueChange?.(nextValue);
      }}
      queryParamName="gl-tabs-story-view"
      syncActiveTabWithQueryParams
      value={value}>
      <GlTab queryParamValue="all" title="All">All issues</GlTab>
      <GlTab queryParamValue="open" title="Open">Open issues</GlTab>
    </GlTabs>
  );
}

export const QuerySynchronization: Story = {
  render: (args) => <QuerySyncTabs {...args} />,
  play: async ({ canvas }) => {
    const all = canvas.getByRole("tab", { name: "All" });
    const open = canvas.getByRole("tab", { name: "Open" });

    await waitFor(() => expect(open).toHaveAttribute("aria-selected", "true"));
    const url = new URL(window.location.href);
    url.searchParams.set("gl-tabs-story-view", "all");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() => expect(all).toHaveAttribute("aria-selected", "true"));
  },
};

export const LazyPanels: Story = {
  args: { lazy: true },
};

export const Scrollable: Story = {
  render: () => (
    <div style={{ maxWidth: "40rem" }}>
      <GlScrollableTabs>
        {Array.from({ length: 30 }, (_, index) => (
          <GlTab key={index} title={`Tab ${index + 1}`}>
            Panel {index + 1}
          </GlTab>
        ))}
      </GlScrollableTabs>
    </div>
  ),
  play: async ({ canvas }) => {
    const tablist = canvas.getByRole("tablist");
    const scrollRight = await canvas.findByRole("button", { name: "Scroll right" });

    await waitFor(() => expect(tablist.scrollWidth).toBeGreaterThan(tablist.clientWidth));
    await userEvent.click(scrollRight);
    await waitFor(() => expect(tablist.scrollLeft).toBeGreaterThan(0));
    await expect(canvas.getByRole("button", { name: "Scroll left" })).toBeInTheDocument();
  },
};

function ScrollableLayoutChangeExample() {
  const [wideTabs, setWideTabs] = useState(false);
  return (
    <div style={{ maxWidth: "100%", width: "30rem" }}>
      <GlButton onClick={() => setWideTabs(true)}>Widen tabs</GlButton>
      <GlScrollableTabs>
        {["Overview", "Activity", "Members"].map((title) => (
          <GlTab
            key={title}
            tabProps={{ style: { minWidth: wideTabs ? "20rem" : undefined } }}
            title={title}>
            {title} panel
          </GlTab>
        ))}
      </GlScrollableTabs>
    </div>
  );
}

export const ScrollableLayoutChanges: Story = {
  render: () => <ScrollableLayoutChangeExample />,
  play: async ({ canvas }) => {
    const tablist = canvas.getByRole("tablist");

    await waitFor(() => expect(tablist.scrollWidth).toBeLessThanOrEqual(tablist.clientWidth));
    await expect(canvas.queryByRole("button", { name: "Scroll right" })).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "Widen tabs" }));

    await waitFor(() => expect(tablist.scrollWidth).toBeGreaterThan(tablist.clientWidth));
    await expect(canvas.getByRole("button", { name: "Scroll right" })).toBeInTheDocument();
  },
};
