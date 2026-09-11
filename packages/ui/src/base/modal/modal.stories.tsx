import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import GlButton from "../button/button";
import GlModal, {
  GlModalClose,
  GlModalContent,
  GlModalFooter,
  GlModalHeader,
  GlModalTitle,
  GlModalTrigger,
  type GlModalContentProps,
  type GlModalProps,
} from "./modal";

const loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

type ModalExampleProps = {
  bodyParagraphs?: number;
  bodyAction?: boolean;
  contentProps?: GlModalContentProps;
  footer?: boolean;
  rootProps: GlModalProps;
  title?: string;
};

function ModalExample({
  bodyAction = false,
  bodyParagraphs = 1,
  contentProps,
  footer = true,
  rootProps,
  title = "Example title",
}: ModalExampleProps) {
  return (
    <div className="gl-p-5">
      <GlModal {...rootProps}>
        <GlModalTrigger category="primary" variant="confirm">
          Open modal
        </GlModalTrigger>
        <GlModalContent {...contentProps}>
          <GlModalHeader>
            <GlModalTitle>{title}</GlModalTitle>
          </GlModalHeader>
          {bodyAction ? <GlButton>Body action</GlButton> : null}
          {Array.from({ length: bodyParagraphs }, (_, index) => (
            <p key={index}>{loremIpsum}</p>
          ))}
          {footer ? (
            <GlModalFooter>
              <GlModalClose>Cancel</GlModalClose>
              <GlModalClose category="secondary" variant="confirm">
                Discard changes
              </GlModalClose>
              <GlButton category="primary" variant="confirm">Okay</GlButton>
            </GlModalFooter>
          ) : null}
        </GlModalContent>
      </GlModal>
    </div>
  );
}

function StatefulModalAction({ label }: { label: string }) {
  const [clicks, setClicks] = useState(0);

  return (
    <GlButton onClick={() => setClicks((value) => value + 1)}>
      {label}: {clicks}
    </GlButton>
  );
}

function KeyedChildrenExample({ rootProps }: { rootProps: GlModalProps }) {
  const [reversed, setReversed] = useState(false);
  const headerActions = [
    <StatefulModalAction key="header-one" label="Header one" />,
    <StatefulModalAction key="header-two" label="Header two" />,
  ];
  const footerActions = [
    <StatefulModalAction key="footer-one" label="Footer one" />,
    <StatefulModalAction key="footer-two" label="Footer two" />,
  ];

  if(reversed) {
    headerActions.reverse();
    footerActions.reverse();
  }

  return (
    <div className="gl-p-5">
      <GlModal {...rootProps}>
        <GlModalTrigger asChild><GlButton>Open modal</GlButton></GlModalTrigger>
        <GlModalContent>
          <GlModalHeader>
            <GlModalTitle>Keyed child actions</GlModalTitle>
            {headerActions}
          </GlModalHeader>
          <GlButton onClick={() => setReversed((value) => !value)}>
            Reverse actions
          </GlButton>
          <GlModalFooter>{footerActions}</GlModalFooter>
        </GlModalContent>
      </GlModal>
    </div>
  );
}

const meta = {
  title: "UI/Base/Modal",
  component: GlModal,
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
          "See the [Pajamas modal documentation](https://design.gitlab.com/components/modal) for usage guidance.",
      },
    },
    layout: "fullscreen",
  },
} satisfies Meta<typeof GlModal>;

export default meta;
type Story = StoryObj<typeof meta>;

async function openModal(canvas: ReturnType<typeof within>) {
  const trigger = canvas.getByRole("button", { name: "Open modal" });
  await userEvent.click(trigger);
  const dialog = await within(document.body).findByRole("dialog");
  return { dialog, trigger };
}

export const Default: Story = {
  render: (args) => <ModalExample rootProps={args} />,
  play: async ({ args, canvas }) => {
    const body = within(document.body);
    const { dialog, trigger } = await openModal(canvas);
    const modal = within(dialog);
    const title = modal.getByRole("heading", { level: 2, name: "Example title" });
    const headerClose = modal.getByRole("button", { name: "Close" });
    const cancel = modal.getByRole("button", { name: "Cancel" });
    const discard = modal.getByRole("button", { name: "Discard changes" });
    const okay = modal.getByRole("button", { name: "Okay" });
    const modalBody = dialog.querySelector<HTMLElement>(".gl-modal-body");

    await expect(dialog).toHaveClass("gl-modal-content");
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(dialog).toHaveAttribute("aria-labelledby", title.id);
    await expect(dialog).toHaveAttribute("aria-describedby", modalBody?.id);
    await expect(dialog.parentElement).toHaveClass("gl-modal-dialog", "gl-modal-md");
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
    await waitFor(() => expect(args.onOpened).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(cancel).toHaveFocus());

    await userEvent.tab();
    await expect(discard).toHaveFocus();
    await userEvent.tab();
    await expect(okay).toHaveFocus();
    await userEvent.tab();
    await waitFor(() => expect(headerClose).toHaveFocus());

    await userEvent.click(cancel);
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
    await expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    await body.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    const reopenedDialog = await body.findByRole("dialog");
    await userEvent.click(within(reopenedDialog).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    await body.findByRole("dialog");
    const backdrop = document.querySelector<HTMLElement>(".gl-modal-backdrop");
    await expect(backdrop).toBeInTheDocument();
    await userEvent.click(backdrop!);
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();
  },
};

export const WithScrollingContent: Story = {
  args: {
    defaultOpen: true,
  },
  render: (args) => (
    <ModalExample
      bodyAction
      bodyParagraphs={100}
      contentProps={{ scrollable: true }}
      rootProps={args} />
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");
    const bodyAction = within(dialog).getByRole("button", { name: "Body action" });

    await expect(dialog.parentElement).toHaveClass("gl-modal-dialog-scrollable");
    await expect(dialog.querySelector(".gl-modal-body")).toBeInTheDocument();
    await waitFor(() => expect(bodyAction).toHaveFocus());
  },
};

export const CustomHeader: Story = {
  args: {
    defaultOpen: true,
  },
  render: (args) => (
    <div className="gl-p-5">
      <GlModal {...args}>
        <GlModalTrigger asChild><GlButton>Open modal</GlButton></GlModalTrigger>
        <GlModalContent>
          <GlModalHeader>
            <span aria-hidden="true">Review:</span>
            <GlModalTitle>Custom header title</GlModalTitle>
          </GlModalHeader>
          <p>{loremIpsum}</p>
        </GlModalContent>
      </GlModal>
    </div>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");

    await expect(within(dialog).getByText("Review:")).toBeVisible();
    await expect(within(dialog).getByRole("button", { name: "Close" })).toBeVisible();
  },
};

export const KeyedChildren: Story = {
  args: {
    defaultOpen: true,
  },
  render: (args) => <KeyedChildrenExample rootProps={args} />,
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");
    const modal = within(dialog);

    await userEvent.click(modal.getByRole("button", { name: "Header one: 0" }));
    await userEvent.click(modal.getByRole("button", { name: "Footer one: 0" }));
    await userEvent.click(modal.getByRole("button", { name: "Reverse actions" }));

    await expect(modal.getByRole("button", { name: "Header one: 1" })).toBeVisible();
    await expect(modal.getByRole("button", { name: "Footer one: 1" })).toBeVisible();
  },
};

export const WithoutFooter: Story = {
  args: {
    defaultOpen: true,
  },
  render: (args) => <ModalExample footer={false} rootProps={args} />,
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");
    const closeButton = within(dialog).getByRole("button", { name: "Close" });

    await expect(dialog.querySelector(".gl-modal-footer")).not.toBeInTheDocument();
    await waitFor(() => expect(closeButton).toHaveFocus());
  },
};

export const Small: Story = {
  args: {
    defaultOpen: true,
  },
  render: (args) => <ModalExample contentProps={{ size: "sm" }} rootProps={args} />,
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");
    await expect(dialog.parentElement).toHaveClass("gl-modal-sm");
    await expect(getComputedStyle(dialog.parentElement!).maxWidth).toBe("512px");
  },
};

export const Large: Story = {
  args: {
    defaultOpen: true,
  },
  render: (args) => <ModalExample contentProps={{ size: "lg" }} rootProps={args} />,
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog");
    await expect(dialog.parentElement).toHaveClass("gl-modal-lg");
    await expect(getComputedStyle(dialog.parentElement!).maxWidth).toBe("990px");
  },
};

export const WithoutTitle: Story = {
  args: {
    defaultOpen: true,
  },
  render: (args) => (
    <div className="gl-p-5">
      <GlModal {...args}>
        <GlModalTrigger asChild><GlButton>Open modal</GlButton></GlModalTrigger>
        <GlModalContent aria-label="Modal without a title">
          <GlModalHeader />
          <p>{loremIpsum}</p>
          <GlModalFooter><GlModalClose>Cancel</GlModalClose></GlModalFooter>
        </GlModalContent>
      </GlModal>
    </div>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole("dialog", {
      name: "Modal without a title",
    });

    await expect(dialog).toHaveAttribute("aria-label", "Modal without a title");
    await expect(dialog).not.toHaveAttribute("aria-labelledby");
    await expect(within(dialog).queryByRole("heading")).not.toBeInTheDocument();
    await expect(within(dialog).getByRole("button", { name: "Close" })).toBeVisible();
  },
};
