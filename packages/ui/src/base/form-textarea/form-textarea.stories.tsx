import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ComponentProps } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import GlFormTextarea from "./form-textarea";

const remainingCountText = (count: number) => (
  count === 1 ? `${count} character remaining.` : `${count} characters remaining.`
);
const overLimitText = (count: number) => (
  count === 1 ? `${count} character over limit.` : `${count} characters over limit.`
);

const meta = {
  title: "UI/Base/Form Textarea",
  component: GlFormTextarea,
  args: {
    id: "textarea-id",
    onBlur: fn(),
    onChange: fn(),
    onInput: fn(),
    onSubmit: fn(),
    onUpdate: fn(),
    placeholder: "Placeholder",
    value: "some text",
  },
  argTypes: {
    state: {
      control: "select",
      options: [null, true, false],
    },
    size: {
      control: "select",
      options: [undefined, "sm", "lg"],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas textarea documentation](https://design.gitlab.com/components/textarea) for usage and implementation details.",
      },
    },
  },
} satisfies Meta<typeof GlFormTextarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas }) => {
    const textarea = canvas.getByRole("textbox");

    await expect(textarea).toHaveValue("some text");
    await expect(textarea).toHaveClass("gl-form-input", "gl-form-textarea", "form-control");
    // `noResize` is true by default
    await expect(textarea).toHaveStyle({ resize: "none" });

    await userEvent.clear(textarea);
    await userEvent.type(textarea, "foo");

    // `onUpdate` fires immediately per keystroke, `onInput` is the model event.
    await expect(args.onUpdate).toHaveBeenLastCalledWith("foo");
    await expect(args.onInput).toHaveBeenLastCalledWith("foo");
    await expect(textarea).toHaveValue("foo");
  },
};

export const States: Story = {
  args: {
    id: undefined,
  },
  render: (args) => (
    <div>
      {([
        ["valid", { state: true }],
        ["invalid", { state: false }],
        ["disabled", { disabled: true }],
        ["readonly", { readOnly: true }],
      ] as const).map(([label, props]) => (
        <div key={label} className="gl-mb-4">
          <label htmlFor={`state-${label}`}>{label}</label>
          <GlFormTextarea {...args} {...props} id={`state-${label}`} value={label} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const valid = canvas.getByDisplayValue("valid");
    const invalid = canvas.getByDisplayValue("invalid");
    const disabled = canvas.getByDisplayValue("disabled");
    const readonly = canvas.getByDisplayValue("readonly");

    await expect(valid).toHaveClass("is-valid");
    await expect(valid).not.toHaveAttribute("aria-invalid");

    await expect(invalid).toHaveClass("is-invalid");
    await expect(invalid).toHaveAttribute("aria-invalid", "true");

    await expect(disabled).toBeDisabled();

    await expect(readonly).toHaveAttribute("readonly");
    await expect(readonly).not.toBeDisabled();
  },
};

export const Debounce: Story = {
  args: {
    debounce: 50,
    value: "",
  },
  play: async ({ args, canvas }) => {
    const textarea = canvas.getByRole("textbox");

    await userEvent.type(textarea, "ab");

    // `onUpdate` is synchronous; the model event fires after the delay.
    await expect(args.onUpdate).toHaveBeenCalledTimes(2);
    await expect(args.onInput).not.toHaveBeenCalled();
    await waitFor(() => expect(args.onInput).toHaveBeenCalledTimes(1));
    await expect(args.onInput).toHaveBeenLastCalledWith("ab");

    // The model update is flushed on the native change event (on blur).
    await userEvent.type(textarea, "c");
    await userEvent.tab();
    await expect(args.onChange).toHaveBeenLastCalledWith("abc");
    await expect(args.onInput).toHaveBeenLastCalledWith("abc");
  },
};

export const Formatter: Story = {
  args: {
    formatter: (value: string) => value.toLowerCase(),
    value: "",
  },
  play: async ({ args, canvas }) => {
    const textarea = canvas.getByRole("textbox");

    await userEvent.type(textarea, "AB");

    await expect(args.onUpdate).toHaveBeenLastCalledWith("ab");
    await expect(args.onInput).toHaveBeenLastCalledWith("ab");
    await expect(textarea).toHaveValue("ab");
  },
};

export const SubmitOnEnter: Story = {
  args: {
    submitOnEnter: true,
    value: "",
  },
  play: async ({ args, canvas }) => {
    const textarea = canvas.getByRole("textbox");

    await userEvent.click(textarea);
    await userEvent.keyboard("{Enter}");
    await expect(args.onSubmit).not.toHaveBeenCalled();

    await userEvent.keyboard("{Control>}{Enter}{/Control}");
    await expect(args.onSubmit).toHaveBeenCalledTimes(1);

    await userEvent.keyboard("{Meta>}{Enter}{/Meta}");
    await expect(args.onSubmit).toHaveBeenCalledTimes(2);
  },
};

export const AutoResize: Story = {
  args: {
    maxRows: 6,
    rows: 2,
    value: "",
  },
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole("textbox");

    // Auto-height mode: no rows attribute, forced vertical scrollbar.
    await expect(textarea).not.toHaveAttribute("rows");
    await expect(textarea).toHaveStyle({ overflowY: "scroll" });

    // The height is computed once the textarea is visible.
    await waitFor(() => expect(textarea.style.height).toMatch(/^\d+px$/));
    const initialHeight = parseFloat(textarea.style.height);

    await userEvent.type(textarea, "one{Enter}two{Enter}three{Enter}four");

    await waitFor(() => {
      expect(parseFloat(textarea.style.height)).toBeGreaterThan(initialHeight);
    });
  },
};

export const Autofocus: Story = {
  args: {
    autofocus: true,
    value: "",
  },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByRole("textbox")).toHaveFocus());
  },
};

function CharacterCountDemo({
  value: initialValue,
  onInput,
  ...args
}: ComponentProps<typeof GlFormTextarea>) {
  const [value, setValue] = useState(initialValue ?? "");

  return (
    <div>
      <label htmlFor={args.id}>Textarea with character count</label>
      <GlFormTextarea
        {...args}
        value={value}
        onInput={(newValue) => {
          onInput?.(newValue);
          setValue(newValue);
        }} />
    </div>
  );
}

export const WithCharacterCount: Story = {
  args: {
    characterCountLimit: 100,
    overLimitText,
    remainingCountText,
    value: "",
  },
  render: (args) => <CharacterCountDemo {...args} />,
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole("textbox");

    // The textarea points at the screen-reader-only live region.
    const describedBy = textarea.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    await expect(canvas.getByTestId("count-text-sr-only")).toHaveAttribute("id", describedBy);

    // Both the visible count and the live region start with the same text.
    await expect(canvas.getAllByText("100 characters remaining.")).toHaveLength(2);

    await userEvent.type(textarea, "abc");

    // The visible count updates immediately…
    await expect(canvas.getByText("97 characters remaining.")).toBeInTheDocument();

    // …while the screen-reader-only announcement is debounced by 1s.
    const srOnly = canvas.getByTestId("count-text-sr-only");
    await expect(srOnly).toHaveTextContent("100 characters remaining.");
    await waitFor(() => expect(srOnly).toHaveTextContent("97 characters remaining."), {
      timeout: 2000,
    });
  },
};

export const WithCharacterCountOverLimit: Story = {
  args: {
    characterCountLimit: 10,
    overLimitText,
    remainingCountText,
    value: "a".repeat(15),
  },
  render: (args) => <CharacterCountDemo {...args} />,
  play: async ({ canvas }) => {
    const visibleCount = canvas
      .getAllByText("5 characters over limit.")
      .find((element) => element.tagName === "SMALL");

    await expect(visibleCount).toHaveClass("form-text", "gl-text-danger");
    await expect(visibleCount).toHaveAttribute("aria-hidden", "true");
    await expect(canvas.getByTestId("count-text-sr-only"))
      .toHaveTextContent("5 characters over limit.");
  },
};

export const WithCharacterCountAndClasses: Story = {
  args: {
    characterCountLimit: 100,
    overLimitText,
    remainingCountText,
    placeholder: "type longer text to see over limit text",
    textareaClasses: "!gl-rounded-lg gl-border-2",
    value: "",
  },
  render: (args) => <CharacterCountDemo {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox")).toHaveClass("!gl-rounded-lg", "gl-border-2");
  },
};
