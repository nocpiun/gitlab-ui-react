import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent } from "storybook/test";
import GlFormField, {
  GlFormFieldGroup,
  GlFormFieldLabel,
} from "../form-field/form-field";
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
    onValueChange: fn(),
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
    <GlFormField aria-labelledby="food-select-label">
      <GlFormFieldLabel id="food-select-label" htmlFor="food-select">Food</GlFormFieldLabel>
      <GlFormSelect {...args} id="food-select">
        {foodItems}
      </GlFormSelect>
    </GlFormField>
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
    await expect(args.onValueChange).toHaveBeenLastCalledWith("Tacos");
    await expect(args.onChange).toHaveBeenCalled();
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
    <GlFormField aria-labelledby="truncated-select-label" style={{ maxWidth: 300 }}>
      <GlFormFieldLabel id="truncated-select-label" htmlFor="truncated-select">
        Food
      </GlFormFieldLabel>
      <GlFormSelect {...args} id="truncated-select">
        <GlFormSelectItem value="long">
          A form select option with a very looooooooong label
        </GlFormSelectItem>
      </GlFormSelect>
    </GlFormField>
  ),
};

export const GroupedItems: Story = {
  args: {
    defaultValue: "Pizza",
  },
  render: (args) => (
    <GlFormField aria-labelledby="grouped-select-label">
      <GlFormFieldLabel id="grouped-select-label" htmlFor="grouped-select">
        Food
      </GlFormFieldLabel>
      <GlFormSelect {...args} id="grouped-select">
        <GlFormSelectGroup label="Main dishes">
          <GlFormSelectItem value="Pizza">Pizza</GlFormSelectItem>
          <GlFormSelectItem value="Tacos">Tacos</GlFormSelectItem>
        </GlFormSelectGroup>
        <GlFormSelectGroup disabled label="Unavailable">
          <GlFormSelectItem value="Burger">Burger</GlFormSelectItem>
        </GlFormSelectGroup>
      </GlFormSelect>
    </GlFormField>
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
    await expect(args.onValueChange).toHaveBeenLastCalledWith(["Tacos", "Burger"]);
  },
};

function ControlledExample(args: GlFormSelectProps) {
  const [value, setValue] = useState("Tacos");

  return (
    <GlFormField aria-labelledby="controlled-select-label">
      <GlFormFieldLabel id="controlled-select-label" htmlFor="controlled-select">
        Food
      </GlFormFieldLabel>
      <GlFormSelect {...args} id="controlled-select" onValueChange={(nextValue) => {
        setValue(nextValue as string);
        args.onValueChange?.(nextValue);
      }} value={value}>
        {foodItems}
      </GlFormSelect>
      <p>Selected: {value}</p>
    </GlFormField>
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
    <GlFormFieldGroup>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((width) => (
        <GlFormField key={width} aria-labelledby={`select-width-${width}-label`}>
          <GlFormFieldLabel
            id={`select-width-${width}-label`}
            htmlFor={`select-width-${width}`}>
            {width}
          </GlFormFieldLabel>
          <GlFormSelect
            {...args}
            defaultValue={width}
            id={`select-width-${width}`}
            width={width}>
            <GlFormSelectItem value={width}>{width}</GlFormSelectItem>
          </GlFormSelect>
        </GlFormField>
      ))}
    </GlFormFieldGroup>
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
    <GlFormField aria-labelledby="responsive-select-label">
      <GlFormFieldLabel id="responsive-select-label" htmlFor="responsive-select">
        Responsive width
      </GlFormFieldLabel>
      <GlFormSelect
        {...args}
        defaultValue="Responsive"
        id="responsive-select"
        width={{ default: "md", md: "lg", lg: "xl" }}>
        <GlFormSelectItem value="Responsive">Responsive</GlFormSelectItem>
      </GlFormSelect>
    </GlFormField>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("combobox", { name: "Responsive width" }).parentElement)
      .toHaveClass("gl-form-select-md", "gl-md-form-select-lg", "gl-lg-form-select-xl");
  },
};
