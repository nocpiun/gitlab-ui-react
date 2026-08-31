import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ComponentProps } from "react";
import { expect, userEvent, waitFor } from "storybook/test";
import GlFormCharacterCount from "./form-character-count";

const remainingCountText = (count: number) => (
  count === 1 ? `${count} character remaining.` : `${count} characters remaining.`
);
const overLimitText = (count: number) => (
  count === 1 ? `${count} character over limit.` : `${count} characters over limit.`
);

const meta = {
  title: "UI/Base/Form Character Count",
  component: GlFormCharacterCount,
  args: {
    countTextId: "character-count-text",
    limit: 100,
    overLimitText,
    remainingCountText,
    value: "",
  },
  parameters: {
    docs: {
      description: {
        component:
          "See the [Pajamas character count documentation](https://design.gitlab.com/components/character-count) for usage and implementation details.",
      },
    },
  },
  render: (args) => <CharacterCountDemo {...args} />,
} satisfies Meta<typeof GlFormCharacterCount>;

export default meta;
type Story = StoryObj<typeof meta>;

function CharacterCountDemo({
  value: initialValue,
  countTextId,
  ...args
}: ComponentProps<typeof GlFormCharacterCount>) {
  const [value, setValue] = useState(initialValue ?? "");

  return (
    <div>
      <label htmlFor="character-count-input">Form input with character count</label>
      <textarea
        id="character-count-input"
        aria-describedby={countTextId}
        rows={3}
        cols={50}
        value={value}
        onChange={(event) => setValue(event.target.value)} />
      <GlFormCharacterCount {...args} countTextId={countTextId} value={value} />
    </div>
  );
}

export const Default: Story = {
  play: async ({ canvas }) => {
    const textarea = canvas.getByRole("textbox");

    // The input points at the screen-reader-only live region. Both the
    // visible count and the live region start with the same text.
    await expect(textarea).toHaveAttribute("aria-describedby", "character-count-text");
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

export const OverLimit: Story = {
  args: {
    limit: 10,
    value: "a".repeat(15),
  },
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
