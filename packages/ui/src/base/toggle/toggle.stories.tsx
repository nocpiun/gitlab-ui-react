import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type CSSProperties } from "react";
import { expect, userEvent } from "storybook/test";
import GlToggle, { type GlToggleLabelPosition, type GlToggleProps } from "./toggle";

const labelPositions = [
  "top",
  "left",
  "hidden",
] satisfies GlToggleLabelPosition[];

const collectionStyle: CSSProperties = {
  alignItems: "flex-start",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

function ControlledToggle(args: GlToggleProps) {
  const [value, setValue] = useState(Boolean(args.value));

  return <GlToggle {...args} value={value} onChange={setValue} />;
}

const meta = {
  title: "UI/Base/Toggle",
  component: GlToggle,
  args: {
    disabled: false,
    help: "Toggle something for the website.",
    isLoading: false,
    label: "Label",
    labelPosition: "top",
    value: true,
  },
  argTypes: {
    labelPosition: {
      control: "select",
      options: labelPositions,
    },
    name: {
      control: false,
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas toggle documentation](https://design.gitlab.com/components/toggle/) for usage guidance.",
      },
    },
  },
  render: (args) => <ControlledToggle {...args} />,
} satisfies Meta<typeof GlToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole("switch", { name: "Label" });

    await expect(toggle).toHaveAttribute("aria-checked", "true");

    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-checked", "false");

    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-checked", "true");
  },
};

export const WithDescription: Story = {
  args: {
    description: "An explanation for what the toggle does.",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("toggle-description"))
      .toHaveTextContent("An explanation for what the toggle does.");
  },
};

export const WithLongHelp: Story = {
  args: {
    help: `This is a toggle component with a long help message.
      You can notice how the text wraps when the width of the container
      is not enough to fix the entire text.`,
  },
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole("switch", { name: "Label" });
    const help = canvas.getByTestId("toggle-help");

    await expect(toggle).toHaveAttribute("aria-describedby", help.id);
  },
};

export const LabelPositionLeft: Story = {
  args: {
    description: "Not rendered in the inline layout.",
    help: "Not rendered either.",
    labelPosition: "left",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("toggle-wrapper")).toHaveClass("gl-toggle-label-inline");
    await expect(canvas.queryByTestId("toggle-description")).not.toBeInTheDocument();
    await expect(canvas.queryByTestId("toggle-help")).not.toBeInTheDocument();
  },
};

export const HiddenLabel: Story = {
  args: {
    labelPosition: "hidden",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("toggle-label")).toHaveClass("gl-sr-only");
    await expect(canvas.getByRole("switch", { name: "Label" })).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole("switch", { name: "Label" });

    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-disabled", "true");
    await expect(toggle).toHaveAttribute("aria-checked", "true");
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
  play: async ({ canvas }) => {
    const toggle = canvas.getByRole("switch", { name: "Label" });

    await expect(toggle).toHaveClass("is-loading", "is-disabled");
    await expect(toggle.querySelector(".gl-spinner")).not.toBeNull();
    // Loading is visual only: activation still works, like upstream.
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-checked", "false");
  },
};

export const AllVariants: Story = {
  argTypes: {
    disabled: {
      control: false,
    },
    isLoading: {
      control: false,
    },
    value: {
      control: false,
    },
  },
  render: () => (
    <div style={collectionStyle}>
      <GlToggle defaultValue label="On" />
      <GlToggle label="Off" />
      <GlToggle disabled label="On disabled" value />
      <GlToggle disabled label="Off disabled" />
      <GlToggle isLoading label="Loading on" value />
      <GlToggle isLoading label="Loading off" />
    </div>
  ),
  play: async ({ canvas }) => {
    const toggles = canvas.getAllByRole("switch");

    await expect(toggles).toHaveLength(6);
    await expect(toggles[0]).toHaveAttribute("aria-checked", "true");
    await expect(toggles[2]).toHaveAttribute("aria-disabled", "true");
    await expect(toggles[4].querySelector(".gl-spinner")).not.toBeNull();
  },
};
