import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import GlFormCheckbox, { type GlFormCheckboxProps } from "./form-checkbox";
import GlFormCheckboxGroup from "./form-checkbox-group";

const meta = {
  title: "UI/Base/Form Checkbox",
  component: GlFormCheckbox,
  args: {
    children: "Option",
    onChange: fn(),
    onCheckedChange: fn(),
    onIndeterminateChange: fn(),
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
      <GlFormCheckbox {...args} value="checked-option" checked>Checked option</GlFormCheckbox>
      <GlFormCheckbox {...args} value="checked-disabled-option" checked disabled>Checked disabled option</GlFormCheckbox>
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
    children: "Checked option",
    defaultChecked: true,
    value: "checked-option",
  },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("checkbox", { name: "Checked option" });

    await expect(input).toBeChecked();

    await userEvent.click(input);
    await expect(input).not.toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenLastCalledWith(false);
    await expect(args.onChange).toHaveBeenCalled();

    await userEvent.click(input);
    await expect(input).toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);
  },
};

export const NativeValue: Story = {
  args: {
    children: "Native value",
    value: "bar",
  },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("checkbox", { name: "Native value" });
    await expect(input).not.toBeChecked();
    await expect(input).toHaveAttribute("value", "bar");

    await userEvent.click(input);
    await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);
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
    await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);
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

const groupOptions = [
  { value: "pizza", text: "Pizza" },
  { value: "tacos", text: "Tacos" },
  { value: "burger", text: "Burger", disabled: true },
];

export const CheckboxGroup: Story = {
  args: {
    children: undefined,
  },
  render: () => (
    <GlFormCheckboxGroup
      defaultValue={["slot-option"]}
      first={(
        <GlFormCheckbox help="Help text." value="slot-option">
          Slot option with help text
        </GlFormCheckbox>
      )}
      name="checkbox-group-name"
      options={groupOptions}>
      <GlFormCheckbox value="last-option">Last option</GlFormCheckbox>
    </GlFormCheckboxGroup>
  ),
  play: async ({ canvas }) => {
    const group = canvas.getByRole("group");
    await expect(group).toHaveClass("gl-form-checkbox-group");
    await expect(group).toHaveAttribute("tabindex", "-1");

    // The shared model checks the matching checkboxes from slots and options
    const slotOption = canvas.getByRole("checkbox", { name: /Slot option with help text/ });
    const pizza = canvas.getByRole("checkbox", { name: "Pizza" });
    const tacos = canvas.getByRole("checkbox", { name: "Tacos" });
    const burger = canvas.getByRole("checkbox", { name: "Burger" });
    const last = canvas.getByRole("checkbox", { name: "Last option" });

    await expect(slotOption).toBeChecked();
    await expect(pizza).not.toBeChecked();
    await expect(burger).toBeDisabled();

    // Every checkbox shares the group name
    for(const checkbox of [slotOption, pizza, tacos, burger, last]) {
      await expect(checkbox).toHaveAttribute("name", "checkbox-group-name");
    }

    // Checking adds the value to the shared model.
    await userEvent.click(tacos);
    await expect(tacos).toBeChecked();
    await expect(slotOption).toBeChecked();

    // Unchecking removes it again
    await userEvent.click(slotOption);
    await expect(slotOption).not.toBeChecked();
    await expect(tacos).toBeChecked();
  },
};

function ControlledGroupExample() {
  const [value, setValue] = useState<unknown[]>(["tacos"]);
  return (
    <div>
      <GlFormCheckboxGroup
        value={value}
        onValueChange={setValue}
        options={groupOptions} />
      <p>
        Selected:
        {" "}
        {value.map(String).join(", ")}
      </p>
    </div>
  );
}

export const ControlledCheckboxGroup: Story = {
  args: {
    children: undefined,
  },
  render: () => <ControlledGroupExample />,
  play: async ({ canvas }) => {
    const tacos = canvas.getByRole("checkbox", { name: "Tacos" });
    const pizza = canvas.getByRole("checkbox", { name: "Pizza" });

    await expect(tacos).toBeChecked();

    // Checkboxes toggle independently: the model accumulates values
    await userEvent.click(pizza);
    await expect(pizza).toBeChecked();
    await expect(tacos).toBeChecked();
    await expect(canvas.getByText("Selected: tacos, pizza")).toBeInTheDocument();

    await userEvent.click(tacos);
    await expect(tacos).not.toBeChecked();
    await expect(canvas.getByText("Selected: pizza")).toBeInTheDocument();
  },
};

export const GroupValidationStates: Story = {
  args: {
    children: undefined,
  },
  render: () => (
    <div>
      <GlFormCheckboxGroup
        name="valid-group"
        options={["one", "two"]}
        state />
      <GlFormCheckboxGroup
        name="invalid-group"
        options={["one", "two"]}
        state={false} />
    </div>
  ),
  play: async ({ canvas }) => {
    const [validGroup, invalidGroup] = canvas.getAllByRole("group");

    await expect(validGroup).not.toHaveAttribute("aria-invalid");
    await expect(invalidGroup).toHaveAttribute("aria-invalid", "true");

    for(const checkbox of canvas.getAllByRole("checkbox", { name: "one" })) {
      // The state class comes from the group, not the checkbox
      const isValid = checkbox.getAttribute("name") === "valid-group";
      await expect(checkbox).toHaveClass(isValid ? "is-valid" : "is-invalid");
    }
  },
};

export const GroupRequired: Story = {
  args: {
    children: undefined,
  },
  render: () => (
    <GlFormCheckboxGroup
      name="required-group"
      options={["one", "two"]}
      required />
  ),
  play: async ({ canvas }) => {
    const group = canvas.getByRole("group");
    await expect(group).toHaveAttribute("aria-required", "true");

    for(const checkbox of canvas.getAllByRole("checkbox")) {
      await expect(checkbox).toBeRequired();
      await expect(checkbox).toHaveAttribute("aria-required", "true");
    }
  },
};

function NativeCheckboxResetExample({
  onCheckedChange,
}: Pick<GlFormCheckboxProps, "onCheckedChange">) {
  const [, rerender] = useState(0);

  return (
    <form>
      <GlFormCheckbox
        defaultChecked
        name="standalone"
        onCheckedChange={onCheckedChange}
        value="yes">
        Standalone checkbox
      </GlFormCheckbox>
      <button type="reset">Reset checkbox</button>
      <button onClick={() => rerender((count) => count + 1)} type="button">
        Rerender checkbox
      </button>
    </form>
  );
}

export const NativeCheckboxFormReset: Story = {
  args: {
    children: undefined,
  },
  render: (args) => <NativeCheckboxResetExample onCheckedChange={args.onCheckedChange} />,
  play: async ({ args, canvas }) => {
    args.onCheckedChange?.mockClear();
    const checkbox = canvas.getByRole("checkbox", { name: "Standalone checkbox" });

    await userEvent.click(checkbox);
    await expect(checkbox).not.toBeChecked();
    await userEvent.click(canvas.getByRole("button", { name: "Reset checkbox" }));
    await waitFor(() => expect(checkbox).toBeChecked());
    await userEvent.click(canvas.getByRole("button", { name: "Rerender checkbox" }));
    await expect(checkbox).toBeChecked();

    const resetCheckbox = canvas.getByRole("checkbox", { name: "Standalone checkbox" });
    await userEvent.click(resetCheckbox);
    await expect(args.onCheckedChange).toHaveBeenCalledTimes(2);
    await expect(args.onCheckedChange).toHaveBeenLastCalledWith(false);
  },
};

const nativeCheckboxGroupValueChange = fn();

function NativeCheckboxGroupResetExample() {
  const [, rerender] = useState(0);

  return (
    <form>
      <GlFormCheckboxGroup
        defaultValue={["pizza"]}
        name="food"
        onValueChange={nativeCheckboxGroupValueChange}
        options={groupOptions} />
      <button type="reset">Reset checkbox group</button>
      <button onClick={() => rerender((count) => count + 1)} type="button">
        Rerender checkbox group
      </button>
    </form>
  );
}

export const NativeCheckboxGroupFormReset: Story = {
  args: {
    children: undefined,
  },
  render: () => <NativeCheckboxGroupResetExample />,
  play: async ({ canvas }) => {
    nativeCheckboxGroupValueChange.mockClear();
    const pizza = canvas.getByRole("checkbox", { name: "Pizza" });
    const tacos = canvas.getByRole("checkbox", { name: "Tacos" });

    await userEvent.click(pizza);
    await userEvent.click(tacos);
    await expect(pizza).not.toBeChecked();
    await expect(tacos).toBeChecked();

    await userEvent.click(canvas.getByRole("button", { name: "Reset checkbox group" }));
    await waitFor(() => expect(pizza).toBeChecked());
    await expect(tacos).not.toBeChecked();
    await userEvent.click(canvas.getByRole("button", { name: "Rerender checkbox group" }));
    await expect(pizza).toBeChecked();
    await expect(tacos).not.toBeChecked();

    const resetTacos = canvas.getByRole("checkbox", { name: "Tacos" });
    await expect(resetTacos).not.toBeDisabled();
    await expect(resetTacos).not.toBeChecked();
    await userEvent.click(resetTacos);
    await expect(resetTacos).toBeChecked();
    await expect(nativeCheckboxGroupValueChange)
      .toHaveBeenLastCalledWith(["pizza", "tacos"]);
  },
};
