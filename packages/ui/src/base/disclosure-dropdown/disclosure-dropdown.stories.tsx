import type {
  GlDropdownBeforeCloseDetails,
  GlDropdownHandle,
} from "../../internal/dropdown/dropdown-types";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  forwardRef,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from "react";
import {
  expect,
  fireEvent,
  fn,
  userEvent,
  waitFor,
  within,
} from "storybook/test";
import GlButton from "../button/button";
import GlButtonGroup from "../button-group/button-group";
import GlDisclosureDropdown, {
  GlDisclosureDropdownContent,
  GlDisclosureDropdownFooter,
  GlDisclosureDropdownHeader,
  GlDisclosureDropdownItem,
  GlDisclosureDropdownTrigger,
  type GlDisclosureDropdownActionDetails,
} from "./disclosure-dropdown";
import {
  GlDisclosureDropdownGroup,
  GlDisclosureDropdownGroupLabel,
} from "./disclosure-dropdown-group";

const storyLayout: CSSProperties = {
  alignItems: "flex-start",
  display: "flex",
  flexWrap: "wrap",
  gap: "1rem",
};

const meta = {
  title: "UI/Base/Disclosure Dropdown",
  component: GlDisclosureDropdown,
  args: {
    autoClose: true,
  },
  argTypes: {
    children: { control: false },
    onAction: { control: false },
    onBeforeClose: { control: false },
    onHidden: { control: false },
    onOpenChange: { control: false },
    onShown: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component: "Composition-first React port of the [Pajamas disclosure dropdown](https://design.gitlab.com/components/dropdown-disclosure/), backed by Base UI Menu semantics.",
      },
    },
  },
} satisfies Meta<typeof GlDisclosureDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <GlDisclosureDropdown {...args}>
      <GlDisclosureDropdownTrigger>Actions</GlDisclosureDropdownTrigger>
      <GlDisclosureDropdownContent>
        <GlDisclosureDropdownGroup>
          <GlDisclosureDropdownItem icon="pencil" value="edit">Edit project</GlDisclosureDropdownItem>
          <GlDisclosureDropdownItem disabled value="archive">Archive project</GlDisclosureDropdownItem>
        </GlDisclosureDropdownGroup>
        <GlDisclosureDropdownGroup bordered>
          <GlDisclosureDropdownGroupLabel>Danger zone</GlDisclosureDropdownGroupLabel>
          <GlDisclosureDropdownItem value="delete" variant="danger">
            Delete project
          </GlDisclosureDropdownItem>
        </GlDisclosureDropdownGroup>
      </GlDisclosureDropdownContent>
    </GlDisclosureDropdown>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Actions" });

    await expect(trigger).not.toHaveAttribute("aria-expanded", "true");
    await userEvent.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
    await expect(await canvas.findByRole("menu")).toBeVisible();
    await expect(canvas.getAllByRole("menuitem")).toHaveLength(3);
    const editItem = canvas.getByRole("menuitem", { name: "Edit project" });
    await expect(editItem).toHaveClass("gl-new-dropdown-item");
    await expect(editItem).not.toHaveClass("gl-new-dropdown-item-content");
    await expect(editItem.firstElementChild).toHaveClass("gl-new-dropdown-item-content");
    await expect(canvas.getByRole("menuitem", { name: "Archive project" }))
      .toHaveAttribute("data-disabled");
  },
};

const keyboardOpenChange = fn();

export const KeyboardNavigation: Story = {
  render: (args) => (
    <GlDisclosureDropdown {...args} onOpenChange={keyboardOpenChange}>
      <GlDisclosureDropdownTrigger>Navigate actions</GlDisclosureDropdownTrigger>
      <GlDisclosureDropdownContent>
        <GlDisclosureDropdownGroup>
          <GlDisclosureDropdownItem value="add">Add member</GlDisclosureDropdownItem>
          <GlDisclosureDropdownItem disabled value="archive">Archive</GlDisclosureDropdownItem>
          <GlDisclosureDropdownItem hidden value="hidden-native">
            Hidden native action
          </GlDisclosureDropdownItem>
          <GlDisclosureDropdownItem style={{ display: "none" }} value="hidden-css">
            CSS-hidden action
          </GlDisclosureDropdownItem>
          <GlDisclosureDropdownItem value="clone">Clone project</GlDisclosureDropdownItem>
          <GlDisclosureDropdownItem value="rename">Rename project</GlDisclosureDropdownItem>
        </GlDisclosureDropdownGroup>
      </GlDisclosureDropdownContent>
    </GlDisclosureDropdown>
  ),
  play: async ({ canvas }) => {
    keyboardOpenChange.mockClear();
    const trigger = canvas.getByRole("button", { name: "Navigate actions" });
    trigger.focus();

    await userEvent.keyboard("{ArrowDown}");
    await expect(keyboardOpenChange).toHaveBeenLastCalledWith(true, expect.objectContaining({
      reason: "trigger",
    }));
    const add = await canvas.findByRole("menuitem", { name: "Add member" });
    const clone = canvas.getByRole("menuitem", { name: "Clone project" });
    const rename = canvas.getByRole("menuitem", { name: "Rename project" });
    await expect(add).toHaveFocus();

    await userEvent.keyboard("{ArrowDown}");
    await expect(clone).toHaveFocus();
    await userEvent.keyboard("{End}{ArrowDown}");
    await expect(rename).toHaveFocus();
    await userEvent.keyboard("{Home}");
    await expect(add).toHaveFocus();
    await userEvent.keyboard("r");
    await expect(rename).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(trigger).not.toHaveAttribute("aria-expanded", "true");

    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    await userEvent.keyboard(" ");
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
  },
};

const canceledItemAction = fn();
const canceledRootAction = fn();

export const BaseUIStateSynchronization: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "1rem", justifyItems: "start" }}>
      <GlDisclosureDropdown onAction={canceledRootAction}>
        <GlDisclosureDropdownTrigger
          onKeyDown={(event) => {
            if(event.key === "ArrowDown") event.preventDefault();
          }}>
          Cancellable disclosure keyboard
        </GlDisclosureDropdownTrigger>
        <GlDisclosureDropdownContent
          onKeyDown={(event) => {
            if(event.key === "ArrowDown") event.preventDefault();
          }}>
          <GlDisclosureDropdownGroup>
            <GlDisclosureDropdownItem value="first">First action</GlDisclosureDropdownItem>
            <GlDisclosureDropdownItem
              onAction={canceledItemAction}
              onClick={(event) => event.preventDefault()}
              value="canceled">
              Canceled action
            </GlDisclosureDropdownItem>
          </GlDisclosureDropdownGroup>
        </GlDisclosureDropdownContent>
      </GlDisclosureDropdown>

      <GlDisclosureDropdown defaultOpen>
        <GlDisclosureDropdownTrigger id="default-open-disclosure-trigger">
          Default-open custom disclosure trigger
        </GlDisclosureDropdownTrigger>
        <GlDisclosureDropdownContent>
          <GlDisclosureDropdownGroup>
            <GlDisclosureDropdownItem value="open">Open</GlDisclosureDropdownItem>
          </GlDisclosureDropdownGroup>
        </GlDisclosureDropdownContent>
      </GlDisclosureDropdown>
    </div>
  ),
  play: async ({ canvas }) => {
    canceledItemAction.mockClear();
    canceledRootAction.mockClear();
    const defaultOpenTrigger = canvas.getByRole("button", {
      name: "Default-open custom disclosure trigger",
    });
    await waitFor(() => expect(defaultOpenTrigger).toHaveAttribute("aria-expanded", "true"));

    const cancellableTrigger = canvas.getByRole("button", {
      name: "Cancellable disclosure keyboard",
    });
    cancellableTrigger.focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(cancellableTrigger).not.toHaveAttribute("aria-expanded", "true");

    await userEvent.click(cancellableTrigger);
    const first = await canvas.findByRole("menuitem", { name: "First action" });
    first.focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(first).toHaveFocus();

    await userEvent.click(canvas.getByRole("menuitem", { name: "Canceled action" }));
    await expect(cancellableTrigger).toHaveAttribute("aria-expanded", "true");
    await expect(canceledItemAction).not.toHaveBeenCalled();
    await expect(canceledRootAction).not.toHaveBeenCalled();
  },
};

const itemAction = fn();
let rootActionCurrentTarget: EventTarget | null = null;
const rootAction = fn((details: GlDisclosureDropdownActionDetails) => {
  rootActionCurrentTarget = details.event.currentTarget;
});

export const ActionsAndAutoClose: Story = {
  args: {
    onAction: rootAction,
  },
  render: (args) => (
    <GlDisclosureDropdown {...args}>
      <GlDisclosureDropdownTrigger>Action order</GlDisclosureDropdownTrigger>
      <GlDisclosureDropdownContent>
        <GlDisclosureDropdownGroup>
          <GlDisclosureDropdownItem
            closeOnClick={false}
            onAction={itemAction}
            value="keep-open">
            Keep open
          </GlDisclosureDropdownItem>
          <GlDisclosureDropdownItem onAction={itemAction} value="close">
            Close normally
          </GlDisclosureDropdownItem>
        </GlDisclosureDropdownGroup>
      </GlDisclosureDropdownContent>
    </GlDisclosureDropdown>
  ),
  play: async ({ args, canvas }) => {
    itemAction.mockClear();
    rootAction.mockClear();
    rootActionCurrentTarget = null;
    const trigger = canvas.getByRole("button", { name: "Action order" });
    await userEvent.click(trigger);
    const keepOpenItem = await canvas.findByRole("menuitem", { name: "Keep open" });
    await userEvent.click(keepOpenItem);

    await expect(itemAction).toHaveBeenCalledOnce();
    await waitFor(() => expect(args.onAction).toHaveBeenCalledOnce());
    await expect(rootActionCurrentTarget).toBe(keepOpenItem);
    await expect(itemAction.mock.invocationCallOrder[0])
      .toBeLessThan((args.onAction as any).mock.invocationCallOrder[0]!);
    await expect(args.onAction).toHaveBeenLastCalledWith(expect.objectContaining({
      value: "keep-open",
    }));
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(canvas.getByRole("menuitem", { name: "Close normally" }));
    await expect(trigger).not.toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(trigger).toHaveFocus());
    await waitFor(() => expect(args.onAction).toHaveBeenCalledTimes(2));
  },
};

const beforeClose = fn((details: GlDropdownBeforeCloseDetails) => {
  if(beforeClose.mock.calls.length === 1) details.preventDefault();
});

export const CancellableCloseLifecycle: Story = {
  args: {
    onBeforeClose: beforeClose,
    onHidden: fn(),
    onShown: fn(),
  },
  render: (args) => (
    <GlDisclosureDropdown {...args}>
      <GlDisclosureDropdownTrigger>Lifecycle actions</GlDisclosureDropdownTrigger>
      <GlDisclosureDropdownContent>
        <GlDisclosureDropdownGroup>
          <GlDisclosureDropdownItem value="save">Save changes</GlDisclosureDropdownItem>
        </GlDisclosureDropdownGroup>
      </GlDisclosureDropdownContent>
    </GlDisclosureDropdown>
  ),
  play: async ({ args, canvas }) => {
    beforeClose.mockClear();
    const trigger = canvas.getByRole("button", { name: "Lifecycle actions" });
    await userEvent.click(trigger);
    await waitFor(() => expect(args.onShown).toHaveBeenCalledOnce());

    await userEvent.click(canvas.getByRole("menuitem", { name: "Save changes" }));
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(beforeClose.mock.calls[0]?.[0].reason).toBe("item");

    await userEvent.keyboard("{Escape}");
    await expect(beforeClose.mock.calls[1]?.[0].reason).toBe("escape");
    await waitFor(() => expect(trigger).toHaveFocus());
    await waitFor(() => expect(args.onHidden).toHaveBeenCalledOnce());
  },
};

const outsideClose = fn();

export const OutsideAndFocusOut: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem" }}>
      <GlDisclosureDropdown onBeforeClose={outsideClose}>
        <GlDisclosureDropdownTrigger>Dismissal actions</GlDisclosureDropdownTrigger>
        <GlDisclosureDropdownContent>
          <GlDisclosureDropdownGroup>
            <GlDisclosureDropdownItem value="first">First action</GlDisclosureDropdownItem>
            <GlDisclosureDropdownItem value="last">Last action</GlDisclosureDropdownItem>
          </GlDisclosureDropdownGroup>
        </GlDisclosureDropdownContent>
      </GlDisclosureDropdown>
      <GlButton>Outside target</GlButton>
    </div>
  ),
  play: async ({ canvas }) => {
    outsideClose.mockClear();
    const trigger = canvas.getByRole("button", { name: "Dismissal actions" });
    const outside = canvas.getByRole("button", { name: "Outside target" });

    await userEvent.click(trigger);
    await canvas.findByRole("menu");
    await userEvent.click(outside);
    await waitFor(() => expect(outsideClose).toHaveBeenCalledOnce());
    await expect(outsideClose.mock.calls[0]?.[0].reason).toBe("outside");

    await userEvent.click(trigger);
    await canvas.findByRole("menu");
    await userEvent.keyboard("{ArrowDown}{End}{Tab}");
    await waitFor(() => expect(outsideClose).toHaveBeenCalledTimes(2));
    await expect(outsideClose.mock.calls[1]?.[0].reason).toBe("focus-out");
  },
};

function ImperativeExample() {
  const dropdownRef = useRef<GlDropdownHandle>(null);
  const [containsResult, setContainsResult] = useState("unchecked");

  return (
    <div style={{ display: "grid", gap: "1rem", justifyItems: "start" }}>
      <div style={storyLayout}>
        <GlButton onClick={() => dropdownRef.current?.open()}>Imperative open</GlButton>
      </div>
      <output data-testid="contains-result">{containsResult}</output>
      <GlDisclosureDropdown ref={dropdownRef}>
        <GlDisclosureDropdownTrigger>Imperative actions</GlDisclosureDropdownTrigger>
        <GlDisclosureDropdownContent>
          <GlDisclosureDropdownGroup>
            <GlDisclosureDropdownItem
              closeOnClick={false}
              onAction={({ event }) => setContainsResult(String(
                dropdownRef.current?.containsElement(event.currentTarget),
              ))}
              value="contains">
              Check containsElement
            </GlDisclosureDropdownItem>
            <GlDisclosureDropdownItem
              closeOnClick={false}
              onAction={() => dropdownRef.current?.close()}
              value="close">
              Imperative close
            </GlDisclosureDropdownItem>
            <GlDisclosureDropdownItem
              closeOnClick={false}
              onAction={() => dropdownRef.current?.closeAndFocus()}
              value="close-and-focus">
              Imperative close and focus
            </GlDisclosureDropdownItem>
          </GlDisclosureDropdownGroup>
        </GlDisclosureDropdownContent>
      </GlDisclosureDropdown>
    </div>
  );
}

export const ImperativeHandle: Story = {
  render: () => <ImperativeExample />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Imperative actions" });
    const openButton = canvas.getByRole("button", { name: "Imperative open" });

    await userEvent.click(openButton);
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
    await userEvent.click(await canvas.findByRole("menuitem", { name: "Check containsElement" }));
    await expect(canvas.getByTestId("contains-result")).toHaveTextContent("true");

    await userEvent.click(canvas.getByRole("menuitem", { name: "Imperative close" }));
    await waitFor(() => expect(trigger).not.toHaveAttribute("aria-expanded", "true"));
    await expect(trigger).not.toHaveFocus();

    await userEvent.click(openButton);
    await userEvent.click(await canvas.findByRole("menuitem", {
      name: "Imperative close and focus",
    }));
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

type StoryRouterLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  to: string;
};

const StoryRouterLink = forwardRef<HTMLAnchorElement, StoryRouterLinkProps>(
  function StoryRouterLink({ onClick, to, ...linkProps }, forwardedRef) {
    return (
      <a
        {...linkProps}
        ref={forwardedRef}
        href={to}
        onClick={(event) => {
          onClick?.(event);
          event.preventDefault();
        }} />
    );
  },
);

function ControlledCompositionExample() {
  const [open, setOpen] = useState(false);

  return (
    <GlDisclosureDropdown open={open} onOpenChange={setOpen}>
      <GlDisclosureDropdownTrigger
        nativeButton
        render={<button className="custom-story-trigger" type="button" />}>
        Custom controlled trigger
      </GlDisclosureDropdownTrigger>
      <GlDisclosureDropdownContent aria-label="Controlled actions">
        <GlDisclosureDropdownGroup>
          <GlDisclosureDropdownItem
            render={<StoryRouterLink to="#router-settings" />}
            value="settings">
            Router settings
          </GlDisclosureDropdownItem>
          <GlDisclosureDropdownItem href="javascript:alert(1)" value="unsafe">
            Sanitized link
          </GlDisclosureDropdownItem>
        </GlDisclosureDropdownGroup>
      </GlDisclosureDropdownContent>
    </GlDisclosureDropdown>
  );
}

export const ControlledAndCustomRender: Story = {
  render: () => <ControlledCompositionExample />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "Custom controlled trigger" });
    await expect(trigger).toHaveClass("custom-story-trigger", "gl-new-dropdown-toggle");
    await userEvent.click(trigger);

    const routerLink = await canvas.findByRole("menuitem", { name: "Router settings" });
    const sanitizedLink = canvas.getByRole("menuitem", { name: "Sanitized link" });
    await expect(routerLink).toHaveAttribute("href", "#router-settings");
    await expect(sanitizedLink).toHaveAttribute("href", "about:blank");
    await userEvent.click(routerLink);
    await expect(trigger).not.toHaveAttribute("aria-expanded", "true");
  },
};

export const NestedDropdowns: Story = {
  render: () => (
    <GlDisclosureDropdown>
      <GlDisclosureDropdownTrigger>Outer actions</GlDisclosureDropdownTrigger>
      <GlDisclosureDropdownContent>
        <GlDisclosureDropdownGroup>
          <GlDisclosureDropdownItem value="outer">Outer item</GlDisclosureDropdownItem>
        </GlDisclosureDropdownGroup>
        <div className="gl-p-2">
          <GlDisclosureDropdown>
            <GlDisclosureDropdownTrigger size="small">Nested actions</GlDisclosureDropdownTrigger>
            <GlDisclosureDropdownContent placement="right-start">
              <GlDisclosureDropdownGroup>
                <GlDisclosureDropdownItem value="nested">Nested item</GlDisclosureDropdownItem>
              </GlDisclosureDropdownGroup>
            </GlDisclosureDropdownContent>
          </GlDisclosureDropdown>
        </div>
      </GlDisclosureDropdownContent>
    </GlDisclosureDropdown>
  ),
  play: async ({ canvas }) => {
    const outerTrigger = canvas.getByRole("button", { name: "Outer actions" });
    await userEvent.click(outerTrigger);
    await canvas.findByRole("menuitem", { name: "Outer item" });

    const nestedTrigger = await canvas.findByRole("button", { name: "Nested actions" });
    await userEvent.click(nestedTrigger);
    await waitFor(() => expect(canvas.getAllByRole("menu")).toHaveLength(2));
    await userEvent.click(canvas.getByRole("menuitem", { name: "Nested item" }));
    await waitFor(() => expect(canvas.getAllByRole("menu")).toHaveLength(1));
    await expect(outerTrigger).toHaveAttribute("aria-expanded", "true");
    await expect(nestedTrigger).toHaveFocus();
  },
};

export const GroupsAndButtonGroup: Story = {
  render: () => (
    <GlButtonGroup>
      <GlButton>Save</GlButton>
      <GlDisclosureDropdown>
        <GlDisclosureDropdownTrigger textSrOnly>More save actions</GlDisclosureDropdownTrigger>
        <GlDisclosureDropdownContent>
          <GlDisclosureDropdownHeader>Custom header</GlDisclosureDropdownHeader>
          <GlDisclosureDropdownGroup>
            <GlDisclosureDropdownGroupLabel>General</GlDisclosureDropdownGroupLabel>
            <GlDisclosureDropdownItem icon="download" value="download">
              Download
            </GlDisclosureDropdownItem>
            <GlDisclosureDropdownItem value="duplicate">Duplicate</GlDisclosureDropdownItem>
          </GlDisclosureDropdownGroup>
          <GlDisclosureDropdownGroup bordered borderPosition="top">
            <GlDisclosureDropdownGroupLabel>Danger zone</GlDisclosureDropdownGroupLabel>
            <GlDisclosureDropdownItem value="delete" variant="danger">Delete</GlDisclosureDropdownItem>
          </GlDisclosureDropdownGroup>
          <GlDisclosureDropdownFooter>Custom footer</GlDisclosureDropdownFooter>
        </GlDisclosureDropdownContent>
      </GlDisclosureDropdown>
    </GlButtonGroup>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "More save actions" });
    await expect(trigger).toHaveClass("gl-new-dropdown-caret-only", "btn-icon");
    await userEvent.click(trigger);

    const generalLabel = await canvas.findByText("General");
    const generalGroup = generalLabel.parentElement;
    await expect(generalLabel).toHaveAttribute("id");
    await expect(generalGroup).toHaveAttribute("role", "group");
    await expect(generalGroup).toHaveAttribute("aria-labelledby", generalLabel.id);
    await expect(generalGroup?.querySelectorAll(".gl-new-dropdown-item-icon")).toHaveLength(2);
    const header = canvas.getByText("Custom header");
    const footer = canvas.getByText("Custom footer");
    await expect(header).toBeVisible();
    await expect(header).toHaveClass("gl-new-dropdown-header-content");
    await expect(header.parentElement).toHaveClass("gl-new-dropdown-header");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveClass("gl-new-dropdown-footer");
  },
};

export const FixedFluidAndScrolling: Story = {
  render: () => (
    <GlDisclosureDropdown>
      <GlDisclosureDropdownTrigger>Many actions</GlDisclosureDropdownTrigger>
      <GlDisclosureDropdownContent
        fluidWidth
        placement="bottom-end"
        positioningStrategy="fixed"
        style={{ "--available-height": "12rem" } as CSSProperties}>
        <GlDisclosureDropdownGroup>
          {Array.from({ length: 20 }, (_, index) => (
            <GlDisclosureDropdownItem key={index} value={index}>
              Action {String(index + 1).padStart(2, "0")} with a fluid-width label
            </GlDisclosureDropdownItem>
          ))}
        </GlDisclosureDropdownGroup>
      </GlDisclosureDropdownContent>
    </GlDisclosureDropdown>
  ),
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Many actions" }));
    const body = within(canvasElement.ownerDocument.body);
    const menu = await body.findByRole("menu");
    const inner = menu.querySelector<HTMLElement>(".gl-new-dropdown-inner")!;
    const contents = menu.querySelector<HTMLElement>(".gl-new-dropdown-contents")!;

    await expect(menu).toHaveClass("gl-disclosure-dropdown-panel");
    await expect(menu).toHaveClass("gl-new-dropdown-panel-fluid-width");
    await expect(menu.closest(".gl-new-dropdown-container")).toHaveStyle({ position: "fixed" });
    await expect(inner).toHaveStyle({ maxHeight: "none" });
    await waitFor(() => expect(contents).toHaveClass("bottom-scrim-visible"));
    contents.scrollTop = contents.scrollHeight - contents.clientHeight;
    await fireEvent.scroll(contents);
    await waitFor(() => {
      expect(contents).toHaveClass("top-scrim-visible");
      expect(contents).not.toHaveClass("bottom-scrim-visible");
    });
  },
};

export const PlacementsAndWidths: Story = {
  render: () => (
    <div style={storyLayout}>
      {(["left", "bottom", "right", "right-start"] as const).map((placement) => (
        <GlDisclosureDropdown defaultOpen key={placement}>
          <GlDisclosureDropdownTrigger>{placement}</GlDisclosureDropdownTrigger>
          <GlDisclosureDropdownContent
            fluidWidth={placement === "right-start"}
            offset={{ crossAxis: placement === "right-start" ? 4 : 0, mainAxis: 8 }}
            placement={placement}>
            <GlDisclosureDropdownGroup>
              <GlDisclosureDropdownItem value={placement}>
                Placement: {placement}
              </GlDisclosureDropdownItem>
            </GlDisclosureDropdownGroup>
          </GlDisclosureDropdownContent>
        </GlDisclosureDropdown>
      ))}
    </div>
  ),
};
