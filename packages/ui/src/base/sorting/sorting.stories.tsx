import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { GlSorting, useSorting, type GlSortingOption, type GlSortingProps, type GlSortingSortBy } from "./index";

const sortOptions: readonly GlSortingOption[] = [
  { value: "created", text: "Created date" },
  { value: "updated", text: "Updated date" },
  { value: "relevant", text: "Most relevant", directionToggleDisabled: true },
];

const meta = {
  title: "UI/Base/Sorting",
  component: GlSorting,
  args: {
    sortOptions,
    defaultSortBy: "created",
    onSortByChange: fn(),
    onSortDirectionChange: fn(),
  },
  argTypes: {
    onSortByChange: { control: false },
    onSortDirectionChange: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Single-component React port of [Pajamas Sorting](https://design.gitlab.com/components/sorting/). "
          + "Use sortBy/isAscending with their callbacks, or defaultSortBy/defaultIsAscending for local state. "
          + "useSorting returns the current field and direction, setters, toggleSortDirection, selectedSortOption, "
          + "directionToggleDisabled, and sortingProps for <GlSorting {...sortingProps} />. "
          + "Data sorting, fetching, persistence, pagination resets, and result announcements belong to the caller. "
          + "Pajamas recommends at most ten options.",
      },
    },
  },
  decorators: [(Story) => <div style={{ minHeight: 260 }}><Story /></div>],
} satisfies Meta<typeof GlSorting>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Sort by: Created date" });

    await expect(trigger).toHaveClass("btn-block");

    const triggerRect = trigger.getBoundingClientRect();
    const triggerStyle = getComputedStyle(trigger);
    const textRect = trigger.querySelector(".gl-new-dropdown-button-text")!.getBoundingClientRect();
    const caretRect = trigger.querySelector(".gl-new-dropdown-chevron")!.getBoundingClientRect();

    await expect(Math.abs(textRect.left - triggerRect.left - parseFloat(triggerStyle.paddingLeft) - 1))
      .toBeLessThanOrEqual(1);
    await expect(Math.abs(triggerRect.right - caretRect.right - parseFloat(triggerStyle.paddingRight) - 1))
      .toBeLessThanOrEqual(1);

    trigger.focus();
    await userEvent.keyboard("{ArrowDown}");

    const listbox = await canvas.findByRole("listbox");
    const panel = listbox.closest(".gl-new-dropdown-panel")!;

    await waitFor(() => expect(Math.abs(panel.getBoundingClientRect().right - triggerRect.right))
      .toBeLessThanOrEqual(1));

    const created = within(listbox).getByRole("option", { name: "Created date" });

    await expect(created).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(created).toHaveFocus());

    await userEvent.keyboard("{ArrowDown}{Enter}");

    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(trigger).toHaveAccessibleName("Sort by: Updated date");
    await expect(args.onSortByChange).toHaveBeenCalledTimes(1);
    await expect(args.onSortByChange).toHaveBeenLastCalledWith("updated");

    await userEvent.keyboard("{ArrowDown}");
    await canvas.findByRole("listbox");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());

    await userEvent.click(canvas.getByRole("button", { name: "Sort direction: descending" }));
    const direction = canvas.getByRole("button", { name: "Sort direction: ascending" });

    await expect(direction.querySelector("[data-testid=\"sort-lowest-icon\"]")).not.toBeNull();
    await expect(args.onSortDirectionChange).toHaveBeenLastCalledWith(true);

    await userEvent.keyboard(" ");
    await expect(args.onSortDirectionChange).toHaveBeenLastCalledWith(false);
  },
};

function ControlledSorting(args: GlSortingProps) {
  const [sortBy, setSortBy] = useState<GlSortingSortBy>(args.sortBy ?? "created");
  const [isAscending, setIsAscending] = useState(args.isAscending ?? false);
  return (
    <GlSorting {...args} sortBy={sortBy} isAscending={isAscending}
      onSortByChange={(value) => { setSortBy(value); args.onSortByChange?.(value); }}
      onSortDirectionChange={(value) => { setIsAscending(value); args.onSortDirectionChange?.(value); }} />
  );
}

export const Controlled: Story = {
  render: (args) => <ControlledSorting {...args} />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Sort by: Created date" }));
    await userEvent.click(await canvas.findByRole("option", { name: "Updated date" }));

    await expect(canvas.getByRole("button", { name: "Sort by: Updated date" })).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Sort direction: descending" }));
    await expect(canvas.getByRole("button", { name: "Sort direction: ascending" })).toBeVisible();
  },
};

function HookSorting(args: GlSortingProps) {
  const { sortBy, isAscending, sortingProps } = useSorting(args);
  return (
    <>
      <GlSorting {...args} {...sortingProps} />
      <output aria-label="Current sorting">{sortBy}: {isAscending ? "ascending" : "descending"}</output>
    </>
  );
}

export const WithHook: Story = {
  parameters: {
    docs: {
      source: {
        code: `import { GlSorting, useSorting } from "gitlab-ui-react/sorting";

function SortingExample() {
  const { sortBy, isAscending, sortingProps } = useSorting({
    sortOptions: [
      { value: "created", text: "Created date" },
      { value: "updated", text: "Updated date" },
    ],
    defaultSortBy: "created",
    defaultIsAscending: false,
  });

  // Use sortBy and isAscending to sort or fetch the caller's data.
  return <GlSorting {...sortingProps} />;
}`,
      },
    },
  },
  render: (args) => <HookSorting {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Current sorting")).toHaveTextContent("created: descending");

    await userEvent.click(canvas.getByRole("button", { name: "Sort by: Created date" }));
    await userEvent.click(await canvas.findByRole("option", { name: "Updated date" }));
    await userEvent.click(canvas.getByRole("button", { name: "Sort direction: descending" }));

    await expect(canvas.getByLabelText("Current sorting")).toHaveTextContent("updated: ascending");
  },
};

export const DisabledDirectionToggle: Story = {
  args: { defaultSortBy: "relevant" },
  play: async ({ args, canvas }) => {
    const direction = canvas.getByRole("button", { name: "Sort direction unavailable for Most relevant" });

    await expect(direction).toHaveAttribute("aria-disabled", "true");
    await expect(direction).not.toHaveAttribute("disabled");

    canvas.getByRole("button", { name: "Sort by: Most relevant" }).focus();
    await userEvent.tab();

    await expect(direction).toHaveFocus();

    const tooltip = await within(document.body).findByRole("tooltip");

    await waitFor(() => expect(tooltip).toBeVisible());
    await expect(tooltip).toHaveTextContent("Sort direction unavailable for Most relevant");

    await userEvent.keyboard("{Enter} ");
    await userEvent.click(direction);

    await expect(args.onSortDirectionChange).not.toHaveBeenCalled();

    await userEvent.keyboard("{Escape}");
    await userEvent.click(canvas.getByRole("button", { name: "Sort by: Most relevant" }));
    await userEvent.click(await canvas.findByRole("option", { name: "Created date" }));

    const enabledDirection = canvas.getByRole("button", { name: "Sort direction: descending" });

    await expect(enabledDirection).toBe(direction);
    await expect(enabledDirection).not.toHaveAttribute("aria-disabled", "true");

    await userEvent.click(enabledDirection);

    await expect(args.onSortDirectionChange).toHaveBeenCalledTimes(1);
    await expect(args.onSortDirectionChange).toHaveBeenLastCalledWith(true);
  },
};

export const StateMatrix: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 24 }}>
      {[false, true].map((dark) => (
        <section key={String(dark)} className={dark ? "gl-dark-scope gl-bg-default gl-p-4" : "gl-light-scope gl-bg-default gl-p-4"}>
          <h3>{dark ? "Dark" : "Light"}</h3>
          <div style={{ display: "grid", gap: 12 }}>
            <GlSorting sortOptions={sortOptions} defaultSortBy="created" />
            <GlSorting sortOptions={sortOptions} defaultSortBy="updated" defaultIsAscending />
            <GlSorting sortOptions={sortOptions} defaultSortBy="relevant" />
            <GlSorting sortOptions={sortOptions} defaultSortBy="created" block={false} text="Sorting options" />
            <GlSorting sortOptions={[{ value: "long", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit" }]}
              defaultSortBy="long" />
          </div>
        </section>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const groups = canvas.getAllByRole("group");

    await expect(groups).toHaveLength(10);

    for(const group of groups) {
      await expect(getComputedStyle(group).display).toBe("flex");

      const buttons = within(group).getAllByRole("button");

      await expect(getComputedStyle(buttons[0]).borderTopRightRadius).toBe("0px");
      await expect(getComputedStyle(buttons[1]).borderTopLeftRadius).toBe("0px");
    }

    const light = within(groups[0]).getByRole("button", { name: "Sort by: Created date" });
    const dark = within(groups[5]).getByRole("button", { name: "Sort by: Created date" });

    await expect(getComputedStyle(light).backgroundColor).not.toBe(getComputedStyle(dark).backgroundColor);
  },
};
