import type { MouseEvent } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import GlAlert, { type GlAlertVariant } from "./alert";

const variants = [
  "success",
  "warning",
  "danger",
  "info",
  "tip",
] satisfies GlAlertVariant[];

const meta = {
  title: "UI/Base/Alert",
  component: GlAlert,
  args: {
    children: "Lorem ipsum dolor sit amet",
    dismissLabel: "Dismiss",
    dismissible: true,
    headerLevel: 2,
    onDismiss: fn(),
    onPrimaryAction: fn(),
    onSecondaryAction: fn(),
    sticky: false,
    variant: "info",
  },
  argTypes: {
    variant: {
      control: "select",
      options: variants,
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas alert documentation](https://design.gitlab.com/components/alert) for usage guidance.",
      },
    },
  },
} satisfies Meta<typeof GlAlert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas }) => {
    const alert = canvas.getByRole("status");

    await expect(alert).toHaveClass("gl-alert", "gl-alert-info");
    await expect(alert).toHaveAttribute("aria-live", "polite");
    await expect(alert).toHaveAttribute("tabindex", "-1");
    await expect(canvas.getByTestId("information-o-icon")).toHaveClass("gl-alert-icon");
    await expect(canvas.queryByText("gl-alert-title")).toBeNull();

    await userEvent.click(canvas.getByRole("button", { name: "Dismiss" }));
    await expect(args.onDismiss).toHaveBeenCalledTimes(1);
  },
};

export const TitledWarning: Story = {
  args: {
    title: "A warning",
    variant: "warning",
  },
  play: async ({ canvas }) => {
    const alert = canvas.getByRole("alert");

    await expect(alert).toHaveClass("gl-alert-warning", "gl-alert-has-title");
    await expect(within(alert).getByRole("heading", { level: 2 })).toHaveClass("gl-alert-title");
  },
};

export const UndismissibleDangerWithActions: Story = {
  args: {
    dismissible: false,
    // preventDefault keeps the href="#" anchor from navigating the story iframe
    onSecondaryAction: fn((event: MouseEvent<HTMLElement>) => event.preventDefault()),
    primaryButtonText: "Primary action",
    secondaryButtonLink: "#",
    secondaryButtonText: "Secondary action",
    variant: "danger",
  },
  play: async ({ args, canvas }) => {
    const alert = canvas.getByRole("alert");

    await expect(alert).toHaveClass("gl-alert-danger", "gl-alert-not-dismissible");
    await expect(within(alert).queryByRole("button", { name: "Dismiss" })).toBeNull();

    await userEvent.click(canvas.getByRole("button", { name: "Primary action" }));
    await expect(args.onPrimaryAction).toHaveBeenCalledTimes(1);

    const secondary = canvas.getByRole("button", { name: "Secondary action" });
    await expect(secondary).toHaveAttribute("href", "#");
    await userEvent.click(secondary);
    await expect(args.onSecondaryAction).toHaveBeenCalledTimes(1);
  },
};

export const CustomActions: Story = {
  args: {
    actions: <button type="button">Custom action</button>,
  },
  argTypes: {
    actions: {
      control: false,
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Custom action" })).toBeInTheDocument();
  },
};

export const Variants: Story = {
  argTypes: {
    variant: {
      control: false,
    },
  },
  render: (args) => (
    <div>
      {variants.map((variant) => (
        <GlAlert
          {...args}
          className="gl-mb-5"
          key={variant}
          primaryButtonText="Primary"
          secondaryButtonText="Secondary"
          title="Alert title"
          variant={variant}>
          <span className="gl-capitalize">{variant}</span> lorem ipsum dolor sit amet
        </GlAlert>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    for(const variant of variants) {
      const role = ["danger", "success", "warning"].includes(variant) ? "alert" : "status";

      await expect(canvas.getAllByRole(role).some((el) => el.classList.contains(`gl-alert-${variant}`))).toBe(true);
    }
  },
};

export const Focused: Story = {
  args: {
    variant: "danger",
  },
  parameters: {
    controls: {
      exclude: /.*/,
    },
  },
  play: async ({ canvas }) => {
    const alert = canvas.getByRole("alert");

    await expect(alert).not.toHaveClass("gl-focus");

    // Pointer-initiated focus must not apply the programmatic-focus class,
    // mirroring the upstream behavior where only the focus() method does.
    await userEvent.click(canvas.getByText("Lorem ipsum dolor sit amet"));
    await expect(alert).not.toHaveClass("gl-focus");

    // The click already focused the alert; blur so the programmatic focus()
    // below actually fires a focus event.
    alert.blur();
    await expect(alert).not.toHaveFocus();

    alert.focus();
    await expect(alert).toHaveFocus();
    await expect(alert).toHaveClass("gl-focus");

    alert.blur();
    await expect(alert).not.toHaveFocus();
    await expect(alert).not.toHaveClass("gl-focus");
  },
};
