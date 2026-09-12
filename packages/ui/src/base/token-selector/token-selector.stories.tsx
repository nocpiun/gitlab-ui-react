import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import GlAvatar from "../avatar/avatar";
import GlButton from "../button/button";
import GlTokenSelector, {
  type GlTokenSelectorItem,
  type GlTokenSelectorProps,
} from "./token-selector";

const projects: GlTokenSelectorItem[] = [
  { id: 1, name: "GitLab" },
  { id: "1", name: "Runner" },
  { id: 3, name: "Pajamas" },
  { id: 4, name: "Duo" },
];

function ControlledSelector({
  sourceItems = projects,
  ...props
}: GlTokenSelectorProps & { sourceItems?: GlTokenSelectorItem[] }) {
  const [query, setQuery] = useState("");
  const [value, setValue] = useState<GlTokenSelectorItem[]>(() => [
    ...(props.defaultValue ?? []),
  ]);
  const filteredItems = sourceItems.filter((item) => (
    (item.name ?? "").toLocaleLowerCase().includes(query.toLocaleLowerCase())
  ));

  return (
    <GlTokenSelector
      {...props}
      defaultValue={undefined}
      items={filteredItems}
      onInputValueChange={(nextQuery) => {
        setQuery(nextQuery);
        props.onInputValueChange?.(nextQuery);
      }}
      onValueChange={(nextValue) => {
        setValue(nextValue);
        props.onValueChange?.(nextValue);
      }}
      value={value} />
  );
}

const meta = {
  title: "UI/Base/Token Selector",
  component: GlTokenSelector,
  args: {
    allowClearAll: true,
    allowUserDefinedTokens: false,
    defaultValue: [projects[0]],
    hideDropdownWithNoItems: false,
    id: "project-token-selector",
    items: projects,
    loading: false,
    onInputValueChange: fn(),
    onKeyDown: fn(),
    onTokenAdd: fn(),
    onTokenRemove: fn(),
    onValueChange: fn(),
    placeholder: "Search projects",
    showAddNewAlways: false,
    state: null,
    viewOnly: false,
  },
  argTypes: {
    defaultValue: { control: false },
    dropdownFooter: { control: false },
    emptyPlaceholder: { control: false },
    inputProps: { control: false },
    items: { control: false },
    loadingContent: { control: false },
    noResultsContent: { control: false },
    renderDropdownItem: { control: false },
    renderToken: { control: false },
    renderUserDefinedToken: { control: false },
    state: {
      control: "select",
      options: [null, true, false],
    },
    value: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: "React port of the Pajamas token selector. Candidate filtering remains controlled by the consumer through onInputValueChange.",
      },
    },
  },
  render: (args) => (
    <div style={{ maxWidth: 520 }}>
      <label htmlFor={args.id}>Projects</label>
      <ControlledSelector {...args} sourceItems={projects} />
    </div>
  ),
} satisfies Meta<typeof GlTokenSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas }) => {
    args.onInputValueChange!.mockClear();
    args.onTokenAdd!.mockClear();
    args.onTokenRemove!.mockClear();
    args.onValueChange!.mockClear();
    const input = canvas.getByRole("combobox", { name: "Projects" });

    input.focus();
    await waitFor(() => expect(input).toHaveAttribute("aria-expanded", "true"));
    const listbox = await canvas.findByRole("listbox");
    const panel = listbox.closest(".gl-new-dropdown-panel");
    await expect(listbox).toHaveAttribute("id", input.getAttribute("aria-controls"));
    await expect(panel).toHaveClass("gl-new-dropdown-panel-fixed-width");
    await expect(panel).not.toHaveClass("gl-new-dropdown-panel-match-trigger-width");
    await expect(panel!.getBoundingClientRect().width).toBeCloseTo(248, 0);
    await expect(listbox.scrollHeight).toBeLessThanOrEqual(listbox.clientHeight + 1);
    await expect(within(listbox).queryByRole("option", { name: "GitLab" }))
      .not.toBeInTheDocument();

    const runnerOption = within(listbox).getByRole("option", { name: "Runner" });
    const pajamasOption = within(listbox).getByRole("option", { name: "Pajamas" });
    await expect(runnerOption.getBoundingClientRect().height).toBeGreaterThanOrEqual(32);
    await expect(input).toHaveAttribute("aria-activedescendant", runnerOption.id);
    await userEvent.hover(pajamasOption);
    await expect(input).toHaveAttribute("aria-activedescendant", runnerOption.id);
    await expect(pajamasOption).not.toHaveClass("gl-new-dropdown-item-highlighted");
    await expect(
      getComputedStyle(pajamasOption.querySelector(".gl-new-dropdown-item-content")!).boxShadow,
    ).toBe("none");
    await userEvent.keyboard("{Enter}");
    await expect(args.onTokenAdd).toHaveBeenLastCalledWith(projects[1]);
    await expect(args.onValueChange!.mock.invocationCallOrder[0])
      .toBeLessThan(args.onTokenAdd!.mock.invocationCallOrder[0]);
    await expect(input).toHaveFocus();
    await expect(input).toHaveAttribute("aria-expanded", "false");

    const runner = canvas.getByText("Runner").closest(".gl-token-selector-token-container")!;
    await userEvent.click(within(runner as HTMLElement).getByRole("button", { name: "Remove" }));
    await expect(args.onTokenRemove).toHaveBeenLastCalledWith(projects[1]);

    await userEvent.type(input, "paj");
    await expect(args.onInputValueChange).toHaveBeenLastCalledWith("paj");
    await expect(await canvas.findByRole("option", { name: "Pajamas" })).toBeVisible();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByText("Pajamas")).toBeInTheDocument();

    const removeCallsBeforeClear = args.onTokenRemove!.mock.calls.length;
    await userEvent.click(canvas.getByRole("button", { name: "Clear all" }));
    await expect(args.onValueChange).toHaveBeenLastCalledWith([]);
    await expect(args.onTokenRemove).toHaveBeenCalledTimes(removeCallsBeforeClear);
    await expect(input).toHaveFocus();
  },
};

export const Uncontrolled: Story = {
  args: {
    defaultValue: [projects[0]],
  },
  render: (args) => (
    <div style={{ maxWidth: 520 }}>
      <label htmlFor="uncontrolled-token-selector">Uncontrolled projects</label>
      <GlTokenSelector {...args} id="uncontrolled-token-selector" items={projects} />
    </div>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByRole("combobox", { name: "Uncontrolled projects" });
    input.focus();
    await userEvent.click(await canvas.findByRole("option", { name: "Runner" }));
    await expect(canvas.getByText("Runner")).toBeInTheDocument();
    await userEvent.click(
      within(canvas.getByText("Runner").closest(".gl-token") as HTMLElement)
        .getByRole("button", { name: "Remove" }),
    );
    await expect(canvas.queryByText("Runner")).not.toBeInTheDocument();
  },
};

function KeyboardExample() {
  return (
    <div style={{ maxWidth: 520 }}>
      <label htmlFor="keyboard-token-selector">Keyboard tokens</label>
      <ControlledSelector
        defaultValue={[
          { id: "alpha", name: "Alpha" },
          { id: "beta", name: "Beta" },
        ]}
        id="keyboard-token-selector"
        sourceItems={[
          { id: "gamma", name: "Gamma" },
          { id: "delta", name: "Delta" },
        ]} />
    </div>
  );
}

export const KeyboardNavigation: Story = {
  args: {
    defaultValue: [],
  },
  render: () => <KeyboardExample />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole("combobox", { name: "Keyboard tokens" });
    input.focus();
    await waitFor(() => expect(input).toHaveAttribute("aria-expanded", "true"));
    const gamma = await canvas.findByRole("option", { name: "Gamma" });
    const delta = canvas.getByRole("option", { name: "Delta" });
    await expect(input).toHaveAttribute("aria-activedescendant", gamma.id);

    await userEvent.keyboard("{End}");
    await expect(input).toHaveAttribute("aria-activedescendant", delta.id);
    await expect(delta).toHaveClass("gl-new-dropdown-item-highlighted");
    await expect(
      getComputedStyle(delta.querySelector(".gl-new-dropdown-item-content")!).boxShadow,
    ).not.toBe("none");
    await userEvent.keyboard("{ArrowDown}");
    await expect(input).toHaveAttribute("aria-activedescendant", delta.id);
    await userEvent.keyboard("{Home}");
    await expect(input).toHaveAttribute("aria-activedescendant", gamma.id);
    await userEvent.keyboard("{ArrowUp}");
    await expect(input).toHaveAttribute("aria-activedescendant", gamma.id);
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect(canvas.getByText("Delta")).toBeInTheDocument();
    await expect(input).toHaveFocus();

    await userEvent.keyboard("{Backspace}");
    let focusedToken = canvas.getByText("Delta").closest(".gl-token-selector-token-container");
    await waitFor(() => expect(focusedToken).toHaveFocus());
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByText("Alpha").closest(".gl-token-selector-token-container"))
      .toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}{Delete}");
    await expect(canvas.queryByText("Delta")).not.toBeInTheDocument();
    focusedToken = canvas.getByText("Beta").closest(".gl-token-selector-token-container");
    await waitFor(() => expect(focusedToken).toHaveFocus());
    await userEvent.keyboard("{Tab}");
    await expect(input).toHaveFocus();

    await userEvent.keyboard("x{Escape}");
    await expect(input).toHaveValue("");
    await expect(input).toHaveAttribute("aria-expanded", "false");
  },
};

export const UserDefinedTokens: Story = {
  args: {
    allowUserDefinedTokens: true,
    defaultValue: [],
  },
  render: (args) => (
    <div style={{ maxWidth: 520 }}>
      <label htmlFor="custom-token-selector">Custom projects</label>
      <GlTokenSelector
        {...args}
        id="custom-token-selector"
        items={[]}
        renderToken={(item) => <span>[{item.name}]</span>}
        renderUserDefinedToken={(inputValue) => <span>Add custom: [{inputValue}]</span>} />
    </div>
  ),
  play: async ({ args, canvas }) => {
    args.onTokenAdd!.mockClear();
    args.onValueChange!.mockClear();
    const input = canvas.getByRole("combobox", { name: "Custom projects" });
    await userEvent.type(input, "Custom project");
    const option = await canvas.findByRole("option", {
      name: "Add custom: [Custom project]",
    });
    await expect(input).toHaveAttribute("aria-activedescendant", option.id);
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByText("[Custom project]")).toBeVisible();
    await expect(args.onTokenAdd).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: "Custom project" }),
    );
    await expect(args.onValueChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ name: "Custom project" }),
    ]);
  },
};

export const AlwaysOfferUserDefinedToken: Story = {
  args: {
    allowUserDefinedTokens: true,
    defaultValue: [],
    showAddNewAlways: true,
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("combobox", { name: "Projects" });
    await userEvent.type(input, "git");
    await expect(await canvas.findByRole("option", { name: "GitLab" })).toBeVisible();
    const option = canvas.getByRole("option", { name: "Add \"git\"" });
    await expect(option).toBeVisible();
    await userEvent.click(option);
    await expect(canvas.getByText("git")).toBeInTheDocument();
  },
};

export const LoadingWithResults: Story = {
  args: {
    defaultValue: [],
    loading: true,
    loadingContent: "Searching projects...",
  },
  play: async ({ canvas }) => {
    canvas.getByRole("combobox", { name: "Projects" }).focus();
    await expect(await canvas.findByText("Searching projects...")).toBeVisible();
    await expect(canvas.getByRole("option", { name: "GitLab" })).toBeVisible();
  },
};

function AsyncResultsAfterBlurExample() {
  const [items, setItems] = useState<GlTokenSelectorItem[]>([]);

  return (
    <div style={{ maxWidth: 520 }}>
      <label htmlFor="async-token-selector">Async projects</label>
      <GlTokenSelector id="async-token-selector" items={items} />
      <GlButton onClick={() => setItems([{ id: "runner", name: "Runner" }])}>
        {items.length > 0 ? "Results loaded" : "Resolve search"}
      </GlButton>
    </div>
  );
}

export const AsyncResultsAfterBlur: Story = {
  args: {
    defaultValue: [],
  },
  render: () => <AsyncResultsAfterBlurExample />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole("combobox", { name: "Async projects" });
    await userEvent.type(input, "run");
    await expect(input).toHaveAttribute("aria-expanded", "true");

    input.blur();
    await waitFor(() => expect(input).toHaveAttribute("aria-expanded", "false"));
    await userEvent.click(canvas.getByRole("button", { name: "Resolve search" }));
    await expect(canvas.getByRole("button", { name: "Results loaded" })).toHaveFocus();
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByRole("listbox")).not.toBeInTheDocument();

    input.focus();
    await waitFor(() => expect(input).toHaveAttribute("aria-expanded", "true"));
    await expect(await canvas.findByRole("option", { name: "Runner" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Results loaded" }))
      .not.toHaveAttribute("aria-hidden");
  },
};

export const NoResults: Story = {
  args: {
    defaultValue: [],
    items: [],
    noResultsContent: "No projects found",
  },
  render: (args) => (
    <div style={{ maxWidth: 520 }}>
      <label htmlFor="empty-token-selector">Empty projects</label>
      <GlTokenSelector {...args} id="empty-token-selector" />
    </div>
  ),
  play: async ({ canvas }) => {
    canvas.getByRole("combobox", { name: "Empty projects" }).focus();
    const emptyOption = await canvas.findByRole("option", { name: "No projects found" });
    await expect(emptyOption).toBeVisible();
    await expect(emptyOption.parentElement).toHaveAttribute("role", "listbox");
  },
};

export const HiddenWithoutResults: Story = {
  args: {
    defaultValue: [],
    hideDropdownWithNoItems: true,
    items: [],
  },
  render: (args) => (
    <div style={{ maxWidth: 520 }}>
      <label htmlFor="hidden-empty-token-selector">Hidden empty projects</label>
      <GlTokenSelector {...args} id="hidden-empty-token-selector" />
    </div>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByRole("combobox", { name: "Hidden empty projects" });
    input.focus();
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByRole("listbox")).not.toBeInTheDocument();
  },
};

export const AvatarTokens: Story = {
  args: {
    defaultValue: [projects[0], projects[1]],
    renderToken: (item) => (
      <>
        <GlAvatar alt="" entityId={Number(item.id) || 2} entityName={item.name} size={16} />
        {item.name}
      </>
    ),
  },
};

export const PlaceholderAndFooter: Story = {
  args: {
    defaultValue: [],
    dropdownFooter: <div className="gl-new-dropdown-footer">Load more projects</div>,
    emptyPlaceholder: <span className="gl-text-subtle">No projects selected</span>,
  },
};

export const Invalid: Story = {
  args: {
    state: false,
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("combobox", { name: "Projects" });
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input.closest(".gl-token-selector")).toHaveClass("is-invalid");
  },
};

export const ViewOnly: Story = {
  args: {
    viewOnly: true,
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("combobox", { name: "Projects" });
    await expect(input).toBeDisabled();
    await expect(canvas.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Clear all" })).toBeEnabled();
  },
};
