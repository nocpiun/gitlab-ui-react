import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent } from "storybook/test";
import GlFormSelect, {
  GlFormSelectGroup,
  GlFormSelectItem,
  type GlFormSelectProps,
} from "./form-select";

const foodItems = (
  <>
    <GlFormSelectItem value="Pizza">Pizza</GlFormSelectItem>
    <GlFormSelectItem value="Tacos">Tacos</GlFormSelectItem>
    <GlFormSelectItem value="Burger">Burger</GlFormSelectItem>
  </>
);

const meta = {
  title: "UI/Base/Form Select",
  component: GlFormSelect,
  args: {
    defaultValue: "Pizza",
    disabled: false,
    onChange: fn(),
    onInput: fn(),
    state: null,
    width: null,
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
          "A native, compound React select styled to match [Pajamas Select](https://design.gitlab.com/components/select). Compose options with GlFormSelectItem and GlFormSelectGroup.",
      },
    },
  },
  render: (args) => (
    <div>
      <label htmlFor="food-select">Food</label>
      <GlFormSelect {...args} id="food-select">
        {foodItems}
      </GlFormSelect>
    </div>
  ),
} satisfies Meta<typeof GlFormSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas }) => {
    const select = canvas.getByRole("combobox", { name: "Food" });
    const wrapper = select.parentElement;

    await expect(select).toHaveClass("gl-form-select", "custom-select");
    await expect(select).toHaveValue("Pizza");
    await expect(wrapper).toHaveClass("gl-form-select-wrapper");
    await expect(getComputedStyle(select).appearance).toBe("none");
    await expect(getComputedStyle(select).width).toBe(getComputedStyle(wrapper!).width);

    await userEvent.selectOptions(select, "Tacos");

    await expect(select).toHaveValue("Tacos");
    await expect(args.onInput).toHaveBeenLastCalledWith("Tacos");
    await expect(args.onChange).toHaveBeenLastCalledWith("Tacos");
    await expect(args.onInput?.mock.invocationCallOrder.at(-1))
      .toBeLessThan(args.onChange?.mock.invocationCallOrder.at(-1) ?? -Infinity);
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("combobox", { name: "Food" })).toBeDisabled();
  },
};

export const ValidState: Story = {
  args: {
    state: true,
  },
  play: async ({ canvas }) => {
    const select = canvas.getByRole("combobox", { name: "Food" });

    await expect(select).toHaveClass("is-valid");
    await expect(select).not.toHaveAttribute("aria-invalid");
  },
};

export const InvalidState: Story = {
  args: {
    state: false,
  },
  play: async ({ canvas }) => {
    const select = canvas.getByRole("combobox", { name: "Food" });

    await expect(select).toHaveClass("is-invalid");
    await expect(select).toHaveAttribute("aria-invalid", "true");
  },
};

export const WithTruncation: Story = {
  args: {
    defaultValue: "long",
  },
  render: (args) => (
    <div style={{ maxWidth: 300 }}>
      <label htmlFor="truncated-select">Food</label>
      <GlFormSelect {...args} id="truncated-select">
        <GlFormSelectItem value="long">
          A form select option with a very looooooooong label
        </GlFormSelectItem>
      </GlFormSelect>
    </div>
  ),
};

export const GroupedItems: Story = {
  args: {
    defaultValue: "Pizza",
  },
  render: (args) => (
    <div>
      <label htmlFor="grouped-select">Food</label>
      <GlFormSelect {...args} id="grouped-select">
        <GlFormSelectGroup label="Main dishes">
          <GlFormSelectItem value="Pizza">Pizza</GlFormSelectItem>
          <GlFormSelectItem value="Tacos">Tacos</GlFormSelectItem>
        </GlFormSelectGroup>
        <GlFormSelectGroup disabled label="Unavailable">
          <GlFormSelectItem value="Burger">Burger</GlFormSelectItem>
        </GlFormSelectGroup>
      </GlFormSelect>
    </div>
  ),
  play: async ({ canvas }) => {
    const groups = canvas.getByRole("combobox", { name: "Food" }).querySelectorAll("optgroup");

    await expect(groups).toHaveLength(2);
    await expect(groups[0]).toHaveAttribute("label", "Main dishes");
    await expect(groups[1]).toBeDisabled();
  },
};

export const Multiple: Story = {
  args: {
    defaultValue: ["Pizza", "Burger"],
    multiple: true,
    size: 3,
  },
  play: async ({ args, canvas }) => {
    const select = canvas.getByRole("listbox", { name: "Food" });

    await expect(select).toHaveValue(["Pizza", "Burger"]);
    await userEvent.deselectOptions(select, "Pizza");
    await userEvent.selectOptions(select, "Tacos");

    await expect(select).toHaveValue(["Tacos", "Burger"]);
    await expect(args.onInput).toHaveBeenLastCalledWith(["Tacos", "Burger"]);
    await expect(args.onChange).toHaveBeenLastCalledWith(["Tacos", "Burger"]);
  },
};

function ControlledExample(args: GlFormSelectProps) {
  const [value, setValue] = useState("Tacos");

  return (
    <div>
      <label htmlFor="controlled-select">Food</label>
      <GlFormSelect {...args} id="controlled-select" onInput={(nextValue) => {
        setValue(nextValue as string);
        args.onInput?.(nextValue);
      }} value={value}>
        {foodItems}
      </GlFormSelect>
      <p>Selected: {value}</p>
    </div>
  );
}

export const Controlled: Story = {
  args: {
    defaultValue: undefined,
  },
  render: (args) => <ControlledExample {...args} />,
  play: async ({ canvas }) => {
    const select = canvas.getByRole("combobox", { name: "Food" });

    await expect(select).toHaveValue("Tacos");
    await userEvent.selectOptions(select, "Burger");
    await expect(select).toHaveValue("Burger");
    await expect(canvas.getByText("Selected: Burger")).toBeInTheDocument();
  },
};

export const Widths: Story = {
  args: {
    defaultValue: undefined,
  },
  render: (args) => (
    <div>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((width) => (
        <div className="gl-mb-4" key={width}>
          <label htmlFor={`select-width-${width}`}>{width}</label>
          <GlFormSelect
            {...args}
            defaultValue={width}
            id={`select-width-${width}`}
            width={width}>
            <GlFormSelectItem value={width}>{width}</GlFormSelectItem>
          </GlFormSelect>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("combobox", { name: "xs" }).parentElement)
      .toHaveClass("gl-form-select-xs");
    await expect(canvas.getByRole("combobox", { name: "xl" }).parentElement)
      .toHaveClass("gl-form-select-xl");
  },
};

export const ResponsiveWidths: Story = {
  args: {
    defaultValue: undefined,
    width: undefined,
  },
  render: (args) => (
    <div>
      <label htmlFor="responsive-select">Responsive width</label>
      <GlFormSelect
        {...args}
        defaultValue="Responsive"
        id="responsive-select"
        width={{ default: "md", md: "lg", lg: "xl" }}>
        <GlFormSelectItem value="Responsive">Responsive</GlFormSelectItem>
      </GlFormSelect>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("combobox", { name: "Responsive width" }).parentElement)
      .toHaveClass("gl-form-select-md", "gl-md-form-select-lg", "gl-lg-form-select-xl");
  },
};
