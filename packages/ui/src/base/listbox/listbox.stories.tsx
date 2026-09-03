import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  forwardRef,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from "react";
import clsx from "clsx";
import {
  expect,
  fn,
  userEvent,
  waitFor,
  within,
} from "storybook/test";
import GlButton from "../button/button";
import GlListbox, {
  GlListboxContent,
  GlListboxItem,
  GlListboxTrigger,
  type GlListboxHandle,
  type GlListboxValue,
} from "./listbox";
import {
  GlListboxGroup,
  GlListboxGroupLabel,
} from "./listbox-group";
import GlListboxSearchInput from "./listbox-search-input";

const meta = {
  title: "UI/Base/Listbox",
  component: GlListbox,
  argTypes: {
    children: { control: false },
    onBeforeClose: { control: false },
    onHidden: { control: false },
    onOpenChange: { control: false },
    onShown: { control: false },
    onValueChange: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: "Composition-first React port of the Pajamas collapsible listbox. Base UI Menu powers positioning and focus while the public DOM retains combobox/listbox/option semantics.",
      },
    },
  },
} satisfies Meta<typeof GlListbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <GlListbox defaultValue="backend">
      <GlListboxTrigger>Select department</GlListboxTrigger>
      <GlListboxContent>
        <GlListboxItem value="frontend">Frontend</GlListboxItem>
        <GlListboxItem value="backend">Backend</GlListboxItem>
        <GlListboxItem disabled value="security">Security</GlListboxItem>
      </GlListboxContent>
    </GlListbox>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Select department" });
    await expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    await userEvent.click(trigger);

    const listbox = await canvas.findByRole("listbox");
    const options = within(listbox).getAllByRole("option");
    await expect(options).toHaveLength(3);
    await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("menuitemradio")).not.toBeInTheDocument();
    const selectedOption = within(listbox).getByRole("option", { name: "Backend" });
    await expect(selectedOption).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(selectedOption).toHaveFocus());
    await expect(within(listbox).getByRole("option", { name: "Security" }))
      .toHaveAttribute("aria-disabled", "true");

    await userEvent.click(within(listbox).getByRole("option", { name: "Frontend" }));
    await waitFor(() => expect(trigger).not.toHaveAttribute("aria-expanded", "true"));
    await expect(trigger).toHaveFocus();
  },
};

function MultipleExample() {
  const [value, setValue] = useState<GlListboxValue[]>(["frontend"]);
  return (
    <GlListbox multiple value={value} onValueChange={setValue}>
      <GlListboxTrigger>Choose departments</GlListboxTrigger>
      <GlListboxContent>
        <GlListboxItem value="frontend">Frontend</GlListboxItem>
        <GlListboxItem value="backend">Backend</GlListboxItem>
        <GlListboxItem value="security">Security</GlListboxItem>
      </GlListboxContent>
    </GlListbox>
  );
}

export const MultipleSelection: Story = {
  render: () => <MultipleExample />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Choose departments" });
    await userEvent.click(trigger);
    const backend = await canvas.findByRole("option", { name: "Backend" });

    await userEvent.click(backend);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(backend).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("listbox")).toHaveAttribute("aria-multiselectable", "true");

    await userEvent.click(backend);
    await expect(backend).toHaveAttribute("aria-selected", "false");
  },
};

export const KeyboardNavigation: Story = {
  render: () => (
    <GlListbox>
      <GlListboxTrigger>Keyboard selection</GlListboxTrigger>
      <GlListboxContent>
        <GlListboxItem value="alpha">Alpha</GlListboxItem>
        <GlListboxItem disabled value="beta">Beta</GlListboxItem>
        <GlListboxItem value="gamma">Gamma</GlListboxItem>
      </GlListboxContent>
    </GlListbox>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Keyboard selection" });
    trigger.focus();
    await userEvent.keyboard("{ArrowDown}");
    const alpha = await canvas.findByRole("option", { name: "Alpha" });
    const gamma = canvas.getByRole("option", { name: "Gamma" });
    await waitFor(() => expect(alpha).toHaveFocus());

    await userEvent.hover(gamma);
    await expect(alpha).toHaveFocus();
    await expect(gamma).not.toHaveAttribute("data-highlighted");

    await userEvent.keyboard("{ArrowUp}");
    await expect(gamma).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(alpha).toHaveFocus();
    await userEvent.keyboard("{End}");
    await expect(gamma).toHaveFocus();
    await userEvent.keyboard("{Home}");
    await expect(alpha).toHaveFocus();
    await userEvent.keyboard("g");
    await expect(gamma).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

const departments = [
  { label: "Frontend", value: "frontend" },
  { label: "Backend", value: "backend" },
  { label: "Developer experience", value: "devex" },
  { label: "Security", value: "security" },
];

function SearchableExample() {
  const [query, setQuery] = useState("");
  const filtered = departments.filter((item) => (
    item.label.toLocaleLowerCase().includes(query.toLocaleLowerCase())
  ));
  return (
    <GlListbox>
      <GlListboxTrigger>Search departments</GlListboxTrigger>
      <GlListboxContent
        noResultsText="No matching departments"
        resultsAnnouncement={(count) => `${count} matching departments`}
        search={(
          <GlListboxSearchInput
            onValueChange={setQuery}
            placeholder="Find department"
            value={query} />
        )}>
        {filtered.map((item) => (
          <GlListboxItem key={item.value} value={item.value}>{item.label}</GlListboxItem>
        ))}
      </GlListboxContent>
    </GlListbox>
  );
}

export const Searchable: Story = {
  render: () => <SearchableExample />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Search departments" });
    await userEvent.click(trigger);
    const search = await canvas.findByRole("combobox", { name: "Find department" });
    await waitFor(() => expect(search).toHaveFocus());

    const security = canvas.getByRole("option", { name: "Security" });
    await userEvent.hover(security);
    await expect(search).toHaveFocus();
    await expect(security).not.toHaveAttribute("data-highlighted");
    await expect(security).not.toHaveClass("gl-new-dropdown-item-highlighted");

    await userEvent.type(search, "e");
    await waitFor(() => expect(canvas.getAllByRole("option")).toHaveLength(4));
    await waitFor(() => expect(search).toHaveAttribute("aria-activedescendant"));
    const firstActiveId = search.getAttribute("aria-activedescendant");
    await userEvent.keyboard("{ArrowDown}");
    await expect(search).toHaveFocus();
    await expect(search.getAttribute("aria-activedescendant")).not.toBe(firstActiveId);
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(trigger).not.toHaveAttribute("aria-expanded", "true"));

    await userEvent.click(trigger);
    const reopenedSearch = await canvas.findByRole("combobox", { name: "Find department" });
    await userEvent.clear(reopenedSearch);
    await userEvent.type(reopenedSearch, "zzz");
    await expect(await canvas.findByText("No matching departments")).toBeVisible();
  },
};

function SearchableWithHeaderExample() {
  const [query, setQuery] = useState("");
  const filtered = departments.filter((item) => (
    item.label.toLocaleLowerCase().includes(query.toLocaleLowerCase())
  ));
  return (
    <GlListbox>
      <GlListboxTrigger>Search departments with header</GlListboxTrigger>
      <GlListboxContent
        header={<span>Assign to department</span>}
        noResultsText="No matching departments"
        resultsAnnouncement={(count) => `${count} matching departments`}
        search={(
          <GlListboxSearchInput
            id="department-search-input"
            onValueChange={setQuery}
            placeholder="Find department"
            value={query} />
        )}>
        {filtered.map((item) => (
          <GlListboxItem key={item.value} value={item.value}>{item.label}</GlListboxItem>
        ))}
      </GlListboxContent>
    </GlListbox>
  );
}

export const SearchableWithHeader: Story = {
  render: () => <SearchableWithHeaderExample />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Search departments with header" });
    await userEvent.click(trigger);

    const header = await canvas.findByText("Assign to department");
    const headerContent = header.parentElement;
    const headerRegion = headerContent?.parentElement;
    const search = await canvas.findByRole("combobox", { name: "Find department" });
    const listbox = canvas.getByRole("listbox");
    await expect(headerContent).toHaveClass("gl-new-dropdown-header-content");
    await expect(headerRegion).toHaveClass("gl-new-dropdown-header");
    await expect(headerRegion?.nextElementSibling).toHaveClass("gl-listbox-search-container");
    await expect(search).toHaveAttribute("id", "department-search-input");
    await waitFor(() => expect(listbox).toHaveAttribute("aria-labelledby", search.id));
    await waitFor(() => expect(search).toHaveFocus());
    await userEvent.click(search);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.type(search, "back");
    await waitFor(() => expect(canvas.getAllByRole("option")).toHaveLength(1));
    await expect(canvas.getByRole("option", { name: "Backend" })).toBeVisible();
  },
};

function GroupsExample() {
  const [value, setValue] = useState<GlListboxValue[]>([]);
  return (
    <GlListbox multiple value={value} onValueChange={setValue}>
      <GlListboxTrigger>Grouped projects</GlListboxTrigger>
      <GlListboxContent
        footer={<span>Custom footer</span>}
        header={<span>Custom header</span>}>
        <GlListboxGroup>
          <GlListboxGroupLabel>GitLab</GlListboxGroupLabel>
          <GlListboxItem value="gitlab-org">GitLab.org</GlListboxItem>
          <GlListboxItem value="gitlab-com">GitLab.com</GlListboxItem>
        </GlListboxGroup>
        <GlListboxGroup>
          <GlListboxGroupLabel textSrOnly>Personal projects</GlListboxGroupLabel>
          <GlListboxItem value="personal">Personal project</GlListboxItem>
        </GlListboxGroup>
      </GlListboxContent>
    </GlListbox>
  );
}

export const GroupsAndCustomRegions: Story = {
  render: () => <GroupsExample />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Grouped projects" }));
    const groups = await canvas.findAllByRole("group");
    await expect(groups).toHaveLength(2);
    const label = canvas.getByText("GitLab");
    await expect(label).toHaveAttribute("id");
    await expect(groups[0]).toHaveAttribute("aria-labelledby", label.id);
    await expect(canvas.getByText("Personal projects")).toHaveClass("gl-sr-only");
    const header = canvas.getByText("Custom header");
    const footer = canvas.getByText("Custom footer");
    await expect(header).toBeVisible();
    await expect(header.parentElement).toHaveClass("gl-new-dropdown-header-content");
    await expect(header.parentElement?.parentElement).toHaveClass("gl-new-dropdown-header");
    await expect(footer).toBeVisible();
    await expect(footer.parentElement).toHaveClass("gl-new-dropdown-footer");
  },
};

const CustomTrigger = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<"button">
>(function CustomTrigger(props, ref) {
  return (
    <button
      {...props}
      ref={ref}
      className={clsx("custom-listbox-trigger", props.className)} />
  );
});

export const CustomRenderAndValidation: Story = {
  render: () => (
    <GlListbox state={false}>
      <GlListboxTrigger render={<CustomTrigger />}>
        Custom trigger
      </GlListboxTrigger>
      <GlListboxContent panelMatchTriggerWidth>
        <GlListboxItem
          nativeButton
          render={(props) => <button {...props} data-custom-item type="button" />}
          value={null}>
          No selection
        </GlListboxItem>
      </GlListboxContent>
    </GlListbox>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Custom trigger" });
    await expect(trigger).toHaveClass("custom-listbox-trigger", "is-invalid");
    await expect(trigger).toHaveAttribute("aria-invalid", "true");
    await userEvent.click(trigger);
    const option = await canvas.findByRole("option", { name: "No selection" });
    await expect(option).toHaveAttribute("data-custom-item");
    await expect(canvas.getByRole("listbox").closest(".gl-new-dropdown-panel"))
      .toHaveClass("gl-new-dropdown-panel-match-trigger-width");
  },
};

function ImperativeExample() {
  const ref = useRef<GlListboxHandle>(null);
  return (
    <div>
      <GlButton onClick={() => ref.current?.open()}>Open listbox</GlButton>
      <GlButton onClick={() => ref.current?.close()}>Close listbox</GlButton>
      <GlButton onClick={() => ref.current?.closeAndFocus()}>Close and focus</GlButton>
      <GlListbox ref={ref}>
        <GlListboxTrigger>Imperative selection</GlListboxTrigger>
        <GlListboxContent>
          <GlListboxItem value="one">One</GlListboxItem>
        </GlListboxContent>
      </GlListbox>
    </div>
  );
}

export const ImperativeActions: Story = {
  render: () => <ImperativeExample />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Imperative selection" });
    await userEvent.click(canvas.getByRole("button", { name: "Open listbox" }));
    await expect(await canvas.findByRole("listbox")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Close listbox" }));
    await expect(trigger).not.toHaveAttribute("aria-expanded", "true");

    await userEvent.click(canvas.getByRole("button", { name: "Open listbox" }));
    await userEvent.click(canvas.getByRole("button", { name: "Close and focus" }));
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

const placementLayout: CSSProperties = {
  alignItems: "flex-start",
  display: "flex",
  flexWrap: "wrap",
  gap: "1rem",
};

export const PlacementsWidthsAndLoading: Story = {
  render: () => (
    <div style={placementLayout}>
      <GlListbox defaultOpen>
        <GlListboxTrigger>Fluid</GlListboxTrigger>
        <GlListboxContent fluidWidth placement="bottom-end">
          <GlListboxItem value="fluid">A fluid-width option with a longer label</GlListboxItem>
        </GlListboxContent>
      </GlListbox>
      <GlListbox defaultOpen>
        <GlListboxTrigger>Match trigger width</GlListboxTrigger>
        <GlListboxContent panelMatchTriggerWidth positioningStrategy="fixed">
          <GlListboxItem value="matched">Matched</GlListboxItem>
        </GlListboxContent>
      </GlListbox>
      <GlListbox defaultOpen>
        <GlListboxTrigger>Searching</GlListboxTrigger>
        <GlListboxContent
          search={<GlListboxSearchInput />}
          searching
          searchingAnnouncement="Searching departments">
          <GlListboxItem value="hidden">Hidden during search</GlListboxItem>
        </GlListboxContent>
      </GlListbox>
    </div>
  ),
};

const bottomReached = fn();

export const InfiniteScroll: Story = {
  render: () => (
    <GlListbox defaultOpen>
      <GlListboxTrigger>Many departments</GlListboxTrigger>
      <GlListboxContent
        infiniteScrollLoading
        loadingMoreAnnouncement="Loading the next departments"
        onBottomReached={bottomReached}
        totalItems={100}>
        {Array.from({ length: 20 }, (_, index) => (
          <GlListboxItem key={index} value={index}>
            Department {String(index + 1).padStart(2, "0")}
          </GlListboxItem>
        ))}
      </GlListboxContent>
    </GlListbox>
  ),
};
