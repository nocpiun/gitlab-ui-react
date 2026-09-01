import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import GlFormSelect from "./form-select";

const options = [
  { value: "Pizza", text: "Pizza" },
  { value: "Tacos", text: "Tacos" },
  { value: "Burger", text: "Burger" },
];

const meta = {
  title: "UI/Base/Form Select",
  component: GlFormSelect,
  args: {
    id: "select-id",
    onChange: fn(),
    onInput: fn(),
    options,
    value: "Pizza",
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
} satisfies Meta<typeof GlFormSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas }) => {
    const select = canvas.getByRole("combobox");

    await expect(select).toHaveClass("gl-form-select", "custom-select");
    await expect(select).toHaveValue("0");
    await expect(select).toHaveDisplayValue("Pizza");

    await userEvent.selectOptions(select, "Tacos");

    // `onInput` is the model event; `onChange` fires with the same value.
    await expect(args.onInput).toHaveBeenLastCalledWith("Tacos");
    await expect(args.onChange).toHaveBeenLastCalledWith("Tacos");
    await expect(select).toHaveDisplayValue("Tacos");
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

export const ValidState: Story = {
  args: {
    state: true,
  },
  play: async ({ canvas }) => {
    const select = canvas.getByRole("combobox");

    await expect(select).toHaveClass("is-valid");
    await expect(select).not.toHaveAttribute("aria-invalid");
  },
};

export const InvalidState: Story = {
  args: {
    state: false,
  },
  play: async ({ canvas }) => {
    const select = canvas.getByRole("combobox");

    await expect(select).toHaveClass("is-invalid");
    await expect(select).toHaveAttribute("aria-invalid", "true");
  },
};

export const Multiple: Story = {
  args: {
    multiple: true,
    selectSize: 3,
    value: ["Pizza", "Burger"],
  },
  play: async ({ args, canvas }) => {
    const select = canvas.getByRole("listbox");

    await expect(select).toHaveAttribute("multiple");
    await expect(canvas.getByRole("option", { name: "Pizza" })).toHaveProperty("selected", true);
    await expect(canvas.getByRole("option", { name: "Tacos" })).toHaveProperty("selected", false);
    await expect(canvas.getByRole("option", { name: "Burger" })).toHaveProperty("selected", true);

    await userEvent.selectOptions(select, "Tacos");

    // The model value is an array of the selected option values.
    await expect(args.onInput).toHaveBeenLastCalledWith(["Pizza", "Tacos", "Burger"]);
  },
};

export const OptionGroups: Story = {
  args: {
    options: [
      { label: "Meals", options: [{ value: "Pizza", text: "Pizza" }, { value: "Tacos", text: "Tacos" }] },
      { label: "Sides", options: [{ value: "Fries", text: "Fries" }] },
    ],
    value: "Fries",
  },
  play: async ({ canvas }) => {
    const select = canvas.getByRole("combobox");
    const groups = canvas.getAllByRole("group");

    await expect(groups).toHaveLength(2);
    await expect(groups[0]).toHaveAttribute("label", "Meals");
    await expect(select).toHaveDisplayValue("Fries");
  },
};

export const WithTruncation: Story = {
  args: {
    options: [{ value: 1, text: "A form select option with a very looooooooong label" }],
    value: 1,
  },
  decorators: [
    (story) => <div style={{ maxWidth: "300px" }}>{story()}</div>,
  ],
  play: async ({ canvas }) => {
    // Non-string option values are matched by their original type.
    await expect(canvas.getByRole("combobox"))
      .toHaveDisplayValue("A form select option with a very looooooooong label");
  },
};

export const Widths: Story = {
  args: {
    id: undefined,
  },
  render: (args) => (
    <div>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((width) => (
        <div key={width} className="gl-mb-4 gl-space-x-4">
          <label htmlFor={`width-${width}`}>{width}</label>
          <GlFormSelect
            {...args}
            id={`width-${width}`}
            options={[{ value: width, text: width }]}
            value={width}
            width={width} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByDisplayValue("xs").parentElement).toHaveClass("gl-form-select-xs");
    await expect(canvas.getByDisplayValue("xl").parentElement).toHaveClass("gl-form-select-xl");
  },
};
