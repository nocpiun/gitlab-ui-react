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

function KeyedTabsExample(props: GlTabsProps) {
  const [tabs, setTabs] = useState([
    { id: "overview", title: "Overview" },
    { id: "activity", title: "Activity" },
    { id: "members", title: "Members" },
  ]);

  return (
    <>
      <GlButton
        onClick={() => setTabs((currentTabs) => {
          const newTabNumber = currentTabs
            .filter((tab) => tab.id.startsWith("new-"))
            .length + 1;
          return [
            { id: `new-${newTabNumber}`, title: `New ${newTabNumber}` },
            ...currentTabs,
          ];
        })}>
        Insert first tab
      </GlButton>
      <GlButton
        onClick={() => setTabs((currentTabs) => {
          const activity = currentTabs.find((tab) => tab.id === "activity");
          if(!activity) return currentTabs;
          return [activity, ...currentTabs.filter((tab) => tab !== activity)];
        })}>
        Move activity first
      </GlButton>
      <GlTabs {...props} defaultValue={1}>
        {tabs.map((tab) => (
          <GlTab key={tab.id} title={tab.title}>{tab.title} panel</GlTab>
        ))}
      </GlTabs>
    </>
  );
}

export const KeyedChildrenReordering: Story = {
  render: (args) => <KeyedTabsExample {...args} />,
  play: async ({ args, canvas }) => {
    const activity = canvas.getByRole("tab", { name: "Activity" });

    await expect(activity).toHaveAttribute("aria-selected", "true");
    const insertButton = canvas.getByRole("button", { name: "Insert first tab" });
    await userEvent.click(insertButton);
    const firstInsertedTab = canvas.getByRole("tab", { name: "New 1" });
    await waitFor(() => expect(activity).toHaveAttribute("aria-selected", "true"));
    await expect(canvas.getByRole("tabpanel", { name: "Activity" }))
      .toHaveTextContent("Activity panel");
    await expect(args.onValueChange).toHaveBeenLastCalledWith(2);

    await userEvent.click(canvas.getByRole("button", { name: "Move activity first" }));
    await waitFor(() => expect(activity).toHaveAttribute("aria-selected", "true"));
    await expect(args.onValueChange).toHaveBeenLastCalledWith(0);

    await userEvent.click(insertButton);
    await userEvent.click(firstInsertedTab);
    await expect(firstInsertedTab).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("tabpanel", { name: "New 1" }))
      .toHaveTextContent("New 1 panel");
    await expect(args.onValueChange).toHaveBeenLastCalledWith(2);
  },
};

function RemovableLastTabExample(props: GlTabsProps) {
  const [showMembers, setShowMembers] = useState(true);

  return (
    <>
      <GlButton onClick={() => setShowMembers(false)}>Remove members</GlButton>
      <GlTabs {...props} defaultValue={2}>
        <GlTab key="overview" title="Overview">Overview panel</GlTab>
        <GlTab key="activity" title="Activity">Activity panel</GlTab>
        {showMembers ? (
          <GlTab key="members" title="Members">Members panel</GlTab>
        ) : null}
      </GlTabs>
    </>
  );
}

export const ActiveLastTabRemoval: Story = {
  render: (args) => <RemovableLastTabExample {...args} />,
  play: async ({ args, canvas }) => {
    const overview = canvas.getByRole("tab", { name: "Overview" });
    const activity = canvas.getByRole("tab", { name: "Activity" });
    const members = canvas.getByRole("tab", { name: "Members" });

    await expect(members).toHaveAttribute("aria-selected", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Remove members" }));

    await waitFor(() => expect(activity).toHaveAttribute("aria-selected", "true"));
    await expect(overview).toHaveAttribute("aria-selected", "false");
    await expect(canvas.getByRole("tabpanel", { name: "Activity" }))
      .toHaveTextContent("Activity panel");
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenLastCalledWith(1);
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

function ControlledQuerySyncTabs(props: GlTabsProps) {
  const [acceptChanges, setAcceptChanges] = useState(false);
  const [value, setValue] = useState(0);
  useState(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("gl-tabs-controlled-story-view", "all");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  });

  return (
    <>
      <GlButton onClick={() => setAcceptChanges(true)}>Allow tab changes</GlButton>
      <GlTabs
        {...props}
        onValueChange={(nextValue) => {
          if(acceptChanges) setValue(nextValue);
          props.onValueChange?.(nextValue);
        }}
        queryParamName="gl-tabs-controlled-story-view"
        syncActiveTabWithQueryParams
        value={value}>
        <GlTab queryParamValue="all" title="All">All issues</GlTab>
        <GlTab queryParamValue="open" title="Open">Open issues</GlTab>
      </GlTabs>
    </>
  );
}

export const ControlledQuerySynchronization: Story = {
  render: (args) => <ControlledQuerySyncTabs {...args} />,
  play: async ({ args, canvas }) => {
    const all = canvas.getByRole("tab", { name: "All" });
    const open = canvas.getByRole("tab", { name: "Open" });
    const queryValue = () => new URL(window.location.href)
      .searchParams.get("gl-tabs-controlled-story-view");

    await waitFor(() => expect(queryValue()).toBe("all"));
    await userEvent.click(open);
    await expect(args.onValueChange).toHaveBeenLastCalledWith(1);
    await expect(all).toHaveAttribute("aria-selected", "true");
    await expect(queryValue()).toBe("all");

    await userEvent.click(canvas.getByRole("button", { name: "Allow tab changes" }));
    await userEvent.click(open);
    await waitFor(() => expect(open).toHaveAttribute("aria-selected", "true"));
    await waitFor(() => expect(queryValue()).toBe("open"));
  },
};

function RejectedQuerySelectionTabs(props: GlTabsProps) {
  const [parentRenderCount, setParentRenderCount] = useState(0);
  const [selectionRequestCount, setSelectionRequestCount] = useState(0);
  useState(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("gl-tabs-rejected-story-view", "all");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  });

  return (
    <>
      <GlButton onClick={() => setParentRenderCount((count) => count + 1)}>
        Rerender parent ({parentRenderCount})
      </GlButton>
      <div>Selection requests: {selectionRequestCount}</div>
      <GlTabs
        {...props}
        onValueChange={(nextValue) => {
          setSelectionRequestCount((count) => count + 1);
          props.onValueChange?.(nextValue);
        }}
        queryParamName="gl-tabs-rejected-story-view"
        syncActiveTabWithQueryParams
        value={0}>
        <GlTab queryParamValue="all" title="All">All issues</GlTab>
        <GlTab queryParamValue="open" title="Open">Open issues</GlTab>
      </GlTabs>
    </>
  );
}

export const RejectedControlledQuerySelection: Story = {
  render: (args) => <RejectedQuerySelectionTabs {...args} />,
  play: async ({ args, canvas }) => {
    const all = canvas.getByRole("tab", { name: "All" });
    const open = canvas.getByRole("tab", { name: "Open" });
    const queryValue = () => new URL(window.location.href)
      .searchParams.get("gl-tabs-rejected-story-view");

    await waitFor(() => expect(queryValue()).toBe("all"));
    const url = new URL(window.location.href);
    url.searchParams.set("gl-tabs-rejected-story-view", "open");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    window.dispatchEvent(new PopStateEvent("popstate"));

    await waitFor(() => {
      expect(canvas.getByText("Selection requests: 1")).toBeInTheDocument();
    });
    await userEvent.click(canvas.getByRole("button", { name: "Rerender parent (0)" }));

    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenLastCalledWith(1);
    await expect(canvas.getByText("Selection requests: 1")).toBeInTheDocument();
    await expect(all).toHaveAttribute("aria-selected", "true");
    await expect(open).toHaveAttribute("aria-selected", "false");
    await expect(queryValue()).toBe("open");
  },
};

function DisabledActiveQueryTab(props: GlTabsProps) {
  const [openDisabled, setOpenDisabled] = useState(false);
  useState(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("gl-tabs-disabled-story-view", "open");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  });

  return (
    <>
      <GlButton onClick={() => setOpenDisabled(true)}>Disable open tab</GlButton>
      <GlButton onClick={() => setOpenDisabled(false)}>Enable open tab</GlButton>
      <GlTabs
        {...props}
        defaultValue={1}
        queryParamName="gl-tabs-disabled-story-view"
        syncActiveTabWithQueryParams>
        <GlTab queryParamValue="all" title="All">All issues</GlTab>
        <GlTab disabled={openDisabled} queryParamValue="open" title="Open">
          Open issues
        </GlTab>
      </GlTabs>
    </>
  );
}

export const DisabledActiveTabFallback: Story = {
  render: (args) => <DisabledActiveQueryTab {...args} />,
  play: async ({ args, canvas }) => {
    const all = canvas.getByRole("tab", { name: "All" });
    const open = canvas.getByRole("tab", { name: "Open" });
    const queryValue = () => new URL(window.location.href)
      .searchParams.get("gl-tabs-disabled-story-view");

    await waitFor(() => expect(open).toHaveAttribute("aria-selected", "true"));
    await expect(queryValue()).toBe("open");

    await userEvent.click(canvas.getByRole("button", { name: "Disable open tab" }));

    await waitFor(() => expect(all).toHaveAttribute("aria-selected", "true"));
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenLastCalledWith(0);
    await waitFor(() => expect(queryValue()).toBe("all"));

    await userEvent.click(canvas.getByRole("button", { name: "Enable open tab" }));

    await expect(all).toHaveAttribute("aria-selected", "true");
    await expect(open).toHaveAttribute("aria-selected", "false");
    await expect(queryValue()).toBe("all");
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
