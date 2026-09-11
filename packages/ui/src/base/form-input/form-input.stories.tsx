import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ComponentProps } from "react";
import { expect, fireEvent, fn, userEvent, waitFor } from "storybook/test";
import GlFormInput from "./form-input";

function ControlledInput(args: ComponentProps<typeof GlFormInput>) {
  const [value, setValue] = useState(args.value ?? args.defaultValue ?? "");

  return (
    <GlFormInput
      {...args}
      value={value}
      onValueChange={(nextValue) => {
        setValue(nextValue);
        args.onValueChange?.(nextValue);
      }} />
  );
}

function ResettableDebouncedInput(args: ComponentProps<typeof GlFormInput>) {
  const [value, setValue] = useState("Committed value");

  return (
    <div>
      <GlFormInput {...args} value={value} />
      <button
        type="button"
        onClick={() => setValue("External reset")}
        onMouseDown={(event) => event.preventDefault()}>
        Reset externally
      </button>
    </div>
  );
}

const meta = {
  title: "UI/Base/Form Input",
  component: GlFormInput,
  args: {
    id: "input-id",
    onBlur: fn(),
    onChange: fn(),
    onValueChange: fn(),
    placeholder: "Placeholder",
    type: "text",
    defaultValue: "some text",
  },
  argTypes: {
    state: {
      control: "select",
      options: [null, true, false],
    },
    type: {
      control: "select",
      options: [
        "text", "password", "email", "number", "url", "tel", "search", "range", "color",
        "date", "time", "datetime", "datetime-local", "month", "week",
      ],
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
          "See the [Pajamas text input documentation](https://design.gitlab.com/components/text-input) for usage and implementation details.",
      },
    },
  },
} satisfies Meta<typeof GlFormInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("textbox");

    await expect(input).toHaveValue("some text");
    await expect(input).toHaveClass("gl-form-input", "form-control");
    await expect(getComputedStyle(input).display).toBe("block");
    // Upstream `$input-transition`: the same ease-in-out curve on the way in
    // and out, before and after focus.
    await expect(getComputedStyle(input).transitionProperty).toBe("border-color, box-shadow");
    await expect(getComputedStyle(input).transitionDuration).toBe("0.15s, 0.15s");
    await expect(getComputedStyle(input).transitionTimingFunction).toBe("ease-in-out, ease-in-out");

    await userEvent.clear(input);
    await expect(getComputedStyle(input).transitionTimingFunction).toBe("ease-in-out, ease-in-out");
    await userEvent.type(input, "foo");

    await expect(args.onValueChange).toHaveBeenLastCalledWith("foo");
    await expect(args.onChange).toHaveBeenCalled();
    await expect(input).toHaveValue("foo");
  },
};

export const NativeFormReset: Story = {
  args: {
    debounce: 500,
    defaultValue: "Default value",
    value: undefined,
  },
  render: (args) => (
    <form>
      <GlFormInput {...args} />
      <button type="reset" onMouseDown={(event) => event.preventDefault()}>
        Reset form
      </button>
    </form>
  ),
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("textbox");
    args.onValueChange!.mockClear();

    await userEvent.clear(input);
    await userEvent.type(input, "Edited value");
    await expect(input).toHaveValue("Edited value");
    await expect(args.onValueChange).not.toHaveBeenCalled();

    await userEvent.click(canvas.getByRole("button", { name: "Reset form" }));
    await expect(input).toHaveValue("Default value");

    await new Promise((resolve) => setTimeout(resolve, 600));
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

export const Controlled: Story = {
  args: {
    defaultValue: undefined,
    value: "Controlled value",
  },
  render: (args) => <ControlledInput {...args} />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox");

    await userEvent.type(input, " updated");
    await expect(input).toHaveValue("Controlled value updated");
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox")).toBeDisabled();
  },
};

export const Readonly: Story = {
  args: {
    readOnly: true,
    value: "readonly text",
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox");

    await expect(input).toHaveAttribute("readonly");
    await expect(input).not.toBeDisabled();
  },
};

export const Plaintext: Story = {
  args: {
    plaintext: true,
    value: "plaintext",
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox");

    await expect(input).toHaveClass("gl-form-input", "form-control-plaintext");
    await expect(input).not.toHaveClass("form-control");
    await expect(input).toHaveAttribute("readonly");
  },
};

export const Valid: Story = {
  args: {
    state: true,
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox");

    await expect(input).toHaveClass("is-valid");
    await expect(input).not.toHaveAttribute("aria-invalid");
  },
};

export const Invalid: Story = {
  args: {
    state: false,
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox");

    await expect(input).toHaveClass("is-invalid");
    await expect(input).toHaveAttribute("aria-invalid", "true");
  },
};

export const NumberInput: Story = {
  args: {
    type: "number",
    value: 42,
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("spinbutton");

    await expect(input).toHaveValue(42);

    // A focused number input blurs on wheel so the value cannot change
    // accidentally.
    await userEvent.click(input);
    await expect(input).toHaveFocus();
    await fireEvent.wheel(input, { deltaY: 33.33 });
    await expect(input).not.toHaveFocus();
  },
};

export const Range: Story = {
  args: {
    type: "range",
    value: 50,
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("slider");

    await expect(input).toHaveClass("gl-form-input", "custom-range");
    await expect(input).not.toHaveClass("form-control");

    // The Bootstrap `.custom-range` foundation on the host element. (Thumb
    // and track pseudo-elements are covered by the styles package structural
    // tests; headless Chromium does not resolve them via getComputedStyle.
    // The 1.4rem height is compared with an epsilon because Chromium rounds
    // fractional rem values.)
    const computed = getComputedStyle(input);
    const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    await expect(computed.display).toBe("block");
    await expect(computed.padding).toBe("0px");
    await expect(computed.appearance).toBe("none");
    await expect(Math.abs(Number.parseFloat(computed.height) - 1.4 * rem)).toBeLessThan(0.5);
  },
};

export const Widths: Story = {
  args: {
    id: undefined,
    value: "",
  },
  render: (args) => (
    <div>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((width) => (
        <div key={width} className="gl-mb-4">
          <label htmlFor={`width-${width}`}>{width}</label>
          <GlFormInput {...args} id={`width-${width}`} value={width} width={width} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByDisplayValue("xs")).toHaveClass("gl-form-input-xs");
    await expect(canvas.getByDisplayValue("xl")).toHaveClass("gl-form-input-xl");
  },
};

export const ResponsiveWidths: Story = {
  args: {
    id: undefined,
    value: "",
    width: undefined,
  },
  render: (args) => (
    <div>
      <div className="gl-mb-4">
        <label htmlFor="responsive-widths-1">With default key</label>
        <GlFormInput
          {...args}
          id="responsive-widths-1"
          value="With `default` key"
          width={{ default: "md", md: "lg", lg: "xl" }} />
      </div>
      <div>
        <label htmlFor="responsive-widths-2">Without default</label>
        <GlFormInput
          {...args}
          id="responsive-widths-2"
          value="Without `default` key"
          width={{ md: "lg", lg: "xl" }} />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const withDefault = canvas.getByDisplayValue("With `default` key");
    const withoutDefault = canvas.getByDisplayValue("Without `default` key");

    await expect(withDefault).toHaveClass("gl-form-input-md", "gl-md-form-input-lg", "gl-lg-form-input-xl");
    await expect(withoutDefault).toHaveClass("gl-md-form-input-lg", "gl-lg-form-input-xl");
    await expect(withoutDefault).not.toHaveClass("gl-form-input-md");
  },
};

export const Debounce: Story = {
  args: {
    debounce: 50,
    defaultValue: undefined,
    value: "",
  },
  render: (args) => <ControlledInput {...args} />,
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("textbox");

    await userEvent.type(input, "ab");

    await expect(input).toHaveValue("ab");
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await waitFor(() => expect(args.onValueChange).toHaveBeenCalledTimes(1));
    await expect(args.onValueChange).toHaveBeenLastCalledWith("ab");
  },
};

export const Lazy: Story = {
  args: {
    defaultValue: undefined,
    lazy: true,
    value: "",
  },
  render: (args) => <ControlledInput {...args} />,
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("textbox");

    await userEvent.type(input, "ab");

    await expect(input).toHaveValue("ab");
    await expect(args.onChange).toHaveBeenCalledTimes(2);
    await expect(args.onValueChange).not.toHaveBeenCalled();

    // Lazy value changes are committed on blur.
    await userEvent.tab();
    await expect(args.onValueChange).toHaveBeenCalledWith("ab");
  },
};

export const ControlledLazyRejectedUpdate: Story = {
  args: {
    defaultValue: undefined,
    lazy: true,
    value: "",
  },
  render: (args) => <GlFormInput {...args} />,
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("textbox");

    await userEvent.type(input, "draft");
    await expect(input).toHaveValue("draft");

    await userEvent.tab();
    await expect(args.onValueChange).toHaveBeenLastCalledWith("draft");
    await expect(input).toHaveValue("");
  },
};

export const ControlledDebounceExternalReset: Story = {
  args: {
    debounce: 500,
    defaultValue: undefined,
    value: "",
  },
  render: (args) => <ResettableDebouncedInput {...args} />,
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("textbox");
    const reset = canvas.getByRole("button", { name: "Reset externally" });
    args.onValueChange!.mockClear();

    await userEvent.type(input, " draft");
    await expect(input).toHaveValue("Committed value draft");

    await userEvent.click(reset);
    await expect(input).toHaveValue("External reset");

    await new Promise((resolve) => setTimeout(resolve, 600));
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

export const Formatter: Story = {
  args: {
    formatter: (value: string) => value.toLowerCase(),
    defaultValue: "",
  },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("textbox");

    await userEvent.type(input, "AB");

    await expect(args.onValueChange).toHaveBeenLastCalledWith("ab");
    await expect(input).toHaveValue("ab");
  },
};

export const LazyFormatter: Story = {
  args: {
    formatter: (value: string) => value.toLowerCase(),
    lazyFormatter: true,
    defaultValue: "",
  },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("textbox");

    await userEvent.type(input, "AB");

    // The formatter is not applied per keystroke…
    await expect(input).toHaveValue("AB");

    // …but applies on blur.
    await userEvent.tab();
    await expect(input).toHaveValue("ab");
    await expect(args.onValueChange).toHaveBeenLastCalledWith("ab");
  },
};

export const NumberModifier: Story = {
  args: {
    number: true,
    defaultValue: "",
  },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("textbox");

    await userEvent.type(input, "123.450");

    // The model event carries a native number: emitted for 1, 12, 123, 123.4,
    // 123.45 ("123." and "123.450" are numerically unchanged and skipped).
    await expect(args.onValueChange).toHaveBeenLastCalledWith(123.45);
    await expect(args.onValueChange).toHaveBeenCalledTimes(5);
    await expect(input).toHaveValue("123.450");

    // Typing another trailing zero updates the raw value but not the model.
    await userEvent.type(input, "0");

    await expect(args.onValueChange).toHaveBeenCalledTimes(5);
    await expect(input).toHaveValue("123.4500");
  },
};

export const ControlledNumberModifier: Story = {
  args: {
    defaultValue: undefined,
    number: true,
    value: 1,
  },
  render: (args) => <ControlledInput {...args} />,
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("textbox");

    await userEvent.type(input, ".");
    await expect(input).toHaveValue("1.");
    await expect(args.onValueChange).not.toHaveBeenCalled();

    await userEvent.type(input, "5");
    await expect(args.onValueChange).toHaveBeenLastCalledWith(1.5);
    await expect(input).toHaveValue("1.5");

    args.onValueChange!.mockClear();
    await userEvent.type(input, "0");
    await expect(input).toHaveValue("1.50");
    await expect(args.onValueChange).not.toHaveBeenCalled();

    await userEvent.tab();
    await expect(input).toHaveValue("1.5");
  },
};

export const ControlledNumberModifierRejectedUpdate: Story = {
  args: {
    defaultValue: undefined,
    number: true,
    value: 1,
  },
  render: (args) => <GlFormInput {...args} />,
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("textbox");

    await userEvent.type(input, ".");
    await expect(input).toHaveValue("1.");

    await userEvent.type(input, "5");
    await expect(args.onValueChange).toHaveBeenLastCalledWith(1.5);
    await expect(input).toHaveValue("1");
  },
};

export const Trim: Story = {
  args: {
    trim: true,
    defaultValue: "",
  },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("textbox");

    await userEvent.type(input, " a ");

    await expect(args.onValueChange).toHaveBeenLastCalledWith("a");
    await expect(input).toHaveValue(" a ");
  },
};

export const ControlledTrim: Story = {
  args: {
    defaultValue: undefined,
    trim: true,
    value: "hello",
  },
  render: (args) => <ControlledInput {...args} />,
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("textbox");

    await userEvent.type(input, " ");
    await expect(input).toHaveValue("hello ");
    await expect(args.onValueChange).not.toHaveBeenCalled();

    await userEvent.type(input, "world");
    await expect(input).toHaveValue("hello world");
    await expect(args.onValueChange).toHaveBeenLastCalledWith("hello world");
  },
};

export const Autofocus: Story = {
  args: {
    autoFocus: true,
    defaultValue: "",
  },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByRole("textbox")).toHaveFocus());
  },
};
