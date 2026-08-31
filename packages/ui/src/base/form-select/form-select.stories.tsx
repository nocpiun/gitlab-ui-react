import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent } from "storybook/test";
import GlFormSelect, {
  type GlFormSelectOption,
  type GlFormSelectProps,
} from "./form-select";

const defaultOptions: GlFormSelectOption[] = [
  { value: "Pizza", text: "Pizza" },
  { value: "Tacos", text: "Tacos" },
  { value: "Burger", text: "Burger", disabled: true },
];

const meta = {
  title: "UI/Base/Form Select",
  component: GlFormSelect,
  args: {
    id: "select-id",
    options: defaultOptions,
    value: "Pizza",
    onChange: fn(),
    onInput: fn(),
  },
  argTypes: {
    state: {
      control: "select",
      options: [null, true, false],
    },
    width: {
      control: "select",
      options: [null, "xs", "sm", "md", "lg", "xl"],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas select documentation](https://design.gitlab.com/components/select) for usage and implementation details.",
      },
    },
  },
  render: (args) => (
    <div>
      <label htmlFor={args.id}>Label</label>
      <GlFormSelect {...args} />
    </div>
  ),
} satisfies Meta<typeof GlFormSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas }) => {
    const select = canvas.getByRole("combobox");

    await expect(select).toHaveClass("gl-form-select", "custom-select");
    await expect(select).toHaveValue("Pizza");
    await expect(canvas.getByRole("option", { name: "Burger" })).toBeDisabled();

    // A user selection updates the model and emits input then change
    await userEvent.selectOptions(select, "Tacos");
    await expect(select).toHaveValue("Tacos");
    await expect(args.onInput).toHaveBeenLastCalledWith("Tacos");
    await expect(args.onChange).toHaveBeenLastCalledWith("Tacos");
    const inputCall = args.onInput.mock.invocationCallOrder.at(-1);
    const changeCall = args.onChange.mock.invocationCallOrder.at(-1);
    expect(inputCall).toBeLessThan(changeCall);
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("combobox")).toBeDisabled();
  },
};

export const ValidationStates: Story = {
  render: (args) => (
    <div>
      <GlFormSelect {...args} id="valid-select" state />
      <GlFormSelect {...args} id="invalid-select" state={false} />
    </div>
  ),
  play: async ({ canvas }) => {
    const [validSelect, invalidSelect] = canvas.getAllByRole("combobox");

    await expect(validSelect).toHaveClass("is-valid");
    await expect(validSelect).not.toHaveAttribute("aria-invalid");
    await expect(invalidSelect).toHaveClass("is-invalid");
    await expect(invalidSelect).toHaveAttribute("aria-invalid", "true");
  },
};

export const Multiple: Story = {
  args: {
    multiple: true,
    options: [
      { value: "Pizza", text: "Pizza" },
      { value: "Tacos", text: "Tacos" },
      { value: "Burger", text: "Burger" },
    ],
    selectSize: 3,
    value: ["Pizza"],
  },
  play: async ({ args, canvas }) => {
    const listbox = canvas.getByRole("listbox");

    await expect(listbox).toHaveAttribute("multiple");
    await expect(listbox).toHaveAttribute("size", "3");

    await userEvent.selectOptions(listbox, "Burger");
    await expect(args.onInput).toHaveBeenLastCalledWith(["Pizza", "Burger"]);
    await expect(args.onChange).toHaveBeenLastCalledWith(["Pizza", "Burger"]);
  },
};

export const OptionGroups: Story = {
  args: {
    options: [
      {
        label: "Food",
        options: [
          { value: "Pizza", text: "Pizza" },
          { value: "Tacos", text: "Tacos" },
        ],
      },
      {
        label: "Drinks",
        options: [{ value: "Soda", text: "Soda" }],
      },
    ],
    value: "Soda",
  },
  play: async ({ canvas }) => {
    const select = canvas.getByRole("combobox");

    await expect(select).toHaveValue("Soda");
    await expect(select.querySelector("optgroup[label='Food']")).not.toBeNull();
    await expect(select.querySelector("optgroup[label='Drinks']")).not.toBeNull();
  },
};

export const TypedValues: Story = {
  args: {
    options: [
      { value: 1, text: "One" },
      { value: 2, text: "Two" },
    ],
    value: 2,
  },
  play: async ({ args, canvas }) => {
    const select = canvas.getByRole("combobox");

    await expect(select).toHaveValue("2");

    // The emitted model value keeps its original type
    await userEvent.selectOptions(select, "1");
    await expect(args.onInput).toHaveBeenLastCalledWith(1);
    await expect(args.onChange).toHaveBeenLastCalledWith(1);
  },
};

export const HtmlOption: Story = {
  args: {
    options: [
      { value: "html", text: "fallback", html: "<strong>HTML</strong> option" },
      { value: "plain", text: "Plain option" },
    ],
    value: "plain",
  },
  play: async ({ canvas }) => {
    // The html option is rendered as raw markup (upstream's innerHTML), the
    // text fallback is not rendered
    const option = canvas.getByRole("option", { name: "HTML option" });
    await expect(option.querySelector("strong")).not.toBeNull();
    await expect(canvas.queryByText("fallback")).not.toBeInTheDocument();
  },
};

function ControlledSelectExample(args: GlFormSelectProps) {
  const [value, setValue] = useState<unknown>("tacos");
  return (
    <div>
      <GlFormSelect {...args} value={value} onInput={setValue} />
      <p>
        Selected:
        {" "}
        {String(value)}
      </p>
    </div>
  );
}

export const Controlled: Story = {
  args: {
    options: [
      { value: "pizza", text: "Pizza" },
      { value: "tacos", text: "Tacos" },
    ],
  },
  render: (args) => <ControlledSelectExample {...args} />,
  play: async ({ canvas }) => {
    const select = canvas.getByRole("combobox");

    await expect(select).toHaveValue("tacos");

    await userEvent.selectOptions(select, "pizza");
    await expect(select).toHaveValue("pizza");
    await expect(canvas.getByText("Selected: pizza")).toBeInTheDocument();
  },
};

export const WithTruncation: Story = {
  args: {
    options: [{ value: 1, text: "A form select option with a very looooooooong label" }],
    value: 1,
  },
  render: (args) => (
    <div style={{ maxWidth: "300px" }}>
      <GlFormSelect {...args} />
    </div>
  ),
};

export const Widths: Story = {
  render: (args) => (
    <div>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((width) => (
        <div key={width} style={{ marginBottom: "0.5rem" }}>
          <label htmlFor={`width-${width}`}>{width}</label>
          <GlFormSelect {...args} id={`width-${width}`} width={width} value={width}
            options={[{ value: width, text: width }]} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    for(const width of ["xs", "sm", "md", "lg", "xl"]) {
      const wrapper = canvas.getByRole("combobox", { name: width }).closest("span");
      await expect(wrapper).toHaveClass("gl-form-select-wrapper", `gl-form-select-${width}`);
    }
  },
};
