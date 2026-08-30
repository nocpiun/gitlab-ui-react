import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import GlLabel from "./label";

const meta = {
  title: "UI/Base/Label",
  component: GlLabel,
  args: {
    backgroundColor: "#D9C2EE",
    disabled: false,
    scoped: false,
    showCloseButton: false,
    target: "#",
    title: "Label title",
  },
  argTypes: {
    backgroundColor: {
      control: "color",
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas label documentation](https://design.gitlab.com/components/label/) for usage guidance.",
      },
    },
  },
} satisfies Meta<typeof GlLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "Label title" });

    await expect(link).toHaveAttribute("href", "#");
    await expect(link.closest(".gl-label")).toHaveClass("gl-label-text-dark");
  },
};

export const Scoped: Story = {
  args: {
    scoped: true,
    title: "scoped::label",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("scoped")).toHaveClass("gl-label-text");
    await expect(canvas.getByText("label")).toHaveClass("gl-label-text-scoped");
  },
};

export const WithCloseButton: Story = {
  args: {
    onClose: fn(),
    showCloseButton: true,
  },
  play: async ({ args, canvas }) => {
    const closeButton = canvas.getByRole("button", { name: "Remove label - Label title" });

    await userEvent.click(closeButton);
    await expect(args.onClose).toHaveBeenCalledOnce();
  },
};

export const DisabledCloseButton: Story = {
  args: {
    disabled: true,
    onClose: fn(),
    showCloseButton: true,
  },
  play: async ({ args, canvas }) => {
    const closeButton = canvas.getByRole("button", { name: "Remove label - Label title" });

    await userEvent.click(closeButton);
    await expect(closeButton).toHaveAttribute("aria-disabled", "true");
    await expect(args.onClose).not.toHaveBeenCalled();
  },
};

export const WithoutTarget: Story = {
  args: {
    target: "",
  },
  play: async ({ canvas }) => {
    const content = canvas.getByText("Label title").closest(".gl-label-link");

    await expect(canvas.queryByRole("link")).not.toBeInTheDocument();
    await expect(content?.tagName).toBe("SPAN");
    await expect(content).toHaveAttribute("tabindex", "0");
  },
};
