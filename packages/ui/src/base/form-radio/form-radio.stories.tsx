import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import GlFormRadio, { type GlFormRadioProps } from "./form-radio";

const meta = {
  title: "UI/Base/Form Radio",
  component: GlFormRadio,
  args: {
    children: "Option",
    onChange: fn(),
    onCheckedChange: fn(),
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
      <GlFormRadio {...args} checked name="radio-group" value="checked-option">Checked option</GlFormRadio>
      <GlFormRadio {...args} checked disabled name="last-radio-group" value="checked-disabled-option">Checked disabled option</GlFormRadio>
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

    // The shared custom-control foundation, identical to the checkbox's: the
    // label is inline-block (Bootstrap Reboot compensation), the GitLab
    // padding override wins, and the box carries `$custom-forms-transition`.
    const helpLabel = helpTexts[0].parentElement!;
    await expect(helpLabel).toHaveClass("custom-control-label");
    await expect(getComputedStyle(helpLabel).display).toBe("inline-block");
    const wrapper = option.closest(".gl-form-radio")!;
    await expect(getComputedStyle(wrapper).paddingLeft).toBe("16px");
    await expect(getComputedStyle(wrapper).minHeight).toBe("24px");
    const indicator = getComputedStyle(helpLabel, "::before");
    await expect(indicator.transitionProperty).toBe("background-color, border-color, box-shadow");
    await expect(indicator.borderRadius).toBe("50%");
  },
};

export const SingleRadio: Story = {
  args: {
    children: "Checked option",
    defaultChecked: true,
    value: "checked-option",
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("radio", { name: "Checked option" });

    await expect(input).toBeChecked();

    await userEvent.click(input);
    await expect(input).toBeChecked();
  },
};

export const CustomValue: Story = {
  args: {
    children: "Custom value",
    value: "bar",
  },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("radio", { name: "Custom value" });

    await expect(input).not.toBeChecked();
    await expect(input).toHaveAttribute("value", "bar");

    await userEvent.click(input);
    await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);
    await expect(args.onChange).toHaveBeenCalled();
    await expect(input).toBeChecked();
  },
};

function RadioGroupExample(args: GlFormRadioProps) {
  const [value, setValue] = useState<"one" | "two">("one");
  return (
    <div>
      <GlFormRadio
        {...args}
        checked={value === "one"}
        name="example-group"
        onCheckedChange={(nextChecked) => {
          args.onCheckedChange?.(nextChecked);
          if(nextChecked) setValue("one");
        }}
        value="one">
        One
      </GlFormRadio>
      <GlFormRadio
        {...args}
        checked={value === "two"}
        name="example-group"
        onCheckedChange={(nextChecked) => {
          args.onCheckedChange?.(nextChecked);
          if(nextChecked) setValue("two");
        }}
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

    // Selecting the other radio updates the controlled checked states.
    await userEvent.click(two);
    await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);
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

function NativeRadioResetExample({
  onCheckedChange,
}: Pick<GlFormRadioProps, "onCheckedChange">) {
  const [, rerender] = useState(0);

  return (
    <form>
      <GlFormRadio
        defaultChecked
        name="native-radio"
        onCheckedChange={onCheckedChange}
        value="one">
        One
      </GlFormRadio>
      <GlFormRadio name="native-radio" onCheckedChange={onCheckedChange} value="two">
        Two
      </GlFormRadio>
      <button type="reset">Reset radios</button>
      <button onClick={() => rerender((count) => count + 1)} type="button">
        Rerender radios
      </button>
    </form>
  );
}

export const NativeRadioFormReset: Story = {
  args: {
    children: undefined,
  },
  render: (args) => <NativeRadioResetExample onCheckedChange={args.onCheckedChange} />,
  play: async ({ args, canvas }) => {
    args.onCheckedChange?.mockClear();
    const one = canvas.getByRole("radio", { name: "One" });
    const two = canvas.getByRole("radio", { name: "Two" });

    await userEvent.click(two);
    await expect(one).not.toBeChecked();
    await expect(two).toBeChecked();

    await userEvent.click(canvas.getByRole("button", { name: "Reset radios" }));
    await waitFor(() => expect(one).toBeChecked());
    await expect(two).not.toBeChecked();
    await userEvent.click(canvas.getByRole("button", { name: "Rerender radios" }));
    await expect(one).toBeChecked();
    await expect(two).not.toBeChecked();

    const resetTwo = canvas.getByRole("radio", { name: "Two" });
    await userEvent.click(resetTwo);
    await expect(args.onCheckedChange).toHaveBeenCalledTimes(2);
    await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);
  },
};
