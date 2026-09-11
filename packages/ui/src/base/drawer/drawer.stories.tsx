import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, fn, userEvent, waitFor, within } from "storybook/test";
import GlButton from "../button/button";
import GlDrawer, {
  GlDrawerActions,
  GlDrawerContent,
  GlDrawerFooter,
  GlDrawerHeader,
  GlDrawerTitle,
  GlDrawerTrigger,
  type GlDrawerContentProps,
  type GlDrawerProps,
} from "./drawer";

const loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

type DrawerExampleProps = {
  actions?: boolean;
  bodySections?: number;
  contentProps?: GlDrawerContentProps;
  footer?: boolean;
  rootProps: GlDrawerProps;
  stickyHeader?: boolean;
  title?: string;
};

function DrawerExample({
  actions = false,
  bodySections = 1,
  contentProps,
  footer = false,
  rootProps,
  stickyHeader = false,
  title = "Example title",
}: DrawerExampleProps) {
  return (
    <div className="gl-p-5">
      <GlButton className="gl-mr-2">Outside action</GlButton>
      <GlDrawer {...rootProps}>
        <GlDrawerTrigger>Open drawer</GlDrawerTrigger>
        <GlDrawerContent {...contentProps}>
          <GlDrawerHeader sticky={stickyHeader}>
            <GlDrawerTitle>{title}</GlDrawerTitle>
            {actions ? (
              <GlDrawerActions aria-label="Drawer actions">
                <GlButton category="primary" variant="confirm">Save</GlButton>
                <GlButton>Cancel</GlButton>
              </GlDrawerActions>
            ) : null}
          </GlDrawerHeader>
          {Array.from({ length: bodySections }, (_, index) => (
            <section key={index}>
              <h3 className="gl-heading-scale-300">Section {index + 1}</h3>
              <p>{loremIpsum}</p>
              {index === 0 ? <GlButton>Body action</GlButton> : null}
            </section>
          ))}
          {footer ? <GlDrawerFooter>Drawer footer</GlDrawerFooter> : null}
        </GlDrawerContent>
      </GlDrawer>
    </div>
  );
}

const meta = {
  title: "UI/Base/Drawer",
  component: GlDrawer,
  args: {
    defaultOpen: false,
    onOpened: fn(),
    onOpenChange: fn(),
  },
  argTypes: {
    children: { control: false },
    onOpened: { control: false },
    onOpenChange: { control: false },
    open: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas drawer documentation](https://design.gitlab.com/components/drawer) for usage guidance.",
      },
    },
    layout: "fullscreen",
  },
} satisfies Meta<typeof GlDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

async function expectDesktopWidthWithContainerQueries(
  dialog: HTMLElement,
  expectedWidth: string,
) {
  const root = document.documentElement;
  const wasEnabled = root.classList.contains("with-gl-container-queries");
  root.classList.add("with-gl-container-queries");

  try {
    await waitFor(() => expect(getComputedStyle(dialog).width).toBe(expectedWidth));
  } finally {
    if(!wasEnabled) root.classList.remove("with-gl-container-queries");
  }
}

export const Default: Story = {
  render: (args) => <DrawerExample rootProps={args} />,
  play: async ({ args, canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Open drawer" });
    const outsideAction = canvas.getByRole("button", { name: "Outside action" });

    await userEvent.click(trigger);

    const body = within(document.body);
    const dialog = await body.findByRole("dialog");
    const drawer = within(dialog);
    const title = drawer.getByRole("heading", { level: 2, name: "Example title" });
    const closeButton = drawer.getByRole("button", { name: "Close drawer" });
    const bodyAction = drawer.getByRole("button", { name: "Body action" });

    await expect(dialog.tagName).toBe("ASIDE");
    await expect(dialog).toHaveClass("gl-drawer", "gl-drawer-default");
    await expectDesktopWidthWithContainerQueries(dialog, "400px");
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(dialog).toHaveAttribute("aria-labelledby", title.id);
    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await waitFor(() => expect(args.onOpened).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(closeButton).toHaveFocus());

    await userEvent.tab();
    await expect(bodyAction).toHaveFocus();
    await userEvent.tab();
    await waitFor(() => expect(closeButton).toHaveFocus());

    fireEvent.pointerDown(outsideAction);
    fireEvent.mouseDown(outsideAction);
    await expect(body.queryByRole("dialog")).toBeInTheDocument();

    await userEvent.click(closeButton);
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    await expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    await body.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    await expect(trigger).toHaveFocus();
  },
};

export const WithActions: Story = {
  args: {
    defaultOpen: true,
  },
  render: (args) => (
    <DrawerExample
      actions
      rootProps={args}
      title="Custom network policy" />
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");
    const drawer = within(dialog);

    await expect(drawer.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Custom network policy",
    );
    await expect(drawer.getByLabelText("Drawer actions")).toHaveClass(
      "gl-drawer-actions",
    );
    await expect(drawer.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(drawer.getByRole("button", { name: "Cancel" })).toBeVisible();
  },
};

export const StickyHeaderAndFooter: Story = {
  args: {
    defaultOpen: true,
  },
  render: (args) => (
    <DrawerExample
      bodySections={4}
      footer
      rootProps={args}
      stickyHeader />
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");
    const header = dialog.querySelector(".gl-drawer-header");
    const drawerBody = dialog.querySelector(".gl-drawer-body");
    const footer = dialog.querySelector(".gl-drawer-footer");

    await expect(header).toHaveClass("gl-drawer-header-sticky");
    await expect(header).toHaveStyle({ zIndex: "10" });
    await expect(drawerBody).toHaveClass("gl-drawer-body-shrink");
    await expect(drawerBody).not.toHaveClass("gl-drawer-body-scrim");
    await expect(footer).toHaveClass(
      "gl-drawer-footer-sticky",
      "gl-drawer-body-scrim-on-footer",
    );
    await expect(footer).toHaveStyle({ zIndex: "10" });
  },
};

export const LongScrollableContent: Story = {
  args: {
    defaultOpen: true,
  },
  render: (args) => <DrawerExample bodySections={6} rootProps={args} stickyHeader />,
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");

    await expect(dialog.querySelector(".gl-drawer-body")).toHaveClass(
      "gl-drawer-body-shrink",
      "gl-drawer-body-scrim",
    );
    await expect(dialog.querySelector(".gl-drawer-footer")).not.toBeInTheDocument();
  },
};

export const Sidebar: Story = {
  args: {
    defaultOpen: true,
  },
  render: (args) => (
    <DrawerExample
      bodySections={3}
      contentProps={{ variant: "sidebar" }}
      rootProps={args}
      title="Sidebar" />
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");

    await expect(dialog).toHaveClass("gl-drawer-sidebar");
    await expectDesktopWidthWithContainerQueries(dialog, "290px");
  },
};

export const HeaderOffset: Story = {
  args: {
    defaultOpen: true,
  },
  render: (args) => (
    <div className="gl-p-5">
      <GlDrawer {...args}>
        <GlDrawerTrigger asChild>
          <GlButton>Open offset drawer</GlButton>
        </GlDrawerTrigger>
        <GlDrawerContent
          headerHeight="64px"
          zIndex={20}>
          <GlDrawerHeader>
            <GlDrawerTitle>Offset drawer</GlDrawerTitle>
          </GlDrawerHeader>
          <div>Drawer content below a fixed page header</div>
        </GlDrawerContent>
      </GlDrawer>
    </div>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog", { name: "Offset drawer" });

    await expect(dialog.style.maxHeight).toContain("64px");
    await expect(dialog.style.top).toBe("64px");
    await expect(dialog.style.zIndex).toBe("20");
    await expect(within(dialog).getByRole("button", { name: "Close drawer" }))
      .toBeInTheDocument();
  },
};

export const WithoutTitle: Story = {
  args: {
    defaultOpen: true,
  },
  render: (args) => (
    <div className="gl-p-5">
      <GlDrawer {...args}>
        <GlDrawerTrigger asChild>
          <GlButton>Open drawer without a title</GlButton>
        </GlDrawerTrigger>
        <GlDrawerContent aria-label="Drawer without a title">
          <GlDrawerHeader />
          <div>Drawer content without a title</div>
        </GlDrawerContent>
      </GlDrawer>
    </div>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog", {
      name: "Drawer without a title",
    });
    const bounds = dialog.getBoundingClientRect();

    await expect(bounds.top).toBe(0);
    await expect(bounds.bottom).toBe(window.innerHeight);
    await expect(bounds.height).toBe(window.innerHeight);
    await expect(within(dialog).queryByRole("heading")).not.toBeInTheDocument();
    await expect(within(dialog).getByRole("button", { name: "Close drawer" }))
      .toBeInTheDocument();
  },
};
