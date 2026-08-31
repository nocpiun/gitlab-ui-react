import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent } from "storybook/test";
import GlFormRadio from "../form-radio/form-radio";
import GlFormRadioGroup, { type GlFormRadioGroupProps } from "./form-radio-group";

const defaultOptions = [
  { value: "pizza", text: "Pizza" },
  { value: "tacos", text: "Tacos" },
  { value: "burger", text: "Burger", disabled: true },
];

const meta = {
  title: "UI/Base/Form Radio Group",
  component: GlFormRadioGroup,
  args: {
    name: "radio-group-name",
    options: defaultOptions,
    onChange: fn(),
    onInput: fn(),
  },
  argTypes: {
    state: {
      control: "select",
      options: [null, true, false],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas radio button documentation](https://design.gitlab.com/components/radio-button) for usage and implementation details.",
      },
    },
  },
} satisfies Meta<typeof GlFormRadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <GlFormRadioGroup
      {...args}
      checked="slot-option"
      first={(
        <GlFormRadio value="slot-option" help="Help text.">
          Slot option with help text
        </GlFormRadio>
      )}>
      <GlFormRadio value="Last option">Last option</GlFormRadio>
    </GlFormRadioGroup>
  ),
  play: async ({ args, canvas }) => {
    const group = canvas.getByRole("radiogroup");
    await expect(group).toHaveClass("gl-form-radio-group");

    // The shared model checks the matching radios from slots and options
    const slotOption = canvas.getByRole("radio", { name: /Slot option with help text/ });
    const pizza = canvas.getByRole("radio", { name: "Pizza" });
    const tacos = canvas.getByRole("radio", { name: "Tacos" });
    const burger = canvas.getByRole("radio", { name: "Burger" });
    const last = canvas.getByRole("radio", { name: "Last option" });

    await expect(slotOption).toBeChecked();
    await expect(pizza).not.toBeChecked();
    await expect(burger).toBeDisabled();

    // Every radio shares the group name
    for(const radio of [slotOption, pizza, tacos, burger, last]) {
      await expect(radio).toHaveAttribute("name", "radio-group-name");
    }

    // A user selection moves the shared model and emits input then change
    await userEvent.click(tacos);
    await expect(args.onInput).toHaveBeenLastCalledWith("tacos");
    await expect(args.onChange).toHaveBeenLastCalledWith("tacos");
    await expect(tacos).toBeChecked();
    await expect(slotOption).not.toBeChecked();

    await userEvent.click(last);
    await expect(args.onInput).toHaveBeenLastCalledWith("Last option");
    await expect(last).toBeChecked();
    await expect(tacos).not.toBeChecked();
  },
};

function ControlledGroupExample(args: GlFormRadioGroupProps) {
  const [checked, setChecked] = useState<unknown>("tacos");
  return (
    <div>
      <GlFormRadioGroup {...args} checked={checked} onInput={setChecked} />
      <p>
        Selected:
        {" "}
        {String(checked)}
      </p>
    </div>
  );
}

export const Controlled: Story = {
  render: (args) => <ControlledGroupExample {...args} />,
  play: async ({ canvas }) => {
    const tacos = canvas.getByRole("radio", { name: "Tacos" });
    const pizza = canvas.getByRole("radio", { name: "Pizza" });

    await expect(tacos).toBeChecked();

    await userEvent.click(pizza);
    await expect(pizza).toBeChecked();
    await expect(tacos).not.toBeChecked();
    await expect(canvas.getByText("Selected: pizza")).toBeInTheDocument();
  },
};

export const ValidationStates: Story = {
  args: {
    options: ["one", "two"],
  },
  render: (args) => (
    <div>
      <GlFormRadioGroup {...args} name="valid-group" state />
      <GlFormRadioGroup {...args} name="invalid-group" state={false} />
    </div>
  ),
  play: async ({ canvas }) => {
    const [validGroup, invalidGroup] = canvas.getAllByRole("radiogroup");

    await expect(validGroup).not.toHaveAttribute("aria-invalid");
    await expect(invalidGroup).toHaveAttribute("aria-invalid", "true");

    for(const radio of canvas.getAllByRole("radio", { name: "one" })) {
      // The state class comes from the group, not the radio
      const isValid = radio.getAttribute("name") === "valid-group";
      await expect(radio).toHaveClass(isValid ? "is-valid" : "is-invalid");
    }
  },
};

export const Required: Story = {
  args: {
    options: ["one", "two"],
    required: true,
  },
  play: async ({ canvas }) => {
    const group = canvas.getByRole("radiogroup");
    await expect(group).toHaveAttribute("aria-required", "true");

    for(const radio of canvas.getAllByRole("radio")) {
      await expect(radio).toBeRequired();
      await expect(radio).toHaveAttribute("aria-required", "true");
    }
  },
};

export const HtmlOption: Story = {
  args: {
    options: [
      { text: "fallback", html: "<strong>HTML</strong> option<script>window.__xss = true;</script>" },
      { text: "Plain option" },
    ],
  },
  play: async ({ canvas }) => {
    // The html option is sanitized (upstream's safe_html directive): markup is
    // rendered, scripts are stripped
    const group = canvas.getByRole("radiogroup");
    const radio = canvas.getByRole("radio", { name: /HTML option/ });
    await expect(radio).toBeInTheDocument();
    await expect(group.querySelector("strong")).not.toBeNull();
    await expect(canvas.queryByText("fallback")).not.toBeInTheDocument();
    await expect(group.querySelector("script")).toBeNull();
  },
};
