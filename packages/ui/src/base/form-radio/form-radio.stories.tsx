import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent } from "storybook/test";
import GlFormRadio, { type GlFormRadioProps } from "./form-radio";

const meta = {
  title: "UI/Base/Form Radio",
  component: GlFormRadio,
  args: {
    children: "Option",
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
} satisfies Meta<typeof GlFormRadio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: undefined,
  },
  render: (args) => (
    <div>
      <GlFormRadio {...args} name="radio-group" value="option">Option</GlFormRadio>
      <GlFormRadio {...args} name="radio-group" value="slot-option" help="With help text.">Slot option</GlFormRadio>
      <GlFormRadio {...args} checked="checked-option" name="radio-group" value="checked-option">Checked option</GlFormRadio>
      <GlFormRadio {...args} checked="checked-disabled-option" disabled name="last-radio-group" value="checked-disabled-option">Checked disabled option</GlFormRadio>
      <GlFormRadio {...args} disabled name="radio-group" value="disabled-option">Disabled option</GlFormRadio>
      <GlFormRadio {...args} disabled name="radio-group" value="disabled-option-with-help-text" help="With help text.">Disabled option with help text</GlFormRadio>
    </div>
  ),
  play: async ({ canvas }) => {
    const option = canvas.getByRole("radio", { name: "Option" });
    await expect(option).not.toBeChecked();
    await expect(option).toHaveClass("custom-control-input");

    await expect(canvas.getByRole("radio", { name: /Checked option/ })).toBeChecked();
    await expect(canvas.getByRole("radio", { name: /Checked disabled option/ })).toBeChecked();
    await expect(canvas.getByRole("radio", { name: /Checked disabled option/ })).toBeDisabled();
    await expect(canvas.getByRole("radio", { name: "Disabled option" })).toBeDisabled();

    // The help text is rendered inside the label
    const helpTexts = canvas.getAllByText("With help text.");
    await expect(helpTexts).toHaveLength(2);
    await expect(helpTexts[0]).toHaveClass("help-text");
  },
};

export const SingleRadio: Story = {
  args: {
    checked: "checked-option",
    children: "Checked option",
    value: "checked-option",
  },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("radio", { name: "Checked option" });

    await expect(input).toBeChecked();

    // Without a listener updating the `checked` prop, the internal state
    // keeps the selection, like upstream.
    await userEvent.click(input);
    await expect(input).toBeChecked();
  },
};

export const CustomValue: Story = {
  args: {
    checked: "foo",
    children: "Custom value",
    value: "bar",
  },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("radio", { name: "Custom value" });

    // checked="foo" does not match value="bar", so the radio starts unchecked
    await expect(input).not.toBeChecked();

    await userEvent.click(input);
    await expect(args.onInput).toHaveBeenLastCalledWith("bar");
    await expect(args.onChange).toHaveBeenLastCalledWith("bar");
    await expect(input).toBeChecked();
  },
};

function RadioGroupExample(args: GlFormRadioProps) {
  const [checked, setChecked] = useState<unknown>("one");
  const handleInput = (value: unknown) => {
    args.onInput?.(value);
    setChecked(value);
  };
  return (
    <div>
      <GlFormRadio
        {...args}
        checked={checked}
        name="example-group"
        onInput={handleInput}
        value="one">
        One
      </GlFormRadio>
      <GlFormRadio
        {...args}
        checked={checked}
        name="example-group"
        onInput={handleInput}
        value="two">
        Two
      </GlFormRadio>
    </div>
  );
}

export const RadioGroup: Story = {
  args: {
    children: undefined,
  },
  render: (args) => <RadioGroupExample {...args} />,
  play: async ({ args, canvas }) => {
    const one = canvas.getByRole("radio", { name: "One" });
    const two = canvas.getByRole("radio", { name: "Two" });

    await expect(one).toBeChecked();
    await expect(two).not.toBeChecked();

    // Selecting the other radio moves the shared model value
    await userEvent.click(two);
    await expect(args.onInput).toHaveBeenLastCalledWith("two");
    await expect(args.onChange).toHaveBeenLastCalledWith("two");
    await expect(two).toBeChecked();
    await expect(one).not.toBeChecked();
  },
};

export const ValidationStates: Story = {
  args: {
    children: undefined,
  },
  render: (args) => (
    <div>
      <GlFormRadio {...args} value="valid-option" state>Valid option</GlFormRadio>
      <GlFormRadio {...args} value="invalid-option" state={false}>Invalid option</GlFormRadio>
    </div>
  ),
  play: async ({ canvas }) => {
    const valid = canvas.getByRole("radio", { name: "Valid option" });
    const invalid = canvas.getByRole("radio", { name: "Invalid option" });

    await expect(valid).toHaveClass("is-valid");
    await expect(valid).not.toHaveAttribute("aria-invalid");
    await expect(invalid).toHaveClass("is-invalid");
    await expect(invalid).toHaveAttribute("aria-invalid", "true");
  },
};

export const Required: Story = {
  args: {
    children: "Required option",
    name: "required-option",
    required: true,
    value: "required-option",
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("radio", { name: "Required option" });

    await expect(input).toBeRequired();
    await expect(input).toHaveAttribute("aria-required", "true");
    await expect(input).toHaveAttribute("name", "required-option");
  },
};
