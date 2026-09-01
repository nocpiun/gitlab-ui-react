import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import GlFormCheckbox, { type GlFormCheckboxProps } from "./form-checkbox";

const meta = {
  title: "UI/Base/Form Checkbox",
  component: GlFormCheckbox,
  args: {
    children: "Option",
    onChange: fn(),
    onIndeterminateChange: fn(),
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
          "See the [Pajamas checkbox documentation](https://design.gitlab.com/components/checkbox) for usage and implementation details.",
      },
    },
  },
} satisfies Meta<typeof GlFormCheckbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: undefined,
  },
  render: (args) => (
    <div>
      <GlFormCheckbox {...args} value="option">Option</GlFormCheckbox>
      <GlFormCheckbox {...args} value="slot-option" help="With help text.">Slot option</GlFormCheckbox>
      <GlFormCheckbox {...args} value="checked-option" checked="checked-option">Checked option</GlFormCheckbox>
      <GlFormCheckbox {...args} value="checked-disabled-option" checked="checked-disabled-option" disabled>Checked disabled option</GlFormCheckbox>
      <GlFormCheckbox {...args} value="disabled-option" disabled>Disabled option</GlFormCheckbox>
      <GlFormCheckbox {...args} value="disabled-option-with-help-text" disabled help="With help text.">Disabled option</GlFormCheckbox>
      <GlFormCheckbox {...args} value="indeterminate-option" indeterminate>Indeterminate option</GlFormCheckbox>
      <GlFormCheckbox {...args} value="indeterminate-disabled-option" indeterminate disabled>Indeterminate disabled option</GlFormCheckbox>
    </div>
  ),
  play: async ({ canvas }) => {
    const option = canvas.getByRole("checkbox", { name: "Option" });
    await expect(option).not.toBeChecked();
    await expect(option).toHaveClass("custom-control-input");

    await expect(canvas.getByRole("checkbox", { name: /Checked option/ })).toBeChecked();
    await expect(canvas.getByRole("checkbox", { name: /Checked disabled option/ })).toBeChecked();
    await expect(canvas.getByRole("checkbox", { name: /Checked disabled option/ })).toBeDisabled();
    await expect(canvas.getByRole("checkbox", { name: "Disabled option" })).toBeDisabled();

    await waitFor(() => expect(
      canvas.getByRole("checkbox", { name: "Indeterminate option" }),
    ).toHaveProperty("indeterminate", true));
    await waitFor(() => expect(
      canvas.getByRole("checkbox", { name: "Indeterminate disabled option" }),
    ).toHaveProperty("indeterminate", true));

    // The help text is rendered inside the label
    const helpTexts = canvas.getAllByText("With help text.");
    await expect(helpTexts).toHaveLength(2);
    await expect(helpTexts[0]).toHaveClass("help-text");
    const helpLabel = helpTexts[0].parentElement!;
    await expect(helpLabel).toHaveClass("custom-control-label");
    await expect(getComputedStyle(helpLabel).display).toBe("inline-block");

    // The shared custom-control foundation: the GitLab padding override wins
    // over the scoped Bootstrap base, and the box carries
    // `$custom-forms-transition`.
    const wrapper = option.closest(".gl-form-checkbox")!;
    await expect(getComputedStyle(wrapper).paddingLeft).toBe("16px");
    await expect(getComputedStyle(wrapper).minHeight).toBe("24px");
    const indicator = getComputedStyle(helpLabel, "::before");
    await expect(indicator.transitionProperty).toBe("background-color, border-color, box-shadow");
    await expect(indicator.transitionDuration).toBe("0.15s, 0.15s, 0.15s");
    await expect(indicator.transitionTimingFunction).toBe("ease-in-out, ease-in-out, ease-in-out");
  },
};

export const SingleCheckbox: Story = {
  args: {
    checked: "checked-option",
    children: "Checked option",
    value: "checked-option",
  },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("checkbox", { name: "Checked option" });

    await expect(input).toBeChecked();

    // Without a listener updating the `checked` prop, the internal state
    // toggles and the callbacks receive the new value, like upstream.
    await userEvent.click(input);
    await expect(input).not.toBeChecked();
    await expect(args.onInput).toHaveBeenLastCalledWith(false);
    await expect(args.onChange).toHaveBeenLastCalledWith(false);

    await userEvent.click(input);
    await expect(input).toBeChecked();
    await expect(args.onInput).toHaveBeenLastCalledWith("checked-option");
    await expect(args.onChange).toHaveBeenLastCalledWith("checked-option");
  },
};

export const CustomValues: Story = {
  args: {
    checked: "foo",
    children: "Custom values",
    uncheckedValue: "foo",
    value: "bar",
  },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("checkbox", { name: "Custom values" });

    // checked="foo" does not match value="bar", so the box starts unchecked
    await expect(input).not.toBeChecked();

    await userEvent.click(input);
    await expect(args.onChange).toHaveBeenLastCalledWith("bar");

    await userEvent.click(input);
    await expect(args.onChange).toHaveBeenLastCalledWith("foo");
  },
};

function ArrayValueExample(args: GlFormCheckboxProps) {
  const [checked, setChecked] = useState<unknown[]>(["foo"]);
  const handleInput = (value: unknown) => {
    args.onInput?.(value);
    setChecked(value as unknown[]);
  };
  return (
    <div>
      <GlFormCheckbox
        {...args}
        checked={checked}
        onInput={handleInput}
        value="foo">
        Foo
      </GlFormCheckbox>
      <GlFormCheckbox
        {...args}
        checked={checked}
        onInput={handleInput}
        value="bar">
        Bar
      </GlFormCheckbox>
    </div>
  );
}

export const ArrayValue: Story = {
  args: {
    children: undefined,
  },
  render: (args) => <ArrayValueExample {...args} />,
  play: async ({ args, canvas }) => {
    const foo = canvas.getByRole("checkbox", { name: "Foo" });
    const bar = canvas.getByRole("checkbox", { name: "Bar" });

    await expect(foo).toBeChecked();
    await expect(bar).not.toBeChecked();

    // Checking adds the value to the model array
    await userEvent.click(bar);
    await expect(args.onInput).toHaveBeenLastCalledWith(["foo", "bar"]);
    await expect(args.onChange).toHaveBeenLastCalledWith(["foo", "bar"]);
    await expect(bar).toBeChecked();

    // Unchecking removes it again
    await userEvent.click(bar);
    await expect(args.onInput).toHaveBeenLastCalledWith(["foo"]);
    await expect(bar).not.toBeChecked();
  },
};

export const Indeterminate: Story = {
  args: {
    children: "Indeterminate option",
    indeterminate: true,
    value: "indeterminate-option",
  },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("checkbox", { name: "Indeterminate option" });

    await waitFor(() => expect(input).toHaveProperty("indeterminate", true));

    // User interaction clears the indeterminate flag and checks the box
    await userEvent.click(input);
    await expect(input).toHaveProperty("indeterminate", false);
    await expect(input).toBeChecked();
    await expect(args.onIndeterminateChange).toHaveBeenLastCalledWith(false);
    await expect(args.onChange).toHaveBeenLastCalledWith("indeterminate-option");
  },
};

export const ValidationStates: Story = {
  args: {
    children: undefined,
  },
  render: (args) => (
    <div>
      <GlFormCheckbox {...args} value="valid-option" state>Valid option</GlFormCheckbox>
      <GlFormCheckbox {...args} value="invalid-option" state={false}>Invalid option</GlFormCheckbox>
    </div>
  ),
  play: async ({ canvas }) => {
    const valid = canvas.getByRole("checkbox", { name: "Valid option" });
    const invalid = canvas.getByRole("checkbox", { name: "Invalid option" });

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
    const input = canvas.getByRole("checkbox", { name: "Required option" });

    await expect(input).toBeRequired();
    await expect(input).toHaveAttribute("aria-required", "true");
    await expect(input).toHaveAttribute("name", "required-option");
  },
};
