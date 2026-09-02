import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState, type ComponentProps } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";

import GlFormTextarea from "./form-textarea";

function ControlledTextarea(args: ComponentProps<typeof GlFormTextarea>) {
  const [value, setValue] = useState(args.value ?? "");

  return (
    <GlFormTextarea
      {...args}
      value={value}
      onInput={(newValue) => {
        setValue(newValue);
        args.onInput?.(newValue);
      }} />
  );
}

function characterText(count: number, suffix: string) {
  return `${count} character${count === 1 ? "" : "s"} ${suffix}.`;
}

function CharacterCountTextarea(args: ComponentProps<typeof GlFormTextarea>) {
  const [value, setValue] = useState(args.value ?? "");
  const limit = args.characterCountLimit ?? 0;
  const remainingCount = limit - value.length;

  return (
    <GlFormTextarea
      {...args}
      value={value}
      onInput={(newValue) => {
        setValue(newValue);
        args.onInput?.(newValue);
      }}
      remainingCharacterCountText={characterText(Math.max(remainingCount, 0), "remaining")}
      characterCountOverLimitText={characterText(Math.max(-remainingCount, 0), "over limit")} />
  );
}

function RefTextarea(args: ComponentProps<typeof GlFormTextarea>) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <>
      <GlFormTextarea {...args} ref={textareaRef} />
      <button type="button" onClick={() => textareaRef.current?.select()}>
        Select textarea
      </button>
    </>
  );
}

const meta = {
  title: "UI/Base/Form Textarea",
  component: GlFormTextarea,
  args: {
    "aria-label": "Description",
    autofocus: false,
    characterCountLimit: null,
    debounce: 0,
    disabled: false,
    noResize: true,
    onBlur: fn(),
    onChange: fn(),
    onFocus: fn(),
    onInput: fn(),
    onSubmit: fn(),
    onUpdate: fn(),
    placeholder: "Enter a description",
    readOnly: false,
    required: false,
    rows: 4,
    state: null,
    submitOnEnter: false,
    value: "We continually adjust our values and strive to make them better.",
  },
  argTypes: {
    characterCountOverLimitText: {
      control: false,
    },
    formatter: {
      control: false,
    },
    onBlur: {
      control: false,
    },
    onChange: {
      control: false,
    },
    onFocus: {
      control: false,
    },
    onInput: {
      control: false,
    },
    onSubmit: {
      control: false,
    },
    onUpdate: {
      control: false,
    },
    remainingCharacterCountText: {
      control: false,
    },
    textareaClasses: {
      control: false,
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas textarea documentation](https://design.gitlab.com/components/textarea/) for usage and implementation guidance.",
      },
    },
  },
  render: (args) => <ControlledTextarea {...args} />,
} satisfies Meta<typeof GlFormTextarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas }) => {
    const textarea = canvas.getByRole("textbox", { name: "Description" });

    await userEvent.clear(textarea);
    await userEvent.type(textarea, "Hello");

    await expect(textarea).toHaveValue("Hello");
    await expect(args.onUpdate).toHaveBeenLastCalledWith("Hello");
    await expect(args.onInput).toHaveBeenLastCalledWith("Hello");

    await userEvent.tab();
    await expect(args.onBlur).toHaveBeenCalled();
    await expect(args.onChange).toHaveBeenLastCalledWith("Hello");
  },
};

export const WithCharacterCount: Story = {
  args: {
    characterCountLimit: 10,
    value: "",
  },
  render: (args) => <CharacterCountTextarea {...args} />,
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole("textbox", { name: "Description" });
    const liveRegion = canvas.getByTestId("count-text-sr-only");

    await expect(textarea).toHaveAttribute("aria-describedby", liveRegion.id);
    await expect(liveRegion).toHaveTextContent("10 characters remaining.");

    await userEvent.type(textarea, "12345678901");

    await expect(canvas.getByText("1 character over limit.", { selector: "small" }))
      .toHaveClass("gl-text-danger");
    await waitFor(
      () => expect(liveRegion).toHaveTextContent("1 character over limit."),
      { timeout: 2000 },
    );
  },
};

export const Debounced: Story = {
  args: {
    debounce: 200,
    value: "",
  },
  play: async ({ args, canvas }) => {
    const textarea = canvas.getByRole("textbox", { name: "Description" });

    await userEvent.type(textarea, "Debounced");

    await expect(textarea).toHaveValue("Debounced");
    await expect(args.onUpdate).toHaveBeenLastCalledWith("Debounced");
    await expect(args.onInput).not.toHaveBeenCalled();
    await waitFor(
      () => expect(args.onInput).toHaveBeenLastCalledWith("Debounced"),
      { timeout: 1000 },
    );
  },
};

export const SubmitOnEnter: Story = {
  args: {
    submitOnEnter: true,
    value: "",
  },
  play: async ({ args, canvas }) => {
    const textarea = canvas.getByRole("textbox", { name: "Description" });

    await userEvent.click(textarea);
    await userEvent.keyboard("{Control>}{Enter}{/Control}");

    await expect(args.onSubmit).toHaveBeenCalledOnce();
  },
};

export const Formatter: Story = {
  args: {
    formatter: (value) => value.toUpperCase(),
    value: "",
  },
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole("textbox", { name: "Description" });

    await userEvent.type(textarea, "formatted");
    await expect(textarea).toHaveValue("FORMATTED");
  },
};

export const FormatterCancellation: Story = {
  args: {
    formatter: (value) => value.includes("1") ? false : value,
    value: "",
  },
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole("textbox", { name: "Description" });

    await userEvent.type(textarea, "abc1");
    await expect(textarea).toHaveValue("abc");
  },
};

export const AutoHeight: Story = {
  args: {
    maxRows: 6,
    rows: 2,
    value: "One line",
  },
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole("textbox", { name: "Description" });

    await waitFor(() => expect(textarea.style.height).toMatch(/^\d+px$/));
    const initialHeight = Number.parseFloat(textarea.style.height);

    await userEvent.type(textarea, "{Enter}Two{Enter}Three{Enter}Four");
    await waitFor(() => {
      expect(Number.parseFloat(textarea.style.height)).toBeGreaterThan(initialHeight);
    });
    await expect(textarea).toHaveStyle({ overflowY: "scroll", resize: "none" });
  },
};

export const Resizable: Story = {
  args: {
    noResize: false,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox", { name: "Description" }))
      .not.toHaveAttribute("style");
  },
};

export const WithCustomClasses: Story = {
  args: {
    textareaClasses: ["!gl-rounded-lg", "gl-border-2"],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox", { name: "Description" }))
      .toHaveClass("!gl-rounded-lg", "gl-border-2");
  },
};

export const Autofocus: Story = {
  args: {
    autofocus: true,
    value: "",
  },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByRole("textbox", { name: "Description" })).toHaveFocus());
  },
};

export const ForwardedRef: Story = {
  args: {
    value: "Select this value",
  },
  render: (args) => <RefTextarea {...args} />,
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole("textbox", { name: "Description" }) as HTMLTextAreaElement;

    await userEvent.click(canvas.getByRole("button", { name: "Select textarea" }));
    await expect(textarea).toHaveFocus();
    await expect(textarea.selectionStart).toBe(0);
    await expect(textarea.selectionEnd).toBe(textarea.value.length);
  },
};
